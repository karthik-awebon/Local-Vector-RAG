import { pipeline, env, Pipeline } from '@xenova/transformers';

// Configuration for the transformers library
env.allowLocalModels = false;

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

    if (!text) return;

    try {
        // Retrieve the singleton instance of the pipeline
        const extractor = await PipelineSingleton.getInstance((progress) => {
            // Send progress updates back to the main thread
            self.postMessage({ status: 'progress', progress });
        });

        // Run the model. Extractor handles both string and string[]
        const output = await extractor(text, {
            pooling: 'mean',
            normalize: true,
        });

        // Prepare response based on input type
        const isBatch = Array.isArray(text);
        
        self.postMessage({
            status: 'complete',
            output: isBatch ? {
                type: 'batch',
                data: Array.from(output.data),
                dims: output.dims, // [batch_size, embedding_dim]
            } : {
                type: 'single',
                data: Array.from(output.data),
            },
        });
    } catch (error) {
        self.postMessage({
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
