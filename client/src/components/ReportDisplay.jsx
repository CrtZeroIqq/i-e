import React, { useState } from 'react';
import './ReportDisplay.css';

function ReportDisplay({ report, onReset }) {
  const [activeTab, setActiveTab] = useState('summary');

  const { emailCount, report: reportData } = report;
  const { executiveSummary, topCommunicators, activityTrends, keyTopics, aiAnalysis } = reportData;

  const downloadReport = () => {
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-emails-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <div className="report-title">
          <h2>📊 Informe de Gestión de Emails</h2>
          <p>Análisis completado: {new Date(reportData.metadata.generatedAt).toLocaleString('es')}</p>
        </div>
        <div className="report-actions">
          <button className="btn btn-download" onClick={downloadReport}>
            ⬇️ Descargar JSON
          </button>
          <button className="btn btn-secondary" onClick={onReset}>
            📁 Nuevo Análisis
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Resumen Ejecutivo
        </button>
        <button
          className={`tab ${activeTab === 'communicators' ? 'active' : ''}`}
          onClick={() => setActiveTab('communicators')}
        >
          Comunicadores
        </button>
        <button
          className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Tendencias
        </button>
        <button
          className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          Análisis IA
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📧</div>
                <div className="stat-value">{executiveSummary.totalEmails}</div>
                <div className="stat-label">Total de Emails</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👤</div>
                <div className="stat-value">{executiveSummary.uniqueSenders}</div>
                <div className="stat-label">Remitentes Únicos</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-value">{executiveSummary.uniqueRecipients}</div>
                <div className="stat-label">Destinatarios Únicos</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{executiveSummary.completionRate}%</div>
                <div className="stat-label">Tasa de Completitud</div>
              </div>
            </div>

            <div className="section">
              <h3>🔑 Palabras Clave Principales</h3>
              <div className="keywords-cloud">
                {keyTopics.keywords.slice(0, 15).map((kw, idx) => (
                  <span
                    key={idx}
                    className="keyword-tag"
                    style={{
                      fontSize: `${0.9 + (kw.count / keyTopics.keywords[0].count) * 0.6}rem`
                    }}
                  >
                    {kw.keyword} ({kw.count})
                  </span>
                ))}
              </div>
            </div>

            <div className="section">
              <h3>💡 Recomendaciones</h3>
              <ul className="recommendations-list">
                {reportData.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'communicators' && (
          <div className="communicators-tab">
            <div className="two-column">
              <div className="section">
                <h3>📤 Top Remitentes</h3>
                <div className="communicators-list">
                  {topCommunicators.senders.map((sender, idx) => (
                    <div key={idx} className="communicator-item">
                      <div className="communicator-rank">#{idx + 1}</div>
                      <div className="communicator-info">
                        <div className="communicator-email">{sender.email}</div>
                        <div className="communicator-bar">
                          <div
                            className="communicator-bar-fill"
                            style={{
                              width: `${(sender.count / topCommunicators.senders[0].count) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="communicator-count">{sender.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>📥 Top Destinatarios</h3>
                <div className="communicators-list">
                  {topCommunicators.recipients.map((recipient, idx) => (
                    <div key={idx} className="communicator-item">
                      <div className="communicator-rank">#{idx + 1}</div>
                      <div className="communicator-info">
                        <div className="communicator-email">{recipient.email}</div>
                        <div className="communicator-bar">
                          <div
                            className="communicator-bar-fill recipient"
                            style={{
                              width: `${(recipient.count / topCommunicators.recipients[0].count) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="communicator-count">{recipient.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="trends-tab">
            <div className="section">
              <h3>📈 Actividad por Fecha</h3>
              {activityTrends.byDate && activityTrends.byDate.length > 0 ? (
                <div className="activity-chart">
                  {activityTrends.byDate.map((day, idx) => (
                    <div key={idx} className="activity-bar-container">
                      <div className="activity-date">{day.date}</div>
                      <div className="activity-bar-wrapper">
                        <div
                          className="activity-bar"
                          style={{
                            width: `${(day.count / activityTrends.byDate[0].count) * 100}%`
                          }}
                        >
                          <span className="activity-count">{day.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No hay datos de fechas disponibles en los emails analizados.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="ai-tab">
            <div className="section">
              <h3>🤖 Análisis con Inteligencia Artificial</h3>
              <div className="ai-analysis">
                <pre>{aiAnalysis}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportDisplay;
