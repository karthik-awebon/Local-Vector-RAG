import type { Pipeline } from '@xenova/transformers';

// @ts-ignore
import { pipeline, env } from '@xenova/transformers/dist/transformers.min.js';

// Configuration for the transformers library
if (env) {
    env.allowLocalModels = false;
    env.useBrowserCache = true;
}

class PipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance: Promise<Pipeline> | null = null;

    static async getInstance(progress_callback?: (progress: any) => void): Promise<Pipeline> {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent) => {
    const { text } = event.data;
    console.log('[Worker] Message received:', { 
        textType: typeof text, 
        isBatch: Array.isArray(text),
        length: Array.isArray(text) ? text.length : text?.length 
    });

    if (!text) {
        console.warn('[Worker] No text provided in message');
        return;
    }

    try {
        console.log('[Worker] Requesting pipeline instance...');
        // Retrieve the singleton instance of the pipeline
        const extractor = await PipelineSingleton.getInstance((progress) => {
            // Send progress updates back to the main thread
            console.log('[Worker] Loading progress:', progress);
            self.postMessage({ status: 'progress', progress });
        });

        console.log('[Worker] Pipeline ready. Starting extraction...');
        const startTime = performance.now();

        // Run the model. Extractor handles both string and string[]
        const output = await extractor(text, {
            pooling: 'mean',
            normalize: true,
        });

        const duration = performance.now() - startTime;
        console.log(`[Worker] Extraction complete in ${duration.toFixed(2)}ms`, {
            dims: output.dims,
            dataType: output.data?.constructor.name
        });

        // Prepare response based on input type
        const isBatch = Array.isArray(text);
        
        const message = {
            status: 'complete',
            output: isBatch ? {
                type: 'batch',
                data: Array.from(output.data),
                dims: output.dims, // [batch_size, embedding_dim]
            } : {
                type: 'single',
                data: Array.from(output.data),
            },
        };

        console.log('[Worker] Posting completion message back to main thread');
        self.postMessage(message);
    } catch (error) {
        console.error('[Worker] Fatal error:', error);
        self.postMessage({
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
