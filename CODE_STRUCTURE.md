# Estructura del Código

## Directorios Principales

- `src/pages/`: Páginas de la aplicación (Dashboard, Tests, Settings, etc.)
- `src/components/`: Componentes reutilizables (UI, layouts)
- `src/data/`: Configuración de preguntas y datos estáticos
- `src/services/`: Servicios (Firebase, storage)
- `src/utils/`: Utilidades (scoring, dates)
- `src/contexts/`: Contextos de React para estado global

## Flujo de Evaluación Compuesta

1. **Gateway**: 4 preguntas iniciales para calcular scores base
2. **Módulos**: Según scores, se activan módulos de manía, hipomanía o depresión
3. **Branching**: Preguntas condicionales basadas en scores altos
4. **Confirmación**: Si no hay síntomas elevados, pregunta de confirmación

## Cálculo de Scores

- **Mania Score**: Promedio de preguntas con `_origin: 'mania'`
- **Depression Score**: Promedio de preguntas con `_origin: 'mood'` relacionadas con depresión
- Umbrales configurables para activar módulos

## Roles

- **Paciente**: Acceso limitado, solo evaluación propia
- **Cuidador**: Acceso completo, gestión de paciente, admin

## Debug

Activar con `?debug=1` en URL para ver:
- Scores actuales
- Respuestas dadas
- IDs de preguntas triggered