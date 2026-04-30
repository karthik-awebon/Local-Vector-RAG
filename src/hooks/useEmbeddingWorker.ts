import { useEffect, useRef, useState, useCallback } from 'react';

export interface WorkerState {
    status: 'idle' | 'loading' | 'processing' | 'complete' | 'error';
    progress?: number;
    output?: any;
    error?: string;
}

export function useEmbeddingWorker() {
    const workerRef = useRef<Worker | null>(null);
    const [state, setState] = useState<WorkerState>({
        status: 'idle',
    });

    useEffect(() => {
        // Initialize the worker on client-side only
        if (!workerRef.current) {
            console.log('[useEmbeddingWorker] Initializing new Worker...');
            workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url));
        }

        const onMessage = (event: MessageEvent) => {
            const { status, progress, output, error } = event.data;
            console.log(`[useEmbeddingWorker] Message from worker: ${status}`, { progress, error, hasOutput: !!output });

            switch (status) {
                case 'progress':
                    setState(prev => ({ ...prev, status: 'loading', progress: progress.progress }));
                    break;
                case 'complete':
                    console.log('[useEmbeddingWorker] Embedding computation complete');
                    setState({ status: 'complete', output });
                    break;
                case 'error':
                    console.error('[useEmbeddingWorker] Worker reported error:', error);
                    setState({ status: 'error', error });
                    break;
            }
        };

        workerRef.current.addEventListener('message', onMessage);

        return () => {
            console.log('[useEmbeddingWorker] Cleaning up worker...');
            workerRef.current?.removeEventListener('message', onMessage);
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    const compute = useCallback((text: string | string[]) => {
        if (!workerRef.current) {
            console.error('[useEmbeddingWorker] Cannot compute: Worker not initialized');
            return;
        }

        console.log('[useEmbeddingWorker] Sending compute request to worker', { 
            isBatch: Array.isArray(text),
            sample: Array.isArray(text) ? text[0] : text 
        });
        
        setState({ status: 'processing' });
        workerRef.current.postMessage({ text });
    }, []);

    return {
        ...state,
        compute,
    };
}
