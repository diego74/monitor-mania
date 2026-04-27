# Configuración de Preguntas

## Módulos de Evaluación

### Gateway (Siempre mostrado)
- pt9: Horas de sueño
- mc1: Estado de ánimo general
- pt7: Energía comparada con ayer
- pt10: Nivel de irritabilidad

### Manía (si maniaScore >= 2.2)
- pt1: Ideas nuevas/proyectos
- pt4: Velocidad de habla
- mc16: Velocidad de pensamientos

### Hipomanía (1.5 <= maniaScore < 2.2)
- hypo1: Optimismo/confianza
- hypo2: Sociabilidad
- hypo3: Sueño reducido con energía

### Depresión (si depressionScore > 1.5)
- mc4: Concentración/decisiones
- mc17: Cumplimiento de planes
- mc10: Ansiedad
- stress1: Nivel de estrés

### Psicosis (triggered por branching)
- psych1: Misión especial/poderes
- psych2: Voces/visones

## Branching Questions
Preguntas condicionales que se activan según scores:
- mixed_state: Agitación y tristeza simultánea
- val_energy: Energía alta con poco sueño
- impulsivity: Compras impulsivas
- psychosis_screen: Pensamientos/percepciones inusuales
- suicidal_risk: Pensamientos suicidas

## Confirmación
Si ningún módulo se activa:
- confirm_stable: Algo más que registrar?
- confirm_followup: Impacto del malestar (si stable >= 2)

## Measures
- mania: impulsivity, energy, irritability, psychosis, grandiosity, social_drive
- mood: mixed_features, anxiety, depression, stress
- general: crisis, mood (sin scoring específico)