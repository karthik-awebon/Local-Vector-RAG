import { useEffect, useRef, useState, useCallback } from 'react';

export interface WorkerState {
    status: 'idle' | 'loading' | 'processing' | 'complete' | 'error';
    progress?: number;
    output?: {
        type: 'batch' | 'single';
        data: number[];
        dims?: number[];
    };
    error?: string;
}

export function useEmbeddingWorker(onComplete?: (output: { type: 'batch' | 'single'; data: number[]; dims?: number[] }) => void) {
    const workerRef = useRef<Worker | null>(null);
    const [state, setState] = useState<WorkerState>({
        status: 'idle',
    });

    // Keep the callback in a ref to avoid re-subscribing the worker on every render
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

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
                    if (onCompleteRef.current) {
                        onCompleteRef.current(output);
                    }
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
