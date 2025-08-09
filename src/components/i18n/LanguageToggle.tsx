'use client';
import { cn } from '@/lib/utils';
import { Languages } from 'lucide-react';

export type Locale = 'th' | 'en';

export default function LanguageToggle({
  locale,
  onChange,
  className,
}: {
  locale: Locale;
  onChange: (next: Locale) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Languages className="w-4 h-4 text-muted-foreground" />
      <button
        type="button"
        onClick={() => onChange('th')}
        className={cn(
          'px-2.5 py-1 text-xs rounded-md border transition-colors',
          locale === 'th'
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent/60'
        )}
        aria-pressed={locale === 'th'}
      >
        ไทย
      </button>
      <button
        type="button"
        onClick={() => onChange('en')}
        className={cn(
          'px-2.5 py-1 text-xs rounded-md border transition-colors',
          locale === 'en'
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent/60'
        )}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  );
}
