import React, { useState, useRef } from 'react';
import './FileUpload.css';

function FileUpload({ onFileSelect, error }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'olm' && ext !== 'zip') {
      alert('Por favor selecciona un archivo .olm o .zip');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-container">
      <div className="upload-card">
        <h2>Sube tu archivo OLM</h2>
        <p className="upload-description">
          Arrastra y suelta tu archivo de Outlook (.olm) o haz clic para seleccionarlo
        </p>

        <div
          className={`drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".olm,.zip"
            onChange={handleChange}
            style={{ display: 'none' }}
          />

          {!selectedFile ? (
            <>
              <div className="upload-icon">📁</div>
              <p className="drop-text">
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p className="file-types">
                Formatos soportados: .olm, .zip
              </p>
            </>
          ) : (
            <>
              <div className="upload-icon">✅</div>
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        {selectedFile && (
          <div className="upload-actions">
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              Analizar Archivo
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedFile(null)}
            >
              Cancelar
            </button>
          </div>
        )}

        <div className="info-box">
          <h3>¿Qué es un archivo OLM?</h3>
          <p>
            Los archivos .olm son exportaciones de correo de Outlook para Mac.
            Para exportar tus correos:
          </p>
          <ol>
            <li>Abre Outlook para Mac</li>
            <li>Ve a Herramientas → Exportar</li>
            <li>Selecciona los elementos a exportar</li>
            <li>Guarda el archivo .olm</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
