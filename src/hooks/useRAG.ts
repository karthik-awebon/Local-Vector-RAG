'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEmbeddingWorker } from './useEmbeddingWorker';
import { useVectorDB, SearchResult } from './useVectorDB';
import { useChatModel } from './useChatModel';
import { chunkText } from '@/utils/chunking';

export type RAGMode = 'index' | 'chat';

export function useRAG() {
  const [mode, setMode] = useState<RAGMode>('index');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lastAction, setLastAction] = useState<'indexing' | 'chatting' | null>(null);
  const [currentChunks, setCurrentChunks] = useState<string[]>([]);
  const [pendingInput, setPendingInput] = useState<string>('');
  const [pendingQuery, setPendingQuery] = useState<string>('');

  const db = useVectorDB();
  const chat = useChatModel();
  const { initEngine, status: chatStatus, generate, output: chatOutput, progress: chatProgress, error: chatError } = chat;

  const handleWorkerComplete = useCallback(async (output: { type: 'batch' | 'single'; data: number[]; dims?: number[] }) => {
    if (!lastAction) return;

    if (lastAction === 'indexing') {
      const timestamp = new Date().toISOString();
      
      if (output.type === 'batch') {
        const { data, dims } = output;
        const [batchSize, dimSize] = dims;
        
        for (let i = 0; i < batchSize; i++) {
          const start = i * dimSize;
          const embedding = data.slice(start, start + dimSize);
          await db.insertDocument(currentChunks[i], embedding, timestamp);
        }
      } else {
        await db.insertDocument(pendingInput, output.data, timestamp);
      }
      
      setPendingInput('');
      setCurrentChunks([]);
      setLastAction(null);
    } else if (lastAction === 'chatting') {
      const results = await db.vectorSearch(output.data);
      setSearchResults(results);
      
      const context = results.map(r => r.document.content).join('\n---\n');
      await generate([
        { role: 'system', content: 'You are a helpful assistant. Use the provided context to answer the user query. If the answer is not in the context, say you do not know.' },
        { role: 'user', content: `Context:\n${context}\n\nQuery: ${pendingQuery}` }
      ]);
      setLastAction(null);
    }
  }, [lastAction, currentChunks, pendingInput, pendingQuery, db, generate]);

  const worker = useEmbeddingWorker(handleWorkerComplete);

  // Initialize Chat AI on mount
  useEffect(() => {
    initEngine();
  }, [initEngine]);

  const indexDocument = useCallback((text: string) => {
    if (text.trim() && db.isInitialized) {
      const chunks = chunkText(text, 100, 20);
      setCurrentChunks(chunks);
      setPendingInput(text);
      setLastAction('indexing');
      worker.compute(chunks);
    }
  }, [db.isInitialized, worker]);

  const askQuestion = useCallback((query: string) => {
    if (query.trim() && db.isInitialized && chatStatus === 'ready') {
      setPendingQuery(query);
      setLastAction('chatting');
      worker.compute(query);
    }
  }, [db.isInitialized, chatStatus, worker]);

  const clearData = useCallback(async () => {
    await db.clearDatabase();
    setSearchResults([]);
  }, [db]);

  return {
    mode,
    setMode,
    searchResults,
    indexDocument,
    askQuestion,
    clearData,
    worker,
    db,
    chat: {
        status: chatStatus,
        output: chatOutput,
        progress: chatProgress,
        error: chatError,
        initEngine,
        generate
    },
    isProcessing: worker.status === 'processing',
    lastAction
  };
}
