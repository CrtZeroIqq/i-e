/**
 * Calcula estadísticas básicas de los emails
 */
function calculateStats(emails) {
  const stats = {
    total: emails.length,
    withSubject: 0,
    withBody: 0,
    uniqueSenders: new Set(),
    uniqueRecipients: new Set(),
    byDate: {},
    topSenders: {},
    topRecipients: {}
  };

  emails.forEach(email => {
    if (email.subject) stats.withSubject++;
    if (email.body) stats.withBody++;

    // Solo contar emails válidos (que contengan @)
    if (email.from && email.from.includes('@')) {
      stats.uniqueSenders.add(email.from);
      stats.topSenders[email.from] = (stats.topSenders[email.from] || 0) + 1;
    }

    if (email.to && email.to.includes('@')) {
      stats.uniqueRecipients.add(email.to);
      stats.topRecipients[email.to] = (stats.topRecipients[email.to] || 0) + 1;
    }

    // Agrupar por fecha (si está disponible)
    if (email.date) {
      try {
        const date = new Date(email.date);
        const dateKey = date.toISOString().split('T')[0];
        stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
      } catch (e) {
        // Ignorar fechas inválidas
      }
    }
  });

  // Convertir sets a números
  stats.uniqueSenders = stats.uniqueSenders.size;
  stats.uniqueRecipients = stats.uniqueRecipients.size;

  // Top 10 remitentes y destinatarios
  stats.topSenders = Object.entries(stats.topSenders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([email, count]) => ({ email, count }));

  stats.topRecipients = Object.entries(stats.topRecipients)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([email, count]) => ({ email, count }));

  // Actividad por fecha (últimos 30 días con actividad)
  stats.activityByDate = Object.entries(stats.byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30)
    .map(([date, count]) => ({ date, count }));

  return stats;
}

/**
 * Identifica palabras clave en los asuntos
 */
function extractKeywords(emails) {
  const keywords = {};

  // Palabras comunes a ignorar (stopwords en español)
  const stopwords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
    'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
    'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
    'la', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy',
    'sin', 'vez', 'mucho', 'saber', 're', 'fw', 'fwd', 'res'
  ]);

  emails.forEach(email => {
    if (email.subject) {
      const words = email.subject
        .toLowerCase()
        .replace(/[^\w\sáéíóúñü]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopwords.has(word));

      words.forEach(word => {
        keywords[word] = (keywords[word] || 0) + 1;
      });
    }
  });

  return Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));
}

/**
 * Genera el informe completo
 */
export function generateReport(emails, analysis) {
  const stats = calculateStats(emails);
  const keywords = extractKeywords(emails);

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      emailsAnalyzed: emails.length,
      version: '1.0.0'
    },

    executiveSummary: {
      totalEmails: stats.total,
      uniqueSenders: stats.uniqueSenders,
      uniqueRecipients: stats.uniqueRecipients,
      emailsWithSubject: stats.withSubject,
      emailsWithBody: stats.withBody,
      completionRate: Math.round((stats.withBody / stats.total) * 100)
    },

    topCommunicators: {
      senders: stats.topSenders,
      recipients: stats.topRecipients
    },

    activityTrends: {
      byDate: stats.activityByDate
    },

    keyTopics: {
      keywords: keywords,
      description: 'Palabras clave más frecuentes en los asuntos de los correos'
    },

    aiAnalysis: analysis.aiAnalysis,

    recommendations: [
      'Revisar la comunicación con los remitentes más frecuentes',
      'Identificar patrones de respuesta y tiempos de gestión',
      'Establecer filtros para organizar correos por temas clave',
      'Considerar automatizaciones para respuestas comunes',
      'Evaluar la carga de trabajo basada en el volumen de emails'
    ],

    rawData: {
      sampleEmails: emails.slice(0, 5).map(e => ({
        from: e.from,
        to: e.to,
        subject: e.subject,
        date: e.date,
        preview: e.body ? e.body.substring(0, 100) + '...' : ''
      }))
    }
  };

  return report;
}
