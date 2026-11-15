import React from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';

export type ActiveTab = 'recap' | 'register';

interface NavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  totalRecordsCount: number;
  rawatInapCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  totalRecordsCount,
  rawatInapCount,
}) => {
  const tabs = [
    {
      id: 'recap' as ActiveTab,
      label: 'Dashboard Rekap',
      shortLabel: 'Dashboard Rekap',
      icon: BarChart3,
      badge: undefined as string | undefined,
      badgeColor: '',
    },
    {
      id: 'register' as ActiveTab,
      label: 'Register',
      shortLabel: 'Register',
      icon: FileSpreadsheet,
      badge: undefined as string | undefined,
      badgeColor: '',
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-slate-500'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.shortLabel}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-teal-800/80 text-teal-100 border-teal-500'
                          : tab.badgeColor
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 pl-4 border-l border-slate-200 shrink-0">
            <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              IGD: <strong>{totalRecordsCount}</strong> • Ranap: <strong>{rawatInapCount}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-teal-800 tracking-wide text-xs whitespace-nowrap">
              <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              PUSKESMAS WANAREJA II
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};
