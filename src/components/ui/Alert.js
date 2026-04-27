import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

const variants = {
  success: { icon: CheckCircle,   bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-400 dark:border-emerald-700', text: 'text-emerald-800 dark:text-emerald-300', iconColor: 'text-emerald-500' },
  error:   { icon: XCircle,       bg: 'bg-rose-50 dark:bg-rose-900/20',       border: 'border-rose-400 dark:border-rose-700',       text: 'text-rose-800 dark:text-rose-300',       iconColor: 'text-rose-500'    },
  info:    { icon: Info,          bg: 'bg-teal-50 dark:bg-teal-900/20',       border: 'border-teal-400 dark:border-teal-700',       text: 'text-teal-800 dark:text-teal-300',       iconColor: 'text-teal-500'    },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/20',     border: 'border-amber-400 dark:border-amber-700',     text: 'text-amber-800 dark:text-amber-300',     iconColor: 'text-amber-500'   },
  crisis:  { icon: AlertTriangle, bg: 'bg-rose-50 dark:bg-rose-900/20',       border: 'border-rose-500 dark:border-rose-700',       text: 'text-rose-900 dark:text-rose-300',       iconColor: 'text-rose-600'    },
};

export function Alert({ variant = 'info', children, className = '' }) {
  const v = variants[variant] || variants.info;
  const Icon = v.icon;
  return (
    <div className={`flex gap-3 items-start p-3 rounded-lg border-l-4 mb-3 ${v.bg} ${v.border} ${v.text} ${className}`}>
      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${v.iconColor}`} />
      <div className="text-sm">{children}</div>
    </div>
  );
}
