import fetch from 'node-fetch';

/**
 * Prepara un resumen de los emails para el análisis
 */
function prepareEmailSummary(emails) {
  const summary = {
    total: emails.length,
    senders: {},
    recipients: {},
    subjects: [],
    dates: [],
    topicsPreview: []
  };

  // Limitar a los primeros 100 emails para el análisis detallado
  const emailsToAnalyze = emails.slice(0, 100);

  emailsToAnalyze.forEach(email => {
    // Contar remitentes
    if (email.from) {
      summary.senders[email.from] = (summary.senders[email.from] || 0) + 1;
    }

    // Contar destinatarios
    if (email.to) {
      summary.recipients[email.to] = (summary.recipients[email.to] || 0) + 1;
    }

    // Recolectar asuntos
    if (email.subject) {
      summary.subjects.push(email.subject);
    }

    // Recolectar fechas
    if (email.date) {
      summary.dates.push(email.date);
    }

    // Muestra de contenido
    if (email.body) {
      summary.topicsPreview.push({
        subject: email.subject,
        preview: email.body.substring(0, 200)
      });
    }
  });

  return summary;
}

/**
 * Genera el prompt para el análisis de emails
 */
function generateAnalysisPrompt(emailSummary) {
  const topSenders = Object.entries(emailSummary.senders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sender, count]) => `${sender}: ${count} emails`)
    .join('\n');

  const topRecipients = Object.entries(emailSummary.recipients)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([recipient, count]) => `${recipient}: ${count} emails`)
    .join('\n');

  const sampleSubjects = emailSummary.subjects.slice(0, 20).join('\n');

  const sampleTopics = emailSummary.topicsPreview
    .slice(0, 10)
    .map(t => `Asunto: ${t.subject}\nContenido: ${t.preview}`)
    .join('\n\n---\n\n');

  return `Eres un analista de gestión empresarial. Analiza estos ${emailSummary.total} correos electrónicos y genera un INFORME EJECUTIVO DE INNOVACIÓN Y GESTIÓN 2025.

DATOS DE CORREOS ANALIZADOS:

REMITENTES MÁS FRECUENTES:
${topSenders}

DESTINATARIOS MÁS FRECUENTES:
${topRecipients}

ASUNTOS DE EJEMPLO:
${sampleSubjects}

MUESTRA DE CONTENIDO:
${sampleTopics}

GENERA UN INFORME EJECUTIVO ESTRUCTURADO QUE INCLUYA:

## 1. RESUMEN EJECUTIVO
Breve resumen del análisis de comunicaciones y principales hallazgos.

## 2. INICIATIVAS DE INNOVACIÓN IDENTIFICADAS
- Proyectos de innovación mencionados en los correos
- Nuevas tecnologías o metodologías discutidas
- Propuestas de mejora o transformación digital
- Colaboraciones innovadoras

## 3. GESTIÓN Y OPERACIONES
- Principales temas de gestión tratados
- Decisiones estratégicas comunicadas
- Proyectos en curso y su estado
- Desafíos operativos identificados

## 4. COLABORACIÓN Y EQUIPOS
- Patrones de colaboración entre equipos
- Personas clave en la organización
- Dinámicas de comunicación interdepartamental

## 5. LOGROS Y RESULTADOS 2025
- Hitos alcanzados mencionados
- Resultados positivos comunicados
- Éxitos celebrados

## 6. ÁREAS DE OPORTUNIDAD
- Temas recurrentes que requieren atención
- Posibles mejoras en comunicación
- Oportunidades de innovación no aprovechadas

## 7. RECOMENDACIONES ESTRATÉGICAS
- Acciones prioritarias para 2026
- Áreas de inversión en innovación
- Mejoras en procesos de comunicación y gestión

Responde en español de forma estructurada, profesional y enfocada en innovación y gestión estratégica.`;
}

/**
 * Envía una solicitud al servidor de IA
 */
async function callAIServer(prompt) {
  const aiUrl = process.env.AI_SERVER_URL || 'http://localhost:11434/api/generate';
  const aiModel = process.env.AI_MODEL || 'llama2';

  try {
    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor de IA: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || data.text || JSON.stringify(data);
  } catch (error) {
    console.error('❌ Error llamando al servidor de IA:', error);

    // Si el servidor de IA no está disponible, generar un análisis básico
    return generateFallbackAnalysis();
  }
}

/**
 * Genera un análisis básico si el servidor de IA no está disponible
 */
function generateFallbackAnalysis() {
  return `NOTA: El servidor de IA no está disponible. Este es un análisis básico generado automáticamente.

El análisis detallado con IA requiere que el servidor de IA esté configurado y funcionando.
Por favor, verifica la configuración de AI_SERVER_URL en el archivo .env

Para usar análisis con IA, puedes configurar:
- Ollama (local): http://localhost:11434/api/generate
- OpenAI API
- Otro servidor de IA compatible

Mientras tanto, puedes revisar las métricas básicas en el informe.`;
}

/**
 * Analiza emails usando el servidor de IA
 */
export async function analyzeEmails(emails) {
  console.log('📊 Preparando resumen de emails...');
  const emailSummary = prepareEmailSummary(emails);

  console.log('🤖 Generando análisis con IA...');
  const prompt = generateAnalysisPrompt(emailSummary);
  const analysis = await callAIServer(prompt);

  return {
    summary: emailSummary,
    aiAnalysis: analysis,
    timestamp: new Date().toISOString()
  };
}
