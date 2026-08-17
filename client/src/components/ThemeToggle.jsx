import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const options = [
    { value: 'light', label: 'Claro', icon: Sun, title: 'Modo Claro' },
    { value: 'dark', label: 'Oscuro', icon: Moon, title: 'Modo Oscuro' },
    { value: 'system', label: 'Sistema', icon: Monitor, title: `Modo Sistema (${resolvedTheme === 'dark' ? 'Oscuro activo' : 'Claro activo'})` },
  ];

  return (
    <div 
      className={clsx(
        "inline-flex items-center p-0.5 bg-gray-100 dark:bg-slate-800/90 rounded-xl border border-gray-200/90 dark:border-slate-700/80 shadow-xs transition-colors",
        className
      )}
      role="group"
      aria-label="Selector de tema de color"
    >
      {options.map(({ value, label, icon: Icon, title }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            title={title}
            aria-pressed={isActive}
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 relative cursor-pointer select-none",
              isActive 
                ? "bg-white dark:bg-slate-700 text-primary dark:text-sky-400 shadow-xs font-semibold" 
                : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <Icon size={14} className={clsx("transition-transform duration-150 shrink-0", isActive && "scale-110")} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
