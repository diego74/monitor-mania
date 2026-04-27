import { Card, CardTitle, CardInfo } from '../components/ui/Card';
import { TestForm } from '../components/test/TestForm';
import { depressionCaregiverQuestions } from '../data/depressionQuestions';
import { calcSeverity } from '../data/questions';
import { saveCaregiver } from '../services/storage';
import { useApp } from '../contexts/AppContext';

export default function CaregiverDepressionTest() {
  const { patientName } = useApp();

  async function handleSubmit(responses) {
    const { overall } = calcSeverity(responses, depressionCaregiverQuestions);
    const now = new Date();
    const payload = {
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('es-PE'),
      severity: parseFloat(overall.toFixed(2)),
      ...responses,
    };
    await saveCaregiver(payload, 'depression');
  }

  return (
    <div>
      <Card>
        <CardTitle>Observación de Depresión — Cuidador</CardTitle>
        <CardInfo>
          Respondé según lo que observaste en <strong>{patientName}</strong> hoy.
          Estas preguntas evalúan síntomas depresivos desde tu perspectiva.
        </CardInfo>
        <TestForm
          questions={depressionCaregiverQuestions}
          onSubmit={handleSubmit}
          submitLabel="Guardar Observación"
        />
      </Card>
    </div>
  );
}
