import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import ReportDisplay from './components/ReportDisplay';

function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    setReport(null);

    const formData = new FormData();
    formData.append('olmFile', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar el archivo');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1>📧 Analizador de Emails OLM</h1>
          <p>Sube tu archivo de Outlook y obtén un informe de gestión completo</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {!report && !loading && (
            <FileUpload
              onFileSelect={handleFileUpload}
              error={error}
            />
          )}

          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <h2>Analizando tus correos...</h2>
              <p>Esto puede tomar unos momentos dependiendo del tamaño del archivo</p>
            </div>
          )}

          {report && !loading && (
            <ReportDisplay
              report={report}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>Analizador de Emails OLM con IA - v1.0.0</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
