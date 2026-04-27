# Monitor Mania

Aplicación para monitorear síntomas de manía y depresión en pacientes con trastorno bipolar.

## Características

- Evaluación compuesta para detectar síntomas de manía, hipomanía, depresión y ansiedad
- Interfaz para cuidadores y pacientes
- Seguimiento de historial de síntomas
- Análisis de tendencias
- Configuración personalizable de umbrales

## Instalación

1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Inicia la aplicación: `npm start`

## Uso

- Para pacientes: Accede con token proporcionado por el cuidador
- Para cuidadores: Registra evaluaciones diarias y revisa análisis

## Configuración

La aplicación usa Firebase para almacenamiento. Configura las credenciales en `src/services/firebase.js`.

## Desarrollo

- Debug mode: Añade `?debug=1` a la URL para ver panel de depuración
- Tests: Ejecuta `npm test`

## Arquitectura

- React con hooks
- Firebase para backend
- Tailwind CSS para estilos
- Contexto para gestión de estado global