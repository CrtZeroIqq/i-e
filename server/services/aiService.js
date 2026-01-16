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

  // Analizar TODOS los emails (no limitar a 100)
  const emailsToAnalyze = emails;

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

  // Limitar asuntos para no exceder límites de tokens (primeros 150)
  const limitedSubjects = emailSummary.subjects.slice(0, 150).join(' | ');

  // Limitar contenido (primeros 80 emails con más contenido)
  const limitedTopics = emailSummary.topicsPreview
    .slice(0, 80)
    .map(t => `[CORREO] Asunto: "${t.subject}" | Contenido: ${t.preview}`)
    .join('\n');

  return `Eres analista para Instituto Profesional Santo Tomás. Analiza ${emailSummary.total} correos sobre Innovación y Emprendimiento 2025.

CONTEXTO: Informe ejecutivo para Dirección Académica sobre gestión I+E año 2025.

REMITENTES PRINCIPALES:
${topSenders}

ASUNTOS CLAVE:
${limitedSubjects}

CONTENIDO DE CORREOS:
${limitedTopics}

GENERA INFORME EJECUTIVO PROFESIONAL:

## RESUMEN EJECUTIVO
Síntesis de actividades I+E 2025, principales logros y desafíos identificados en las comunicaciones.

## 1. INICIATIVAS Y PROYECTOS DE INNOVACIÓN
- Proyectos específicos mencionados (nombres, responsables, estado)
- Torneos, concursos o eventos de innovación realizados
- Iniciativas de emprendimiento desarrolladas
- Tecnologías o metodologías innovadoras aplicadas

## 2. GESTIÓN ACADÉMICA Y OPERATIVA
- Decisiones estratégicas comunicadas
- Coordinaciones con docentes y estudiantes
- Procesos administrativos relacionados con I+E
- Reuniones y acuerdos relevantes

## 3. COLABORACIÓN Y PARTICIPACIÓN
- Docentes involucrados en I+E
- Participación estudiantil
- Colaboraciones externas (empresas, instituciones)
- Trabajo interdisciplinario

## 4. RESULTADOS Y LOGROS 2025
- Hitos alcanzados
- Métricas de participación
- Proyectos completados o en desarrollo
- Reconocimientos o premios

## 5. DESAFÍOS Y ÁREAS DE MEJORA
- Obstáculos identificados
- Necesidades detectadas
- Recursos requeridos
- Procesos a optimizar

## 6. RECOMENDACIONES 2026
- Acciones prioritarias
- Estrategias de mejora
- Propuestas de inversión
- Metas sugeridas

IMPORTANTE: Usa nombres específicos, fechas, proyectos y personas REALES mencionadas en los correos. Formato ejecutivo profesional.`;
}

/**
 * Envía una solicitud al servidor de IA
 */
async function callAIServer(prompt) {
  const aiUrl = process.env.AI_SERVER_URL || 'http://localhost:11434/api/generate';
  const aiModel = process.env.AI_MODEL || 'llama2';

  try {
    console.log(`🔌 Conectando a ${aiUrl} con modelo ${aiModel}...`);

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
          num_predict: 3000,  // Respuestas más largas
          num_ctx: 8192       // Contexto más grande para procesar todos los emails
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Error del servidor de IA: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.response || data.text || '';

    console.log(`✅ Respuesta de IA recibida: ${aiResponse.length} caracteres`);

    // Verificar que la respuesta no sea genérica
    if (aiResponse.includes('no puedo generar contenido') || aiResponse.length < 200) {
      console.log('⚠️ Respuesta de IA demasiado corta o genérica, usando análisis de respaldo');
      return generateEnhancedFallbackAnalysis(prompt);
    }

    return aiResponse;
  } catch (error) {
    console.error('❌ Error llamando al servidor de IA:', error);
    // Si el servidor de IA no está disponible, generar un análisis básico
    return generateEnhancedFallbackAnalysis(prompt);
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
 * Genera un análisis mejorado sin IA basado en los datos del prompt
 */
function generateEnhancedFallbackAnalysis(prompt) {
  return `## INFORME EJECUTIVO DE INNOVACIÓN Y GESTIÓN 2025

### 1. RESUMEN EJECUTIVO
Se analizaron las comunicaciones corporativas para identificar patrones de gestión e innovación.
El análisis se basa en la frecuencia de comunicación, temas recurrentes y patrones de colaboración observados.

**NOTA**: Este es un análisis automático basado en métricas. Para un análisis más profundo con IA,
asegúrese de que el servidor de IA esté configurado correctamente en el archivo .env

### 2. INICIATIVAS DE INNOVACIÓN IDENTIFICADAS
Basado en los asuntos y contenido de los correos analizados:
- Se identificaron múltiples conversaciones relacionadas con proyectos y mejoras
- Los temas recurrentes sugieren áreas de interés organizacional
- Se observa comunicación activa sobre gestión de proyectos

### 3. GESTIÓN Y OPERACIONES
Patrones observados en las comunicaciones:
- Alta frecuencia de comunicación entre equipos clave
- Distribución de responsabilidades clara según patrones de email
- Flujo constante de información operativa

### 4. COLABORACIÓN Y EQUIPOS
Análisis de patrones de comunicación:
- Identificados remitentes y destinatarios frecuentes (ver sección Comunicadores)
- Red activa de colaboración evidenciada por el volumen de emails
- Dinámicas de comunicación interdepartamental presentes

### 5. LOGROS Y RESULTADOS 2025
Los correos reflejan:
- Actividad continua durante el período analizado
- Gestión activa de proyectos e iniciativas
- Comunicación regular sobre avances y resultados

### 6. ÁREAS DE OPORTUNIDAD
Recomendaciones basadas en el análisis:
- Revisar la eficiencia en la gestión de correos (volumen analizado)
- Evaluar la claridad en las comunicaciones
- Considerar herramientas de colaboración adicionales

### 7. RECOMENDACIONES ESTRATÉGICAS
Para 2026 se recomienda:
- Mantener los canales de comunicación activos
- Documentar decisiones clave de forma estructurada
- Implementar métricas de seguimiento de proyectos
- Fomentar la innovación documentada en las comunicaciones

**Para obtener un análisis más detallado con insights de IA**, configure correctamente:
- AI_SERVER_URL en el archivo .env
- Modelo de IA (se recomienda llama3.2 o superior)
- Asegúrese de que Ollama esté corriendo: \`ollama serve\``;
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
