'use client';

import { useRAG } from '@/hooks/useRAG';
import { 
  Header, 
  DatabaseStatus, 
  ModeTabs, 
  IndexSection, 
  ChatSection, 
  ChatResponse, 
  SourceGrid, 
  ErrorDisplay 
} from '@/components';

export default function ClientRagDashboard() {
  const {
    mode,
    setMode,
    searchResults,
    indexDocument,
    askQuestion,
    clearData,
    worker,
    db,
    chat,
    isProcessing,
    latency
  } = useRAG();

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)] text-black">
      <main className="max-w-4xl mx-auto space-y-8">
        <Header 
          chatStatus={chat.status} 
          chatProgress={chat.progress} 
        />

        <DatabaseStatus 
          dbReady={db.isInitialized}
          workerStatus={worker.status}
          workerProgress={worker.progress}
          onClearData={clearData}
        />

        <ModeTabs 
          mode={mode} 
          onModeChange={setMode} 
        />

        {mode === 'index' && (
          <IndexSection 
            dbReady={db.isInitialized}
            isProcessing={isProcessing}
            onIndex={indexDocument}
          />
        )}

        {mode === 'chat' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <ChatSection 
              dbReady={db.isInitialized}
              isProcessing={isProcessing}
              chatStatus={chat.status}
              onAsk={askQuestion}
            />

            <ChatResponse 
              output={chat.output} 
              status={chat.status} 
              latency={latency}
            />

            <SourceGrid 
              results={searchResults} 
              isProcessing={isProcessing} 
            />
          </section>
        )}

        <ErrorDisplay errors={[worker.error, db.error, chat.error]} />
      </main>
    </div>
  );
}
