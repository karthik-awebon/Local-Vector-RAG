import { useEffect, useState, useCallback } from 'react';
import { create, insert, search, Orama, AnyDocument } from '@orama/orama';
import { 
    afterInsert as highlightAfterInsert, 
    saveWithHighlight, 
    loadWithHighlight 
} from '@orama/plugin-match-highlight';
import { get, set } from 'idb-keyval';

export interface SearchResult {
    document: AnyDocument;
    score: number;
}

const DB_STORAGE_KEY = 'orama-vector-db-snapshot';

export function useVectorDB() {
    const [db, setDb] = useState<Orama<any> | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize the database
    useEffect(() => {
        const initDB = async () => {
            try {
                // 1. Try to load from IndexedDB
                const savedSnapshot = await get(DB_STORAGE_KEY);
                
                if (savedSnapshot) {
                    try {
                        const restoredDb = await loadWithHighlight(savedSnapshot);
                        setDb(restoredDb);
                        setIsInitialized(true);
                        return;
                    } catch (restoreErr) {
                        console.error('Failed to restore DB, creating fresh instance', restoreErr);
                    }
                }

                // 2. Create fresh instance if no snapshot or restore failed
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
                
                setDb(newDb);
                setIsInitialized(true);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            }
        };

        if (typeof window !== 'undefined' && !db) {
            initDB();
        }
    }, [db]);

    const insertDocument = useCallback(async (content: string, embedding: number[], metadata: string = '') => {
        if (!db) return;

        try {
            // Insert into Orama
            await insert(db, {
                content,
                embedding,
                metadata,
            });

            // Persist snapshot to IndexedDB
            const snapshot = await saveWithHighlight(db);
            await set(DB_STORAGE_KEY, snapshot);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }, [db]);

    const vectorSearch = useCallback(async (queryVector: number[], limit: number = 5) => {
        if (!db) return [];

        try {
            const results = await search(db, {
                mode: 'vector',
                vector: {
                    value: queryVector,
                    property: 'embedding',
                },
                limit,
            });

            return results.hits;
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            return [];
        }
    }, [db]);

    return {
        isInitialized,
        error,
        insertDocument,
        vectorSearch,
    };
}
