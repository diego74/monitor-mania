export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', className = '', fullWidth = false }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  const variants = {
    primary:   'bg-teal-500 text-white hover:bg-teal-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 focus-visible:ring-teal-500',
    secondary: 'bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-700 disabled:bg-slate-100 dark:disabled:bg-navy-900 focus-visible:ring-slate-400',
    danger:    'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 disabled:bg-slate-100 focus-visible:ring-rose-400',
    navy:      'bg-navy-700 text-white hover:bg-navy-800 disabled:bg-slate-300 focus-visible:ring-navy-700',
    ghost:     'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 focus-visible:ring-slate-400',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
