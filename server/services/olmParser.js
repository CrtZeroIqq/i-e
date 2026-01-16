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
 * Extrae una dirección de email limpia de un string que puede contener nombre y email
 * Ejemplos: "John Doe <john@example.com>" -> "john@example.com"
 *           "john@example.com" -> "john@example.com"
 *           "=?UTF-8?Q?Name?= <email@domain.com>" -> "email@domain.com"
 */
function extractCleanEmail(emailString) {
  if (!emailString) return '';

  // Limpiar entidades HTML
  let cleaned = emailString
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();

  // Si hay múltiples destinatarios (separados por , o ;), tomar solo el primero
  if (cleaned.includes(',')) {
    cleaned = cleaned.split(',')[0].trim();
  } else if (cleaned.includes(';')) {
    cleaned = cleaned.split(';')[0].trim();
  }

  // Intentar extraer email entre < >
  const bracketMatch = cleaned.match(/<([^>]+)>/);
  if (bracketMatch) {
    cleaned = bracketMatch[1];
  }

  // Extraer solo la parte del email con regex - DEBE tener @ para ser válido
  const emailMatch = cleaned.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    return emailMatch[1].toLowerCase().trim();
  }

  // Si no se encontró un patrón de email válido con @, devolver cadena vacía
  return '';
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
      email.from = emailData.from ? extractCleanEmail(emailData.from) : '';
      email.to = emailData.to ? extractCleanEmail(emailData.to) : '';
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

      email.from = fromMatch ? extractCleanEmail(fromMatch[1]) : '';
      email.to = toMatch ? extractCleanEmail(toMatch[1]) : '';
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
 * Parsea el contenido de un archivo directamente desde el buffer
 */
function parseMessageContent(content) {
  try {
    const contentStr = content.toString('utf-8');

    const email = {
      from: '',
      to: '',
      subject: '',
      date: '',
      body: ''
    };

    // Extraer campos con regex (más flexible)
    const fromMatch = contentStr.match(/From:\s*([^\r\n]+)/i) ||
                     contentStr.match(/<OPFMessageCopyFromAddress>([^<]+)/i);
    const toMatch = contentStr.match(/To:\s*([^\r\n]+)/i) ||
                   contentStr.match(/<OPFMessageCopyToAddresses>([^<]+)/i);
    const subjectMatch = contentStr.match(/Subject:\s*([^\r\n]+)/i) ||
                        contentStr.match(/<OPFMessageCopySubject>([^<]+)/i);
    const dateMatch = contentStr.match(/Date:\s*([^\r\n]+)/i) ||
                     contentStr.match(/<OPFMessageCopySentTime>([^<]+)/i);

    email.from = fromMatch ? extractCleanEmail(fromMatch[1]) : '';
    email.to = toMatch ? extractCleanEmail(toMatch[1]) : '';
    email.subject = subjectMatch ? subjectMatch[1].trim() : '';
    email.date = dateMatch ? dateMatch[1].trim() : '';

    // Extraer cuerpo de múltiples formas
    const bodyMatch = contentStr.split(/\r?\n\r?\n/);
    if (bodyMatch.length > 1) {
      email.body = stripHTML(bodyMatch.slice(1).join('\n').substring(0, 2000));
    }

    // Si no hay body, intentar extraer de tags XML
    if (!email.body || email.body.length < 20) {
      const bodyXML = contentStr.match(/<OPFMessageCopyBody>([^<]+)/i);
      if (bodyXML) {
        email.body = stripHTML(bodyXML[1]).substring(0, 2000);
      }
    }

    // Aceptar el email solo si tiene un from O to válido (con @)
    // Esto evita aceptar basura como /b, /a, tags HTML, etc.
    const hasValidFrom = email.from && email.from.includes('@');
    const hasValidTo = email.to && email.to.includes('@');
    const hasSubject = email.subject && email.subject.length > 0;

    if ((hasValidFrom || hasValidTo) && hasSubject) {
      return email;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Parsea un archivo OLM leyendo directamente del ZIP
 */
export async function parseOLMFile(olmFilePath) {
  try {
    console.log('📦 Abriendo archivo OLM...');

    const zip = new AdmZip(olmFilePath);
    const zipEntries = zip.getEntries();

    console.log(`📧 Encontradas ${zipEntries.length} entradas en el archivo`);

    // Filtrar solo archivos que parezcan mensajes
    const messageEntries = zipEntries.filter(entry => {
      if (entry.isDirectory) return false;

      const name = entry.entryName.toLowerCase();
      // Buscar archivos en carpetas de mensajes
      return (name.includes('message') ||
              name.includes('inbox') ||
              name.includes('sent') ||
              name.includes('bandeja') ||
              name.includes('.eml') ||
              name.includes('.msg') ||
              (name.includes('com.microsoft') && !name.includes('attachment')));
    });

    console.log(`📬 Filtrando ${messageEntries.length} posibles mensajes...`);

    // Parsear TODOS los mensajes (no limitar)
    const emails = [];
    const limit = messageEntries.length;
    let parsed = 0;
    let skipped = 0;

    for (let i = 0; i < limit; i++) {
      const entry = messageEntries[i];

      try {
        const content = entry.getData();
        const email = parseMessageContent(content);

        if (email) {
          emails.push(email);
          parsed++;
        } else {
          skipped++;
        }
      } catch (parseError) {
        skipped++;
        continue;
      }

      // Log de progreso cada 100 mensajes
      if ((i + 1) % 100 === 0) {
        console.log(`📊 Procesados ${i + 1}/${limit} archivos (${parsed} emails, ${skipped} saltados)...`);
      }
    }

    console.log(`✅ Se parsearon ${emails.length} correos exitosamente de ${messageEntries.length} archivos`);
    console.log(`📈 Tasa de éxito: ${((emails.length / messageEntries.length) * 100).toFixed(1)}%`);
    return emails;

  } catch (error) {
    throw new Error(`Error parseando archivo OLM: ${error.message}`);
  }
}
