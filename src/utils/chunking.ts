/**
 * Splits a large text string into smaller chunks with overlap.
 * 
 * @param {string} text - The full document text.
 * @param {number} chunkSize - The maximum number of words per chunk.
 * @param {number} overlap - The number of words to overlap between chunks.
 * @returns {Array<string>} An array of text chunks.
 */
export function chunkText(text: string, chunkSize: number, overlap: number): string[] {
    if (!text || text.trim().length === 0) return [];
    if (chunkSize <= 0) return [text];
    
    // Safety: overlap must be less than chunkSize
    const effectiveOverlap = Math.max(0, Math.min(overlap, chunkSize - 1));
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += (chunkSize - effectiveOverlap)) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk) {
            chunks.push(chunk);
        }
        
        // Prevent infinite loop if chunkSize - effectiveOverlap is 0
        if (i + chunkSize >= words.length) break;
    }

    return chunks;
}
