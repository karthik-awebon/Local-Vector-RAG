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
            workerRef.current = new Worker(new URL('../lib/worker.ts', import.meta.url));
        }

        const onMessage = (event: MessageEvent) => {
            const { status, progress, output, error } = event.data;

            switch (status) {
                case 'progress':
                    setState(prev => ({ ...prev, status: 'loading', progress: progress.progress }));
                    break;
                case 'complete':
                    setState({ status: 'complete', output });
                    break;
                case 'error':
                    setState({ status: 'error', error });
                    break;
            }
        };

        workerRef.current.addEventListener('message', onMessage);

        return () => {
            workerRef.current?.removeEventListener('message', onMessage);
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    const compute = useCallback((text: string | string[]) => {
        if (!workerRef.current) return;

        setState({ status: 'processing' });
        workerRef.current.postMessage({ text });
    }, []);

    return {
        ...state,
        compute,
    };
}
