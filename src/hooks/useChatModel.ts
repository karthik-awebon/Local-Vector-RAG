import { useState, useCallback, useRef } from 'react';
import * as webllm from '@mlc-ai/web-llm';

export interface ChatState {
    status: 'idle' | 'loading' | 'ready' | 'generating' | 'error';
    progress: string;
    output: string;
    error: string | null;
}

export function useChatModel() {
    const [state, setState] = useState<ChatState>({
        status: 'idle',
        progress: '',
        output: '',
        error: null,
    });

    const engineRef = useRef<webllm.MLCEngine | null>(null);
    // Use a small, efficient model
    const selectedModel = 'Llama-3.1-8B-Instruct-q4f16_1-MLC'; 

    const initEngine = useCallback(async () => {
        if (engineRef.current) return;

        setState(prev => ({ ...prev, status: 'loading' }));
        
        try {
            const engine = new webllm.MLCEngine();
            engine.setInitProgressCallback((report: webllm.InitProgressReport) => {
                setState(prev => ({ ...prev, progress: report.text }));
            });

            await engine.reload(selectedModel);
            engineRef.current = engine;
            setState(prev => ({ ...prev, status: 'ready', progress: 'Model Ready' }));
        } catch (err) {
            setState(prev => ({ 
                ...prev, 
                status: 'error', 
                error: err instanceof Error ? err.message : String(err) 
            }));
        }
    }, [selectedModel]);

    const generate = useCallback(async (messages: webllm.ChatCompletionMessageParam[]) => {
        if (!engineRef.current) {
            setState(prev => ({ ...prev, error: 'Engine not initialized' }));
            return;
        }

        setState(prev => ({ ...prev, status: 'generating', output: '' }));

        try {
            const completion = await engineRef.current.chat.completions.create({
                messages,
                stream: true,
            });

            let fullText = '';
            for await (const chunk of completion) {
                const curText = chunk.choices[0]?.delta?.content ?? '';
                fullText += curText;
                setState(prev => ({ ...prev, output: fullText }));
            }

            setState(prev => ({ ...prev, status: 'ready' }));
            return fullText;
        } catch (err) {
            setState(prev => ({ 
                ...prev, 
                status: 'error', 
                error: err instanceof Error ? err.message : String(err) 
            }));
        }
    }, []);

    return {
        ...state,
        initEngine,
        generate,
    };
}
