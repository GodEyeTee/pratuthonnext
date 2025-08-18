'use client';

import * as React from 'react';
import { Button } from './Button';

type Align = 'start' | 'center' | 'end';
type Side = 'top' | 'bottom' | 'left' | 'right';
type CompositeSide = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export type KebabItem = {
  label: React.ReactNode;
  onSelect: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  hidden?: boolean; // ✅ รองรับซ่อนเมนู
};

export interface KebabMenuProps {
  items: KebabItem[];
  className?: string;
  /** ตำแหน่งเมนู (รับได้ทั้งแบบแยกและแบบ composite เพื่อเข้ากันกับโค้ดเดิม) */
  side?: Side | CompositeSide;
  align?: Align;
  /** ใช้ trigger เองได้ (ต้องเป็น ReactElement เพื่อรองรับ cloneElement) */
  trigger?: React.ReactElement<any>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function cn(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(' ');
}

export default function KebabMenu({
  items,
  className,
  side = 'bottom',
  align = 'end',
  trigger,
  open: controlledOpen,
  onOpenChange,
}: KebabMenuProps) {
  // แปลง composite เป็น side+align
  const [derivedSide, derivedAlign] = React.useMemo(() => {
    if (typeof side === 'string' && side.includes('-')) {
      const [s, a] = side.split('-') as [Side, Align];
      return [s, (a || align) as Align];
    }
    return [side as Side, align];
  }, [side, align]);

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (v: boolean) =>
    onOpenChange ? onOpenChange(v) : setUncontrolledOpen(v);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);

  // ปิดเมื่อคลิกนอก/ESC
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // โฟกัสรายการแรกที่ไม่ disabled เมื่อเปิด
  React.useEffect(() => {
    if (!open) return;
    const enabledIndex = items
      .filter(i => !i.hidden)
      .findIndex(i => !i.disabled);
    setActiveIndex(enabledIndex);
    menuRef.current?.focus();
  }, [open, items]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const visible = items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => !it.hidden);
    const enabled = visible.filter(({ it }) => !it.disabled);

    if (enabled.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = enabled.findIndex(({ i }) => i === activeIndex);
      const next = enabled[(current + 1) % enabled.length]?.i ?? activeIndex;
      setActiveIndex(next);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = enabled.findIndex(({ i }) => i === activeIndex);
      const next =
        enabled[(current - 1 + enabled.length) % enabled.length]?.i ??
        activeIndex;
      setActiveIndex(next);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(enabled[0]?.i ?? activeIndex);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(enabled[enabled.length - 1]?.i ?? activeIndex);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const item = items[activeIndex];
      if (item && !item.disabled && !item.hidden) {
        setOpen(false);
        item.onSelect();
      }
    }
  };

  const positionClass = {
    top: {
      start: 'bottom-full left-0 mb-2',
      center: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      end: 'bottom-full right-0 mb-2',
    },
    bottom: {
      start: 'top-full left-0 mt-2',
      center: 'top-full left-1/2 -translate-x-1/2 mt-2',
      end: 'top-full right-0 mt-2',
    },
    left: {
      start: 'right-full top-0 mr-2',
      center: 'right-full top-1/2 -translate-y-1/2 mr-2',
      end: 'right-full bottom-0 mr-2',
    },
    right: {
      start: 'left-full top-0 ml-2',
      center: 'left-full top-1/2 -translate-y-1/2 ml-2',
      end: 'left-full bottom-0 ml-2',
    },
  }[derivedSide][derivedAlign];

  const defaultTrigger = (
    <Button
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label="Open actions"
      variant="ghost"
      size="icon"
      onClick={() => setOpen(!open)}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
      </svg>
    </Button>
  );

  const renderTrigger = () => {
    if (!trigger) return defaultTrigger;
    if (React.isValidElement(trigger)) {
      // ✅ กำหนด onClick/aria ให้ trigger ที่ส่งเข้ามาได้อย่างปลอดภัย
      return React.cloneElement(trigger as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          (trigger.props as any)?.onClick?.(e);
          setOpen(!open);
        },
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      });
    }
    // ถ้าไม่ใช่ ReactElement คืน default
    return defaultTrigger;
  };

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      {renderTrigger()}

      {open && (
        <div
          ref={menuRef}
          role="menu"
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className={cn(
            'absolute z-50 min-w-[180px] overflow-hidden rounded-2xl border',
            'bg-white/90 supports-[backdrop-filter]:bg-white/55 backdrop-blur-2xl',
            'ring-1 ring-black/5 shadow-[0_10px_30px_-22px_rgba(0,0,0,0.45)]',
            'dark:bg-gray-900/70 dark:border-gray-800 dark:ring-white/10',
            positionClass
          )}
        >
          <div className="py-1">
            {items
              .map((it, i) => ({ it, i }))
              .filter(({ it }) => !it.hidden)
              .map(({ it, i }) => (
                <React.Fragment key={i}>
                  {it.separatorBefore && (
                    <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
                  )}
                  <MenuButton
                    {...it}
                    active={i === activeIndex}
                    onClick={() => {
                      if (it.disabled) return;
                      setOpen(false);
                      it.onSelect();
                    }}
                  />
                </React.Fragment>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({
  label,
  icon,
  destructive,
  disabled,
  active,
  onClick,
}: {
  label: React.ReactNode;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  const color = destructive
    ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
    : 'text-slate-800 hover:text-slate-900 dark:text-slate-100 dark:hover:text-white';

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-sm',
        'hover:bg-black/5 dark:hover:bg-white/5',
        'focus:outline-none',
        disabled && 'opacity-50 cursor-not-allowed',
        active && 'bg-black/5 dark:bg-white/5',
        color
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}
