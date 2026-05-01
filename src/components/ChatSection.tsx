'use client';

import { useState } from 'react';

interface ChatSectionProps {
  dbReady: boolean;
  isProcessing: boolean;
  chatStatus: string;
  onAsk: (query: string) => void;
}

export function ChatSection({ dbReady, isProcessing, chatStatus, onAsk }: ChatSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && chatStatus === 'ready') {
      onAsk(searchQuery);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">
        Ask Your Knowledge Base
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
          placeholder="What would you like to know?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={!dbReady || isProcessing || !searchQuery.trim() || chatStatus !== 'ready'}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {isProcessing ? 'Searching...' : chatStatus !== 'ready' ? 'Initializing...' : 'Ask AI'}
        </button>
      </form>
    </div>
  );
}
