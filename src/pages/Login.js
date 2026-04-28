import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useApp } from '../contexts/AppContext';
import { Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(pin)) {
      navigate('/dashboard');
    } else {
      setError('PIN incorrecto. Intenta de nuevo.');
      setPin('');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-black text-navy-700 dark:text-white uppercase tracking-tighter">Acceso Cuidador</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
          Ingresa el PIN para acceder
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <Lock size={32} className="text-teal-500" />
            </div>

            <input
              type="password"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-32 text-center text-3xl tracking-widest font-mono p-3 bg-slate-50 dark:bg-navy-900 border-2 border-slate-200 dark:border-navy-700 rounded-xl focus:border-teal-500 focus:outline-none"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-rose-500 text-sm font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth size="lg">
            INGRESAR
          </Button>
          <p className="text-center text-xs text-slate-400 mt-4 italic">
            El PIN por defecto es 1234
          </p>
        </form>
      </Card>
    </div>
  );
}
