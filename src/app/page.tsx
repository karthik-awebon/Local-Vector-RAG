'use client';

import { useState, useEffect } from 'react';
import { useEmbeddingWorker } from '@/hooks/useEmbeddingWorker';
import { useVectorDB } from '@/hooks/useVectorDB';
import { useChatModel } from '@/hooks/useChatModel';
import { chunkText } from '@/utils/chunking';

export default function ClientRagDashboard() {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [mode, setMode] = useState<'index' | 'search' | 'chat'>('index');
  const [lastAction, setLastAction] = useState<'indexing' | 'searching' | 'chatting' | null>(null);
  const [currentChunks, setCurrentChunks] = useState<string[]>([]);

  const { status: workerStatus, progress: workerProgress, output, error: workerError, compute } = useEmbeddingWorker();
  const { isInitialized: dbReady, error: dbError, insertDocument, vectorSearch } = useVectorDB();
  const { 
    status: chatStatus, 
    progress: chatProgress, 
    output: chatOutput, 
    error: chatError, 
    initEngine, 
    generate 
  } = useChatModel();

  // Handle the completion of embedding generation
  useEffect(() => {
    if (workerStatus === 'complete' && output) {
      if (lastAction === 'indexing') {
        const timestamp = new Date().toISOString();
        
        if (output.type === 'batch') {
          const { data, dims } = output;
          const [batchSize, dimSize] = dims;
          
          for (let i = 0; i < batchSize; i++) {
            const start = i * dimSize;
            const embedding = data.slice(start, start + dimSize);
            insertDocument(currentChunks[i], embedding, timestamp);
          }
        } else {
          insertDocument(inputText, output.data, timestamp);
        }
        
        setInputText('');
        setCurrentChunks([]);
        setLastAction(null);
      } else if (lastAction === 'searching' || lastAction === 'chatting') {
        const performSearch = async () => {
          const results = await vectorSearch(output.data);
          setSearchResults(results);
          
          if (lastAction === 'chatting') {
            // Construct context for RAG
            const context = results.map(r => r.document.content).join('\n---\n');
            generate([
              { role: 'system', content: 'You are a helpful assistant. Use the provided context to answer the user query. If the answer is not in the context, say you do not know.' },
              { role: 'user', content: `Context:\n${context}\n\nQuery: ${searchQuery}` }
            ]);
          }
          setLastAction(null);
        };
        performSearch();
      }
    }
  }, [workerStatus, output, lastAction, inputText, searchQuery, currentChunks, insertDocument, vectorSearch, generate]);

  const handleIndex = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && dbReady) {
      const chunks = chunkText(inputText, 100, 20);
      setCurrentChunks(chunks);
      setLastAction('indexing');
      compute(chunks);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && dbReady) {
      setLastAction('searching');
      compute(searchQuery);
    }
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && dbReady) {
      if (chatStatus === 'idle') {
        alert('Please initialize the Chat AI model first!');
        return;
      }
      setLastAction('chatting');
      compute(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)] text-black">
      <main className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Local Vector RAG Dashboard</h1>
            <p className="text-gray-600">
              Private, browser-native AI indexing and retrieval.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {chatStatus === 'idle' ? (
              <button 
                onClick={initEngine}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Initialize Chat AI
              </button>
            ) : (
              <div className="text-xs text-right max-w-[200px]">
                <span className="font-bold text-purple-600 uppercase">Chat AI: {chatStatus}</span>
                <p className="text-gray-500 truncate">{chatProgress}</p>
              </div>
            )}
          </div>
        </header>

        {/* DB & Model Status */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${dbReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
            <span className="text-gray-700">Database {dbReady ? 'Ready' : 'Initializing...'}</span>
          </div>
          {workerStatus === 'loading' && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-blue-600">Loading Embedder: {Math.round((workerProgress || 0) * 100)}%</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {['index', 'search', 'chat'].map((t) => (
            <button
              key={t}
              onClick={() => setMode(t as any)}
              className={`px-6 py-2 font-medium transition-colors capitalize ${
                mode === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Sections */}
        {mode === 'index' && (
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold mb-4">Add to Knowledge Base</h2>
            <form onSubmit={handleIndex} className="space-y-4">
              <textarea
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Enter document text to index..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                type="submit"
                disabled={!dbReady || workerStatus === 'processing' || !inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {workerStatus === 'processing' && lastAction === 'indexing' ? 'Processing...' : 'Index Document'}
              </button>
            </form>
          </section>
        )}

        {(mode === 'search' || mode === 'chat') && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">
                {mode === 'search' ? 'Query Knowledge Base' : 'Ask Your Knowledge Base'}
              </h2>
              <form onSubmit={mode === 'search' ? handleSearch : handleChat} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="What would you like to know?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!dbReady || workerStatus === 'processing' || !searchQuery.trim()}
                  className={`${mode === 'search' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'} disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors`}
                >
                  {workerStatus === 'processing' ? 'Searching...' : mode === 'search' ? 'Search' : 'Ask AI'}
                </button>
              </form>
            </div>

            {/* AI Response Area */}
            {mode === 'chat' && (chatOutput || chatStatus === 'generating') && (
              <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm">
                <h3 className="text-sm font-bold text-purple-700 uppercase mb-2">AI Response</h3>
                <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {chatOutput}
                  {chatStatus === 'generating' && <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1"></span>}
                </div>
              </div>
            )}

            {/* Results Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500">
                {mode === 'chat' ? 'Sources Used' : 'Search Results'}
              </h3>
              {searchResults.length === 0 && !workerStatus.includes('processing') && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                  No results to display.
                </div>
              )}
              <div className="grid gap-4">
                {searchResults.map((result, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Relevance: {(result.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-gray-800 line-clamp-3 italic">"{result.document.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Error Messages */}
        {(workerError || dbError || chatError) && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 text-sm">
            <strong>Error:</strong> {workerError || dbError || chatError}
          </div>
        )}
      </main>
    </div>
  );
}
