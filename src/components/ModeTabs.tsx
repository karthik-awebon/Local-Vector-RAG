'use client';

import { RAGMode } from '@/hooks/useRAG';

interface ModeTabsProps {
  mode: RAGMode;
  onModeChange: (mode: RAGMode) => void;
}

export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  const tabs: RAGMode[] = ['index', 'chat'];

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onModeChange(t)}
          className={`px-6 py-2 font-medium transition-colors capitalize ${
            mode === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
