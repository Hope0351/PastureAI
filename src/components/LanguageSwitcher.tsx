import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage, type Locale } from '../i18n';

interface LanguageSwitcherProps {
  /** Dark translucent style for landing hero */
  variant?: 'default' | 'hero';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'default' }) => {
  const { locale, setLocale, t } = useLanguage();

  const options: { id: Locale; label: string }[] = [
    { id: 'en', label: 'EN' },
    { id: 'am', label: 'አማ' },
  ];

  const isHero = variant === 'hero';

  return (
    <div
      className={
        isHero
          ? 'inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-md'
          : 'inline-flex items-center gap-1 rounded-xl border border-line-subtle bg-panel p-1'
      }
      role="group"
      aria-label={t.common.language}
    >
      <Languages
        className={isHero ? 'ml-2 h-3.5 w-3.5 text-white/70' : 'ml-2 h-3.5 w-3.5 text-muted'}
        aria-hidden
      />
      {options.map((opt) => {
        const active = locale === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLocale(opt.id)}
            aria-pressed={active}
            title={opt.id === 'am' ? t.common.amharic : t.common.english}
            className={
              isHero
                ? `rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`
                : `rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? 'bg-field text-white shadow-sm'
                      : 'text-muted hover:bg-field-soft hover:text-ink'
                  }`
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
