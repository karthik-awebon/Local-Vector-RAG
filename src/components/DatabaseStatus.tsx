'use client';

interface DatabaseStatusProps {
  dbReady: boolean;
  workerStatus: string;
  workerProgress?: number;
  onClearData: () => void;
}

export function DatabaseStatus({ dbReady, workerStatus, workerProgress, onClearData }: DatabaseStatusProps) {
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all indexed data?')) {
      onClearData();
    }
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center space-x-6">
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
      
      {dbReady && (
        <button 
          onClick={handleClear}
          className="text-red-600 hover:text-red-800 font-medium transition-colors"
        >
          Clear Indexed Data
        </button>
      )}
    </div>
  );
}
