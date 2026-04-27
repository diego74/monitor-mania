export function QuestionCard({ question, questionNumber, totalQuestions, selectedIndex, onSelect }) {
  return (
    <div className={`rounded-xl border-l-4 p-3 mb-3 transition-colors ${
      selectedIndex !== undefined
        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-500'
        : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-700'
    }`}>
      <p className="font-semibold text-navy-700 dark:text-white text-sm mb-2">
        <span className="text-slate-400 dark:text-slate-500 font-normal mr-1">{questionNumber}/{totalQuestions}</span>
        {question.question}
      </p>
      <div className="grid gap-1.5">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(idx)}
            className={`w-full text-left px-3 py-2.5 min-h-[52px] rounded-lg border text-sm transition-all duration-150 cursor-pointer ${
              selectedIndex === idx
                ? 'border-teal-500 bg-teal-500 text-white font-semibold'
                : 'border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
