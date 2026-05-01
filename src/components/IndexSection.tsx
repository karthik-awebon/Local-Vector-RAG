'use client';

import { useState, useRef } from 'react';
import { parseFile } from '@/utils/fileParsing';

interface IndexSectionProps {
  dbReady: boolean;
  isProcessing: boolean;
  onIndex: (text: string) => void;
}

export function IndexSection({ dbReady, isProcessing, onIndex }: IndexSectionProps) {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onIndex(inputText);
      setInputText('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const extractedText = await parseFile(file);
      // Append or replace the text in the textarea
      setInputText((prev) => (prev ? prev + '\n\n' + extractedText : extractedText));
    } catch (err) {
      console.error('[IndexSection] File parse error:', err);
      setParseError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsParsing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Add to Knowledge Base</h2>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".pdf,.doc,.docx" 
            onChange={handleFileChange}
            disabled={isParsing || isProcessing}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing || isProcessing || !dbReady}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isParsing ? 'Extracting Text...' : 'Upload PDF / Word'}
          </button>
        </div>
      </div>

      {parseError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          Error: {parseError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-black"
          placeholder="Enter document text or upload a file to extract text..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          disabled={!dbReady || isProcessing || isParsing || !inputText.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Index Document'}
        </button>
      </form>
    </section>
  );
}
