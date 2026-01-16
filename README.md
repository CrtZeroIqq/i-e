# 📧 Analizador de Emails OLM con IA

Plataforma web completa para analizar archivos OLM de Outlook y generar informes de gestión inteligentes utilizando IA.

## 🚀 Características

- ✅ **Subida de archivos OLM**: Interfaz drag & drop intuitiva
- 🔍 **Parser OLM avanzado**: Extrae y procesa correos electrónicos de archivos .olm
- 🤖 **Análisis con IA**: Utiliza un servidor de IA para generar insights
- 📊 **Informes detallados**: Métricas, tendencias y análisis ejecutivo
- 💡 **Visualización interactiva**: Dashboard con pestañas para explorar datos
- 📥 **Exportación**: Descarga informes en formato JSON

## 📋 Requisitos Previos

- Node.js v18 o superior
- npm o yarn
- Servidor de IA (Ollama, OpenAI API, u otro compatible)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd i-e
```

### 2. Instalar dependencias del backend

```bash
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd client
npm install
cd ..
```

### 4. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```env
# Puerto del servidor backend
PORT=3001

# URL del servidor de IA (Ollama por defecto)
AI_SERVER_URL=http://localhost:11434/api/generate

# Modelo de IA a utilizar
AI_MODEL=llama2

# Tamaño máximo de archivo en bytes (100MB por defecto)
MAX_FILE_SIZE=104857600
```

## 🎯 Configuración del Servidor de IA

### Opción 1: Ollama (Recomendado para uso local)

1. Instala Ollama desde [ollama.ai](https://ollama.ai)
2. Descarga un modelo:
   ```bash
   ollama pull llama2
   ```
3. El servidor se ejecutará automáticamente en `http://localhost:11434`

### Opción 2: OpenAI API

Modifica el archivo `server/services/aiService.js` para usar la API de OpenAI:

```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  })
});
```

### Opción 3: Otro servidor de IA

Actualiza `AI_SERVER_URL` en el archivo `.env` con tu URL del servidor.

## 🚀 Ejecución

### Modo Desarrollo

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

El frontend estará disponible en: `http://localhost:3000`
El backend estará disponible en: `http://localhost:3001`

### Modo Producción

1. Construir el frontend:
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. Iniciar el servidor:
   ```bash
   npm start
   ```

La aplicación estará disponible en: `http://localhost:3001`

## 📖 Uso

### 1. Exportar emails desde Outlook

**Outlook para Mac:**
1. Abre Outlook para Mac
2. Ve a **Herramientas** → **Exportar**
3. Selecciona los elementos que deseas exportar
4. Guarda el archivo con extensión `.olm`

**Outlook para Windows:**
Los archivos OLM son específicos de Mac. Para Windows, necesitarás:
1. Usar una herramienta de conversión PST a OLM
2. O procesar directamente archivos PST (requiere modificaciones)

### 2. Subir y analizar

1. Abre la aplicación web
2. Arrastra tu archivo `.olm` o haz clic para seleccionarlo
3. Haz clic en "Analizar Archivo"
4. Espera mientras se procesa (puede tomar algunos minutos)
5. Explora el informe generado

### 3. Revisar el informe

El informe incluye 4 pestañas:

- **Resumen Ejecutivo**: Métricas generales y palabras clave
- **Comunicadores**: Top remitentes y destinatarios
- **Tendencias**: Actividad por fecha
- **Análisis IA**: Insights generados por inteligencia artificial

## 🏗️ Estructura del Proyecto

```
i-e/
├── server/                 # Backend Node.js/Express
│   ├── index.js           # Servidor principal
│   ├── routes/            # Rutas de la API
│   │   └── upload.js      # Endpoint de subida
│   └── services/          # Lógica de negocio
│       ├── olmParser.js   # Parser de archivos OLM
│       ├── aiService.js   # Integración con IA
│       └── reportGenerator.js  # Generador de informes
├── client/                # Frontend React
│   ├── src/
│   │   ├── App.jsx        # Componente principal
│   │   ├── components/    # Componentes React
│   │   │   ├── FileUpload.jsx
│   │   │   └── ReportDisplay.jsx
│   │   └── main.jsx       # Punto de entrada
│   ├── index.html         # HTML base
│   ├── vite.config.js     # Configuración de Vite
│   └── package.json       # Dependencias del cliente
├── uploads/               # Archivos temporales (git ignored)
├── temp/                  # Archivos extraídos (git ignored)
├── .env                   # Variables de entorno (git ignored)
├── .env.example           # Ejemplo de configuración
├── package.json           # Dependencias del servidor
└── README.md              # Esta documentación
```

## 🔧 API Endpoints

### POST `/api/upload`

Sube y analiza un archivo OLM.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `olmFile` (archivo .olm o .zip)

**Response:**
```json
{
  "success": true,
  "emailCount": 150,
  "report": {
    "metadata": { ... },
    "executiveSummary": { ... },
    "topCommunicators": { ... },
    "activityTrends": { ... },
    "keyTopics": { ... },
    "aiAnalysis": "...",
    "recommendations": [ ... ]
  },
  "analysis": { ... }
}
```

### GET `/api/health`

Verifica el estado del servidor.

**Response:**
```json
{
  "status": "ok",
  "message": "Servidor funcionando correctamente"
}
```

### GET `/api/ai-status`

Verifica la conexión con el servidor de IA.

**Response:**
```json
{
  "status": "connected",
  "models": [ ... ]
}
```

## 📊 Formato del Informe

El informe generado incluye:

- **Metadata**: Fecha de generación, versión, emails analizados
- **Resumen Ejecutivo**: Total de emails, remitentes únicos, destinatarios únicos, tasa de completitud
- **Top Comunicadores**: Remitentes y destinatarios más frecuentes con gráficos
- **Tendencias de Actividad**: Volumen de emails por fecha
- **Temas Clave**: Palabras clave extraídas de los asuntos
- **Análisis de IA**: Insights generados por el modelo de IA
- **Recomendaciones**: Sugerencias para mejorar la gestión

## 🐛 Solución de Problemas

### El servidor de IA no se conecta

- Verifica que Ollama esté ejecutándose: `ollama list`
- Comprueba la URL en `.env`
- Revisa los logs del servidor

### Error al procesar archivo OLM

- Asegúrate de que el archivo sea un `.olm` válido
- Verifica que no exceda el límite de tamaño (100MB por defecto)
- Revisa los permisos de las carpetas `uploads/` y `temp/`

### Frontend no se conecta al backend

- Verifica que ambos servidores estén ejecutándose
- Comprueba el proxy en `client/vite.config.js`
- Revisa la consola del navegador para errores CORS

## 🔒 Seguridad

- Los archivos subidos se eliminan automáticamente después del análisis
- Limita el tamaño de archivos con `MAX_FILE_SIZE`
- No se almacenan datos de emails permanentemente
- Usa HTTPS en producción

## 🚀 Mejoras Futuras

- [ ] Soporte para archivos PST (Outlook Windows)
- [ ] Múltiples idiomas en la interfaz
- [ ] Exportación de informes en PDF
- [ ] Análisis de sentimientos en los emails
- [ ] Dashboard con histórico de análisis
- [ ] Filtros avanzados por fecha/remitente
- [ ] Detección de spam y phishing
- [ ] Integración con más modelos de IA

## 📝 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 👥 Autor

Creado con ❤️ para análisis inteligente de emails

## 📧 Soporte

Si encuentras algún problema o tienes sugerencias, por favor abre un issue en el repositorio.
