import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseOLMFile } from '../services/olmParser.js';
import { analyzeEmails } from '../services/aiService.js';
import { generateReport } from '../services/reportGenerator.js';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Asegurar que dotenv esté cargado
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'olm-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Leer límite de tamaño del .env
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '1073741824'); // 1GB por defecto
console.log(`🔧 Multer configurado con límite: ${maxFileSize} bytes (${(maxFileSize / 1024 / 1024).toFixed(2)} MB)`);

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.olm' || ext === '.zip') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .olm o .zip'));
    }
  }
});

// Ruta para subir y analizar archivo OLM
router.post('/upload', (req, res) => {
  upload.single('olmFile')(req, res, async (err) => {
    // Manejar errores de multer
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Archivo demasiado grande',
          message: `El archivo excede el límite de ${(maxFileSize / 1024 / 1024).toFixed(0)} MB`,
          limit: maxFileSize
        });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    let filePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
      }

    filePath = req.file.path;
    console.log('📁 Archivo recibido:', req.file.originalname);

    // Paso 1: Parsear archivo OLM
    console.log('🔍 Parseando archivo OLM...');
    const emails = await parseOLMFile(filePath);
    console.log(`✅ Se encontraron ${emails.length} correos`);

    // Paso 2: Analizar emails con IA
    console.log('🤖 Analizando emails con IA...');
    const analysis = await analyzeEmails(emails);
    console.log('✅ Análisis completado');

    // Paso 3: Generar informe
    console.log('📊 Generando informe de gestión...');
    const report = generateReport(emails, analysis);
    console.log('✅ Informe generado');

    // Limpiar archivo temporal
    await fs.unlink(filePath);

    res.json({
      success: true,
      emailCount: emails.length,
      report: report,
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ Error procesando archivo:', error);

    // Limpiar archivo si existe
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.error('Error eliminando archivo temporal:', e);
      }
    }

    res.status(500).json({
      error: 'Error procesando el archivo',
      message: error.message
    });
  }
  });
});

// Ruta para obtener estado del servidor de IA
router.get('/ai-status', async (req, res) => {
  try {
    const response = await fetch(process.env.AI_SERVER_URL || 'http://localhost:11434/api/tags');
    const data = await response.json();
    res.json({ status: 'connected', models: data.models });
  } catch (error) {
    res.json({ status: 'disconnected', error: error.message });
  }
});

export default router;
