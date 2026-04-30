import { useEffect, useState, useCallback } from 'react';
import { create, insert, search, count, Orama, AnyDocument } from '@orama/orama';
import {
    afterInsert as highlightAfterInsert,
    saveWithHighlight,
    loadWithHighlight
} from '@orama/plugin-match-highlight';
import { get, set, del } from 'idb-keyval';

export interface SearchResult {
    document: AnyDocument;
    score: number;
}

const DB_STORAGE_KEY = 'orama-vector-db-snapshot';

export function useVectorDB() {
    const [db, setDb] = useState<Orama<any> | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initDB = useCallback(async () => {
        console.log('[useVectorDB] Initializing database...');
        try {
            // 1. Create the instance first (required for Orama 3.x load)
            const newDb = await create({
                schema: {
                    content: 'string',
                    embedding: 'vector[384]',
                    metadata: 'string',
                },
                plugins: [
                    {
                        name: 'highlight',
                        afterInsert: highlightAfterInsert,
                    },
                ],
            });

            // 2. Try to load from IndexedDB
            const savedSnapshot = await get(DB_STORAGE_KEY);
            console.log('[useVectorDB] Snapshot from IndexedDB:', savedSnapshot ? 'Found' : 'Not found');

            if (savedSnapshot) {
                try {
                    console.log('[useVectorDB] Attempting to restore from snapshot...');
                    // In Orama 3.x, loadWithHighlight takes (db, snapshot)
                    await loadWithHighlight(newDb, savedSnapshot);
                    console.log('[useVectorDB] Database restored successfully');
                } catch (restoreErr) {
                    console.error('[useVectorDB] Failed to restore DB, proceeding with empty DB:', restoreErr);
                    // We continue with the fresh newDb we already created
                }
            }

            setDb(newDb);
            setIsInitialized(true);
        } catch (err) {
            console.error('[useVectorDB] Fatal initialization error:', err);
            setError(err instanceof Error ? err.message : String(err));
        }
    }, []);

    // Initialize the database
    useEffect(() => {
        if (typeof window !== 'undefined' && !db) {
            initDB();
        }
    }, [db, initDB]);

    const insertDocument = useCallback(async (content: string, embedding: number[], metadata: string = '') => {
        if (!db) {
            console.error('[useVectorDB] Cannot insert: Database not initialized');
            return;
        }

        try {
            console.log('[useVectorDB] Inserting document:', {
                contentSnippet: content.substring(0, 50) + '...',
                embeddingLength: embedding.length,
                metadata
            });

            if (embedding.length !== 384) {
                console.error(`[useVectorDB] Vector dimension mismatch! Expected 384, got ${embedding.length}`);
            }

            // Insert into Orama
            const id = await insert(db, {
                content,
                embedding,
                metadata,
            });

            const totalDocs = await count(db);
            console.log(`[useVectorDB] Insert successful. ID: ${id}. Total docs in DB: ${totalDocs}`);

            // Persist snapshot to IndexedDB
            const snapshot = await saveWithHighlight(db);
            await set(DB_STORAGE_KEY, snapshot);

        } catch (err) {
            console.error('[useVectorDB] Insert error:', err);
            setError(err instanceof Error ? err.message : String(err));
        }
    }, [db]);

    const vectorSearch = useCallback(async (queryVector: number[], limit: number = 5) => {
        if (!db) {
            console.error('[useVectorDB] Cannot search: Database not initialized');
            return [];
        }

        try {
            const totalDocs = await count(db);
            console.log(`[useVectorDB] Starting search. Total docs in DB: ${totalDocs}, Query vector length: ${queryVector.length}`);

            if (totalDocs === 0) {
                console.warn('[useVectorDB] Search called on an empty database');
                return [];
            }

            const results = await search(db, {
                mode: 'vector',
                vector: {
                    value: queryVector,
                    property: 'embedding',
                },
                similarity: 0.2, // Set a very low threshold to see if anything matches
                limit,
            });

            console.log(`[useVectorDB] Search complete. Found ${results.hits.length} hits`, results.hits);
            return results.hits;
        } catch (err) {
            console.error('[useVectorDB] Search error:', err);
            setError(err instanceof Error ? err.message : String(err));
            return [];
        }
    }, [db]);

    const clearDatabase = useCallback(async () => {
        try {
            console.log('[useVectorDB] Clearing database...');
            await del(DB_STORAGE_KEY);
            setIsInitialized(false);
            setDb(null); // This will trigger re-initialization via useEffect
            console.log('[useVectorDB] Database cleared and reset');
        } catch (err) {
            console.error('[useVectorDB] Clear database error:', err);
            setError(err instanceof Error ? err.message : String(err));
        }
    }, []);

    return {
        isInitialized,
        error,
        insertDocument,
        vectorSearch,
        clearDatabase,
    };
}
