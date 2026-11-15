import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

export interface SheetTabItem<T extends string> {
  id: T;
  label: string;
  subtitle?: string;
  badge?: string;
  alertBadge?: string;
  accent?: 'teal' | 'sky';
}

interface SheetTabsBarProps<T extends string> {
  workbookLabel: string;
  sheets: SheetTabItem<T>[];
  activeSheet: T;
  onSelectSheet: (sheetId: T) => void;
}

export function SheetTabsBar<T extends string>({
  workbookLabel,
  sheets,
  activeSheet,
  onSelectSheet,
}: SheetTabsBarProps<T>) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-xs px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 print:hidden"
      role="tablist"
      aria-label={workbookLabel}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
        <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
          <FileSpreadsheet className="w-4 h-4 text-teal-700" />
        </span>
        <span>{workbookLabel}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sheets.map((sheet) => {
          const isActive = activeSheet === sheet.id;
          const isSky = sheet.accent === 'sky';

          const activeClasses = isSky
            ? 'bg-sky-700 text-white border-sky-800 shadow-sm shadow-sky-900/20'
            : 'bg-teal-700 text-white border-teal-800 shadow-sm shadow-teal-900/20';

          const inactiveClasses =
            'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900';

          return (
            <button
              key={sheet.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectSheet(sheet.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              <span>{sheet.label}</span>
              {sheet.badge && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isActive
                      ? isSky
                        ? 'bg-sky-900/60 text-sky-100 border-sky-400/50'
                        : 'bg-teal-900/60 text-teal-100 border-teal-400/50'
                      : isSky
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                  }`}
                >
                  {sheet.badge}
                </span>
              )}
              {sheet.alertBadge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {sheet.alertBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
