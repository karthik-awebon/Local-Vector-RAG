# Gemini Project Context: Semantic Search Dashboard (Local RAG)

This document provides foundational context and instructions for AI agents working on the Semantic Search Dashboard project.

## Project Overview

The **Semantic Search Dashboard** is a private, browser-native Local Retrieval-Augmented Generation (RAG) application. It allows users to index documents, perform vector-based semantic searches, and chat with an AI model using their indexed data as context—all without sending data to an external server.

### Core Technology Stack

- **Framework:** Next.js 16+ (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS 4
- **Local Embeddings:** `@xenova/transformers` (running `all-MiniLM-L6-v2` in a Web Worker)
- **Vector Database:** `@orama/orama` with `@orama/plugin-match-highlight`
- **Local LLM:** `@mlc-ai/web-llm` (e.g., `Llama-3.1-8B-Instruct`)
- **Persistence:** `idb-keyval` (IndexedDB) for storing vector database snapshots

### Architecture

1.  **Indexing Flow:** Text Input -> `chunkText` (Utility) -> `useEmbeddingWorker` -> `worker.ts` (Web Worker using Transformers.js) -> `useVectorDB` -> Orama DB -> IndexedDB (Snapshot).
2.  **Search Flow:** Query Input -> `useEmbeddingWorker` -> Query Vector -> `useVectorDB` (Orama Vector Search) -> Ranked Hits.
3.  **Chat Flow:** Query Input -> Vector Search -> Context Retrieval -> `useChatModel` (Web-LLM) -> Streamed AI Response.

## Building and Running

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

## Directory Structure

- `src/app/`: Next.js App Router pages and layouts. `page.tsx` contains the main dashboard logic.
- `src/hooks/`: Custom React hooks for modularizing RAG logic.
  - `useVectorDB.ts`: Manages Orama instance, persistence, and vector search.
  - `useEmbeddingWorker.ts`: Interface for the embedding Web Worker.
  - `useChatModel.ts`: Interface for the Web-LLM local engine.
- `src/lib/`: Core libraries and workers.
  - `worker.ts`: Web Worker implementation for heavy ML computation (Transformers.js).
- `src/utils/`: Shared utilities like `chunking.ts`.

## Development Conventions

### ML/LLM Performance
- All heavy embedding computations **must** happen in `src/lib/worker.ts` to keep the UI thread responsive.
- Web-LLM models are large; use the `initEngine` callback to track loading progress.

### Vector Database (Orama)
- Orama snapshots are persisted to IndexedDB under the key `orama-vector-db-snapshot`.
- When modifying the schema in `useVectorDB.ts`, ensure that snapshot loading handles migrations or clear the existing snapshot.

### Next.js 16 + Turbopack
- `next.config.ts` includes specific Turbopack `resolveAlias` and `serverExternalPackages` configurations to handle Node-specific modules (like `fs`, `path`) that are not available in the browser during ML model execution.

## Future Roadmap (TODOs)
- [ ] Support for PDF/Word document uploads.
- [ ] Advanced chunking strategies (semantic chunking).
- [ ] Metadata filtering in vector search.
- [ ] Export/Import functionality for the indexed knowledge base.
