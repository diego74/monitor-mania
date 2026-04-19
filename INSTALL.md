# Monitor de Manía - App React + Electron + SQLite

## 📦 Instalación

### Requisitos:
- Node.js (v14+)
- npm o yarn

### Pasos:

1. **Clonar o descargar el proyecto**
```bash
cd monitor-mania-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar la app**
```bash
npm start
```

Esto abrirá la app en Electron automáticamente con React en background.

---

## 🎯 Cómo Usar

### Tab 1: Tu Test (Cuidador)
1. Observa a Daniela los últimos 2-3 horas
2. Responde las 10 preguntas
3. Haz clic en "✓ Guardar Test"
4. Los datos se guardan en SQLite automáticamente

### Tab 2: Test Daniela
1. Ella responde las 8 preguntas
2. No sabe que estamos midiendo síntomas maníacos
3. Haz clic en "✓ Guardar Test"

### Tab 3: Análisis
- **Resumen:** Ver comparación lado a lado
  - Verde ✓ = Coinciden
  - Rojo ⚠️ = Divergencia (falta de conciencia)
- **Gráfico:** Línea temporal de ambas perspectivas

---

## 📊 Datos Guardados

Todo se guarda en SQLite localmente:
- `~/.config/monitor-mania-app/monitor-mania.db` (Linux/Mac)
- `%APPDATA%/monitor-mania-app/monitor-mania.db` (Windows)

### Tablas:
- `caregiver_tests` — Tests que TÚ completas
- `patient_tests` — Tests que ella completa

---

## 💾 Exportar Datos

Haz clic en "⬇️ Descargar" en el header para descargar un JSON con todos los datos históricos.

```json
{
  "timestamp": "2026-04-19T...",
  "caregiver": [
    {
      "id": 1,
      "date": "19/04/2026",
      "timestamp": "...",
      "cg1": 2,
      "cg2": 1,
      ...
    }
  ],
  "patient": [...]
}
```

---

## 🏗️ Estructura del Proyecto

```
monitor-mania-app/
├── public/
│   ├── electron.js (app Electron principal)
│   └── preload.js (puente entre React y Electron)
├── src/
│   ├── App.js (componente principal)
│   ├── App.css
│   ├── pages/
│   │   ├── CaregiverTest.js
│   │   ├── PatientTest.js
│   │   └── Analysis.js
│   └── styles/
│       ├── TestPage.css
│       └── Analysis.css
├── package.json
└── index.js
```

---

## 🔧 Desarrollo

### Cambiar puerto de React:
En el archivo `electron.js`, cambiar:
```javascript
const startUrl = 'http://localhost:3000'; // Cambiar a otro puerto si es necesario
```

### Agregar más preguntas:
En los archivos de tests (`CaregiverTest.js`, `PatientTest.js`), agregar a los arrays `caregiverQuestions` y `patientQuestions`.

### Cambiar base de datos:
Para usar PostgreSQL o MySQL en lugar de SQLite, reemplazar `sqlite3` con el driver correspondiente en `electron.js`.

---

## 📦 Empaquetar como .exe o .app

```bash
npm run build
```

Esto genera un instalador que se puede distribuir sin necesidad de Node.js.

---

## 🆘 Troubleshooting

### "Cannot find module 'sqlite3'"
```bash
npm install sqlite3 --build-from-source
```

### App no abre
```bash
npm install
npm start
```

### Datos no se guardan
- Verificar que la carpeta userData existe
- En `electron.js`, revisar `app.getPath('userData')`

---

## 📝 Notas

- La app funciona **100% offline**
- Los datos solo existen en tu computadora
- Cada test guardado tiene timestamp automático
- El gráfico muestra tendencias en tiempo real

---

¡Listo para usar! 🚀
