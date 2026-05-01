# Local Semantic Search Dashboard (RAG)

A private, browser-native Retrieval-Augmented Generation (RAG) application. Index your documents, search through them semantically, and chat with a local AI model—all without your data ever leaving your machine.

## 🚀 Features

- **100% Local & Private:** All computations (embeddings, vector search, LLM generation) happen in your browser.
- **Multi-Format Support:** Index raw text, PDF documents, and Word (`.docx`) files.
- **Semantic Search:** Uses vector embeddings to find relevant information beyond simple keyword matching.
- **Grounded Chat:** Chat with a local LLM (Llama 3.1) that uses your indexed data as context.
- **Persistent Storage:** Your index is saved to IndexedDB, so it stays available across sessions.
- **High Performance:** Heavy ML tasks are offloaded to Web Workers and WebGPU to keep the UI responsive.

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Embeddings:** Transformers.js (`all-MiniLM-L6-v2`)
- **Vector DB:** Orama
- **Local LLM:** Web-LLM (Llama 3.1 8B)
- **Document Parsing:** PDF.js, Mammoth
- **Persistence:** IndexedDB (via idb-keyval)

## 🚦 Getting Started

### Prerequisites
- A modern browser with **WebGPU** support (Chrome/Edge recommended).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/karthik-awebon/Local-Vector-RAG.git
   cd Local-Vector-RAG
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and wait for the models to initialize.

## 📖 How it Works

1. **Indexing:** When you upload a file or enter text, it is split into chunks. Each chunk is converted into a 384-dimensional vector by a background Web Worker.
2. **Search:** Your search query is vectorized using the same model. The dashboard then performs a cosine similarity search in the Orama vector database.
3. **Chat:** The most relevant chunks are retrieved and provided as "context" to the local LLM, ensuring its answers are grounded in your data.

## 🏗️ Architecture

For a deep dive into the system design, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 📄 License

MIT
