import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xml2js from 'xml2js';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extrae texto simple de HTML
 */
function stripHTML(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parsea un archivo de mensaje individual
 */
async function parseMessageFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(content);

    const email = {
      from: '',
      to: '',
      subject: '',
      date: '',
      body: '',
      rawContent: content
    };

    // Extraer campos del email
    if (result && result.email) {
      const emailData = result.email;
      email.from = emailData.from || '';
      email.to = emailData.to || '';
      email.subject = emailData.subject || '';
      email.date = emailData.date || '';

      // Intentar extraer el cuerpo
      if (emailData.body) {
        email.body = stripHTML(emailData.body);
      } else if (emailData.html) {
        email.body = stripHTML(emailData.html);
      } else if (emailData.text) {
        email.body = emailData.text;
      }
    } else {
      // Si no es XML válido, intentar extraer campos con regex
      const fromMatch = content.match(/From:\s*([^\r\n]+)/i);
      const toMatch = content.match(/To:\s*([^\r\n]+)/i);
      const subjectMatch = content.match(/Subject:\s*([^\r\n]+)/i);
      const dateMatch = content.match(/Date:\s*([^\r\n]+)/i);

      email.from = fromMatch ? fromMatch[1].trim() : '';
      email.to = toMatch ? toMatch[1].trim() : '';
      email.subject = subjectMatch ? subjectMatch[1].trim() : '';
      email.date = dateMatch ? dateMatch[1].trim() : '';

      // Intentar extraer el cuerpo después de las cabeceras
      const bodyMatch = content.split(/\r?\n\r?\n/);
      if (bodyMatch.length > 1) {
        email.body = stripHTML(bodyMatch.slice(1).join('\n').substring(0, 1000));
      }
    }

    return email;
  } catch (error) {
    console.warn('⚠️ Error parseando mensaje:', error.message);
    return null;
  }
}

/**
 * Busca recursivamente archivos de mensajes en un directorio
 */
async function findMessageFiles(dir, files = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await findMessageFiles(fullPath, files);
      } else if (entry.isFile()) {
        // Los archivos de mensaje suelen tener extensiones .eml, .msg o sin extensión
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.eml' || ext === '.msg' || ext === '.xml' || ext === '') {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error leyendo directorio:', dir, error.message);
  }

  return files;
}

/**
 * Parsea un archivo OLM
 */
export async function parseOLMFile(olmFilePath) {
  const tempDir = path.join(__dirname, '../../temp', `olm-${Date.now()}`);

  try {
    // Crear directorio temporal
    await fs.mkdir(tempDir, { recursive: true });

    // Los archivos OLM son archivos ZIP
    console.log('📦 Extrayendo archivo OLM...');

    try {
      const zip = new AdmZip(olmFilePath);
      zip.extractAllTo(tempDir, true);
      console.log('✅ Archivo extraído exitosamente');
    } catch (zipError) {
      // Si falla como ZIP, intentar leerlo como archivo directo
      console.log('⚠️ No se pudo extraer como ZIP, intentando lectura directa...');
      throw zipError;
    }

    // Buscar todos los archivos de mensajes
    console.log('🔎 Buscando mensajes...');
    const messageFiles = await findMessageFiles(tempDir);
    console.log(`📧 Encontrados ${messageFiles.length} archivos de mensaje`);

    // Parsear cada mensaje
    const emails = [];
    for (const file of messageFiles.slice(0, 500)) { // Limitar a 500 mensajes para evitar sobrecarga
      const email = await parseMessageFile(file);
      if (email && (email.subject || email.body)) {
        emails.push(email);
      }
    }

    // Limpiar directorio temporal
    await fs.rm(tempDir, { recursive: true, force: true });

    return emails;
  } catch (error) {
    // Intentar limpiar en caso de error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.error('Error limpiando directorio temporal:', e);
    }

    throw new Error(`Error parseando archivo OLM: ${error.message}`);
  }
}
