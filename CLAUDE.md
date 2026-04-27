# Monitor Bipolar — Plataforma de Seguimiento del Trastorno Bipolar

## Propósito
Aplicación web para seguimiento del estado anímico de una paciente con trastorno bipolar (Daniela).
Permite al cuidador registrar observaciones de manía, enviar tests de ánimo al paciente, y analizar tendencias con un gráfico bipolar (manía/depresión).

## Stack Técnico
- **React 18** + Create React App 5.x (NO migrar a Vite)
- **React Router v6** con HashRouter (requerido por GitHub Pages)
- **Firebase Firestore** como backend (sin autenticación — tokens URL simples)
- **Tailwind CSS 3.x** con tokens de marca en `tailwind.config.js`
- **Lucide React** para íconos SVG (no emojis como íconos)
- **Chart.js** + `react-chartjs-2` para gráficos
- Desplegado en **GitHub Pages** (`npm run deploy` → rama `gh-pages`)

## Comandos
```
npm start        — dev server (puerto 3000)
npm run build    — build de producción
npm run deploy   — build + deploy a GitHub Pages
```

## Estructura de Directorios
```
src/
  App.js                  — Router principal + RoleProvider + AppRoutes
  contexts/AppContext.js  — role, patientId, patientName (global)
  hooks/useRole.js        — lee rol del prefijo de URL (/p/* = patient)
  pages/
    Dashboard.js          — inicio: estado actual, acciones rápidas
    CaregiverPortal.js    — portal: elegir test o generar link para paciente
    ManiaTest.js          — ManiaTestCaregiver + ManiaTestPatient (exports nombrados)
    MoodTest.js           — test comprensivo de ánimo (18 preguntas)
    AnalysisReports.js    — análisis: resumen, radar, gráfico bipolar, reportes
    Tips.js               — consejos por fase (manía/depresión/estable)
    Resources.js          — recursos de crisis y contactos
    About.js              — educación sobre trastorno bipolar
  components/
    layout/               — AppShell, Sidebar, TopBar, MobileMenu, NavItem
    ui/                   — Card, Badge, Alert, Button, ProgressBar, SeverityGauge, StatBox, EmptyState
    test/                 — QuestionCard, TestForm
  data/
    questions.js          — preguntas de manía (cuidador + paciente) + calcSeverity
    moodQuestions.js      — 18 preguntas del test comprensivo de ánimo (MC1-MC18)
  services/
    firebase.js           — config de Firestore
    storage.js            — CRUD para caregiver_tests, patient_tests, mood_tests
  utils/
    scoring.js            — calcSeverity, calcMoodSeverity, maniaLevel, moodLevelTailwind
    tokens.js             — encode/decode base64 token de URL
    dates.js              — filterByDays, filterByDateRange, dedupeByDay, formatDate
  styles/global.css       — @tailwind + geometría del shell (iOS dvh, scroll)
```

## Firestore Collections
| Collection | Propósito |
|------------|-----------|
| `caregiver_tests` | Observaciones del cuidador (testType: 'mania') |
| `patient_tests` | Auto-reporte del paciente (testType: 'mania') |
| `mood_tests` | Test comprensivo de ánimo (testType: 'mood_comprehensive') |

Campos nuevos en todos los documentos: `patientId`, `testType`, `submittedByRole`, `appVersion: 2`.
Documentos viejos (sin estos campos) funcionan normalmente.

## Sistema de Roles
```
/#/dashboard, /#/caregiver, /#/analysis → rol cuidador (acceso completo)
/#/p/TOKEN/mania                         → rol paciente, test de manía
/#/p/TOKEN/mood                          → rol paciente, test de ánimo
/#/tips, /#/resources, /#/about         → acceso para ambos roles
/#/mood, /#/patient                     → redirects de compatibilidad hacia atrás
```
- Token = base64 del patientId (por defecto `btoa('daniela')` = `"ZGFuaWVsYQ=="`)
- No hay autenticación real — los tokens son identificadores, no credenciales de seguridad

## Gráfico Bipolar
El gráfico de línea en Análisis usa eje Y de **-4 a +4**:
- Manía (caregiver_tests / patient_tests): valores positivos (+0 a +4)
- Depresión (mood_tests): valores negativos (depressionScore × -1)
- Línea en y=0 = estado estable/eutímico

## Diseño
- Paleta: navy (#1a3a5c), teal (#0891b2), mint (#f0fdfa)
- Severidad: emerald=estable, amber=moderado, rose=elevado, violet=crisis
- Sin emojis como íconos → Lucide React SVG
- Breakpoints: 375px (mobile S), 768px (tablet), 1024px (sidebar desktop)
- Sidebar fijo en ≥1024px; hamburguesa + slide-over en móvil
- WCAG AA contrast en textos principales

## Idioma
Todo en español. No agregar internacionalización.

## Constraints
- NO migrar a Vite
- NO agregar Firebase Auth (tokens URL simples son suficientes por ahora)
- Mantener HashRouter siempre (GitHub Pages)
- Retrocompatibilidad con datos Firestore existentes
- patientId por defecto: `"daniela"`
- patientName hardcodeado: `"Daniela"`

## Crisis Screening
Si mc15 (pensamientos oscuros) ≥ 3, el mood test guarda `crisis_flag: true` y muestra el número 135 (Centro de Asistencia al Suicida — Argentina).
