'use client';

interface HeaderProps {
  chatStatus: string;
  chatProgress: string;
}

export function Header({ chatStatus, chatProgress }: HeaderProps) {
  return (
    <header className="flex justify-between items-start">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Local Vector RAG Dashboard</h1>
        <p className="text-gray-600">
          Private, browser-native AI indexing and retrieval.
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="text-xs text-right max-w-[200px]">
          <span className={`font-bold uppercase ${chatStatus === 'ready' ? 'text-green-600' : 'text-purple-600 animate-pulse'}`}>
            Chat AI: {chatStatus}
          </span>
          <p className="text-gray-500 truncate">{chatProgress}</p>
        </div>
      </div>
    </header>
  );
}
