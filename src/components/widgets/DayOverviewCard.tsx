// src/components/widgets/DayOverviewCard.tsx
import { CalendarDays, CheckSquare } from 'lucide-react';

type Item = { text: string; color?: string };

export default function DayOverviewCard({
  date = new Date(),
  monthLabel = date.toLocaleString(undefined, { month: 'long' }),
  todos = [],
  events = [],
  title = 'Today',
}: {
  date?: Date;
  monthLabel?: string;
  todos?: Item[];
  events?: Item[];
  title?: string;
}) {
  const d = date;
  const day = d.getDate();
  const month = monthLabel;
  const monthShort = d.toLocaleString(undefined, { month: 'long' });
  const weekday = d.toLocaleString(undefined, { weekday: 'long' });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900">
      {/* header */}
      <div className="flex items-center gap-4 px-6 pt-5">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-300">
          {title}
        </span>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-300 flex items-center gap-1">
          {monthShort}{' '}
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        {/* left date */}
        <div className="flex flex-col justify-center">
          <div className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white leading-none">
            {day}
          </div>
          <div className="mt-2 text-xl text-gray-700 dark:text-gray-200">
            {month}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {weekday}
          </div>

          {/* lists */}
          <div className="mt-6">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
              TO-DO
            </div>
            <ul className="mt-2 space-y-2">
              {todos.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200"
                >
                  <span
                    className={`mt-1 h-2 w-2 rounded-sm ${t.color ?? 'bg-sky-500'}`}
                  />
                  <span>{t.text}</span>
                </li>
              ))}
              {!todos.length && (
                <li className="text-sm text-gray-400">No tasks</li>
              )}
            </ul>
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
              EVENTS
            </div>
            <ul className="mt-2 space-y-2">
              {events.map((e, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200"
                >
                  <span
                    className={`mt-1 h-2 w-2 rounded-sm ${e.color ?? 'bg-amber-500'}`}
                  />
                  <span>{e.text}</span>
                </li>
              ))}
              {!events.length && (
                <li className="text-sm text-gray-400">No events</li>
              )}
            </ul>
          </div>
        </div>

        {/* right illustration block */}
        <div className="relative rounded-2xl bg-gradient-to-tr from-rose-200 via-amber-200 to-sky-200 dark:from-rose-300/20 dark:via-amber-300/20 dark:to-sky-300/20 border border-black/5 dark:border-white/10 p-6 overflow-hidden">
          {/* simple vector-like shapes */}
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-orange-300/70 dark:bg-orange-300/40 blur-xl" />
          <div className="absolute left-4 bottom-4 h-16 w-16 rounded-full bg-sky-300/60 dark:bg-sky-300/30 blur-lg" />
          <div className="relative z-10 grid grid-cols-3 gap-3">
            <div className="h-20 bg-white/70 dark:bg-white/10 rounded-xl shadow-inner" />
            <div className="h-28 bg-white/70 dark:bg-white/10 rounded-xl shadow-inner" />
            <div className="h-16 bg-white/70 dark:bg-white/10 rounded-xl shadow-inner" />
          </div>

          <div className="absolute right-4 bottom-4 flex items-center gap-2 text-xs text-gray-700/80 dark:text-gray-200/80">
            <CalendarDays className="h-4 w-4" />
            <span>{d.toLocaleDateString()}</span>
          </div>

          <div className="absolute left-4 top-4 flex items-center gap-2 text-xs text-gray-700/80 dark:text-gray-200/80">
            <CheckSquare className="h-4 w-4" />
            <span>{todos.length} tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
