'use client';

import { useState } from 'react';

interface IndexSectionProps {
  dbReady: boolean;
  isProcessing: boolean;
  onIndex: (text: string) => void;
}

export function IndexSection({ dbReady, isProcessing, onIndex }: IndexSectionProps) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onIndex(inputText);
      setInputText('');
    }
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
      <h2 className="text-lg font-semibold mb-4">Add to Knowledge Base</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
          placeholder="Enter document text to index..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          disabled={!dbReady || isProcessing || !inputText.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Index Document'}
        </button>
      </form>
    </section>
  );
}
