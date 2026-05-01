'use client';

import { SearchResult } from '@/hooks/useVectorDB';

interface SourceGridProps {
  results: SearchResult[];
  isProcessing: boolean;
}

export function SourceGrid({ results, isProcessing }: SourceGridProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-500">
        Sources Used
      </h3>
      {results.length === 0 && !isProcessing && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
          No results to display.
        </div>
      )}
      <div className="grid gap-4">
        {results.map((result, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Relevance: {(result.score * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-gray-800 line-clamp-3 italic">&quot;{result.document.content}&quot;</p>
          </div>
        ))}
      </div>
    </div>
  );
}
