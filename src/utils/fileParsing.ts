import mammoth from 'mammoth';

/**
 * Extracts raw text from a PDF file.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // Dynamically import pdfjs-dist to prevent Next.js SSR crashes
  const pdfjsLib = await import('pdfjs-dist');
  
  // Configure the worker for PDF.js using the corresponding version from unpkg
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  
  let fullText = '';
  
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    
    fullText += pageText + '\n';
  }
  
  return fullText;
}

/**
 * Extracts raw text from a Word document (.docx).
 */
export async function extractTextFromWord(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Orchestrates parsing based on file type.
 */
export async function parseFile(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }
  
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    file.name.toLowerCase().endsWith('.docx') ||
    file.name.toLowerCase().endsWith('.doc')
  ) {
    return extractTextFromWord(file);
  }
  
  throw new Error(`Unsupported file type: ${file.type || file.name}`);
}
