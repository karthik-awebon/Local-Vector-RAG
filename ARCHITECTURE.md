# System Architecture

This project implements a fully local, browser-native Retrieval-Augmented Generation (RAG) pipeline.

## High-Level Data Flow

```mermaid
graph TD
    subgraph UI_Layer [Browser UI - React 19]
        User([User Input]) --> Dashboard[src/app/page.tsx]
        Dashboard --> ResultsDisplay[Results/Chat Display]
    end

    subgraph Hook_Layer [Coordination Hooks]
        Dashboard --> useEW[useEmbeddingWorker]
        Dashboard --> useVDB[useVectorDB]
        Dashboard --> useChat[useChatModel]
    end

    subgraph Computation_Layer [Worker Thread]
        useEW --> Worker[src/lib/worker.ts]
        Worker --> TJS[Transformers.js]
        TJS --> Model_Embed[all-MiniLM-L6-v2]
    end

    subgraph Search_Layer [Main Thread]
        useVDB --> Orama[Orama Vector DB]
        Orama --> IDB[(IndexedDB Storage)]
    end

    subgraph Generation_Layer [GPU/WebWorker]
        useChat --> WebLLM[Web-LLM Engine]
        WebLLM --> Llama[Llama-3.1-8B-Instruct]
    end

    %% Flow: Indexing
    User -- "1. Index Text" --> Dashboard
    Dashboard -- "2. Chunk" --> useEW
    useEW -- "3. Vectorize" --> Worker
    Worker -- "4. Embedding" --> useVDB
    useVDB -- "5. Store" --> Orama

    %% Flow: RAG
    User -- "6. Search/Chat" --> Dashboard
    Dashboard -- "7. Vectorize Query" --> useEW
    useEW -- "8. Query Vector" --> useVDB
    useVDB -- "9. Search" --> Orama
    Orama -- "10. Context" --> useChat
    useChat -- "11. Generate Response" --> Dashboard
```

## Component Breakdown

### 1. UI Layer (`src/app/page.tsx`)
The main entry point that manages tab state (Index, Search, Chat) and orchestrates the interaction between the different RAG hooks.

### 2. Embedding Worker (`src/lib/worker.ts`)
To prevent UI jank, all vectorization is offloaded to a Web Worker. It uses **Transformers.js** to run the `all-MiniLM-L6-v2` model. It handles both single query vectorization and batch processing for document chunks.

### 3. Vector Database (`src/hooks/useVectorDB.ts`)
Uses **Orama** to perform fast in-memory vector similarity searches.
- **Persistence:** Snapshots the database to **IndexedDB** using `idb-keyval` every time a document is indexed.
- **Retrieval:** On startup, it attempts to restore the state from the IndexedDB snapshot.

### 4. Chat Engine (`src/hooks/useChatModel.ts`)
Uses **Web-LLM** to run large language models (like Llama 3.1) directly in the browser using WebGPU. It receives retrieved context from the Vector DB and constructs a prompt for the local LLM to generate grounded answers.

### 5. Utilities (`src/utils/chunking.ts`)
Handles the sliding-window chunking logic to break down large documents into manageable pieces for embedding and retrieval.
