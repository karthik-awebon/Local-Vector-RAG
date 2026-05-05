'use client';

interface ChatResponseProps {
  output: string;
  status: string;
  latency: number | null;
}

export function ChatResponse({ output, status, latency }: ChatResponseProps) {
  if (!output && status !== 'generating') return null;

  return (
    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm relative">
      {latency && (
        <div className="absolute top-4 right-6 px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-purple-200">
          TTFT: {latency.toFixed(0)}ms
        </div>
      )}
      <h3 className="text-sm font-bold text-purple-700 uppercase mb-2">AI Response</h3>
      <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
        {output}
        {status === 'generating' && <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1"></span>}
      </div>
    </div>
  );
}
