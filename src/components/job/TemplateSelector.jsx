import React from 'react';

const templates = [
  {
    id: 'tech',
    name: 'Tech Dark',
    description: 'עיצוב כהה ומודרני לחברות טכנולוגיה',
    preview: {
      bg: 'bg-gray-900',
      accent: 'bg-red-500',
      text: 'text-white',
      sub: 'text-gray-400',
    },
  },
  {
    id: 'bit',
    name: 'Bit Light',
    description: 'עיצוב בהיר ונקי עם גוונים כחולים',
    preview: {
      bg: 'bg-[#003050]',
      accent: 'bg-[#00B4CC]',
      text: 'text-white',
      sub: 'text-blue-200',
    },
  },
];

export default function TemplateSelector({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">שלב 2: בחר עיצוב לדף המשרה</h2>
        <p className="text-sm text-muted-foreground">הטמפלט יקבע את המראה של דף המשרה הציבורי שישותף עם מועמדים</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`text-right rounded-xl border-2 overflow-hidden transition-all focus:outline-none ${
              value === t.id
                ? 'border-primary shadow-lg scale-[1.02]'
                : 'border-border hover:border-primary/40'
            }`}
          >
            {/* Mini preview */}
            <div className={`${t.preview.bg} p-4 h-28 flex flex-col justify-between`}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md ${t.preview.accent}`} />
                <div className={`text-xs font-bold ${t.preview.text}`}>{t.name}</div>
              </div>
              <div className="space-y-1">
                <div className={`h-2 rounded w-3/4 ${t.preview.accent} opacity-80`} />
                <div className={`h-1.5 rounded w-1/2 bg-white opacity-20`} />
                <div className={`h-1.5 rounded w-2/3 bg-white opacity-20`} />
              </div>
              <div className={`w-16 h-5 rounded-full ${t.preview.accent} opacity-90`} />
            </div>

            {/* Label */}
            <div className="bg-card p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                value === t.id ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {value === t.id && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}