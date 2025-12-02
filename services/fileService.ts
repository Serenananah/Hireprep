
/**
 * fileService.ts
 * 
 * Acts as the "Backend" layer for document processing.
 * 
 * Responsibilities:
 * 1. Parse incoming files (PDF/TXT).
 * 2. Clean and Extract text.
 * 3. (Simulation) Initialize "Vector DB" entry (RAG prep).
 */

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export interface ParsedDocument {
  fileName: string;
  text: string;
  tokens: number; // Estimated
}

export const fileService = {

  /**
   * Reads a file and extracts text.
   * Simulates: Backend PDF Parser endpoint.
   */
  async processFile(file: File): Promise<ParsedDocument> {
    let text = "";

    try {
      if (file.type === "application/pdf") {
        text = await parsePdf(file);
      } else if (file.type === "text/plain") {
        text = await file.text();
      } else {
        // Fallback or Error
        console.warn("Unsupported file type, attempting text read:", file.type);
        text = await file.text();
      }
    } catch (error: any) {
      console.error("File parsing error:", error);
      throw new Error(`Failed to parse ${file.name}: ${error.message}`);
    }

    // Clean text (Simulates preprocessing)
    const cleanedText = text.replace(/\s+/g, ' ').trim();

    return {
      fileName: file.name,
      text: cleanedText,
      tokens: Math.ceil(cleanedText.length / 4)
    };
  },

  /**
   * Simulates the Backend "RAG Indexing" process.
   * In a real backend: Text -> Embeddings -> ChromaDB.
   * In Gemini Serverless: We prepare the full context for the session.
   */
  async initializeRagSession(userId: string, jdDoc: ParsedDocument | null, resumeDoc: ParsedDocument | null): Promise<string> {
    
    // Simulate API Latency (Embeddings generation time)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a Session ID
    const sessionId = `sess_${userId}_${Date.now()}`;

    // Note: In a real RAG system, we would insert `jdDoc.text` and `resumeDoc.text` into ChromaDB here.
    // For this app, we will return the sessionId. The caller (UI) will hold the text 
    // and pass it to the "Generative Model" which acts as our retriever via its Context Window.
    
    console.log(`[Backend] Indexed documents for Session ${sessionId}`);
    console.log(`[Backend] Resume Tokens: ${resumeDoc?.tokens || 0}, JD Tokens: ${jdDoc?.tokens || 0}`);

    return sessionId;
  }
};

/**
 * Helper: Parse PDF using PDF.js
 * Uses dynamic loading to ensure library is available.
 */
async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Ensure Library is Loaded
  if (!window.pdfjsLib) {
    try {
      await loadPdfLib();
    } catch (e) {
      throw new Error("PDF.js library could not be loaded. Please check your internet connection.");
    }
  }

  // Double check initialization
  if (!window.pdfjsLib) {
     throw new Error("PDF.js library failed to initialize");
  }

  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  // Iterate over all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

function loadPdfLib(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded
    if (window.pdfjsLib) return resolve();

    const script = document.createElement('script');
    // Use unpkg as fallback if cdnjs is blocked
    script.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
    script.async = true;
    
    script.onload = () => {
      // Poll briefly for the global variable
      let checks = 0;
      const interval = setInterval(() => {
         if (window.pdfjsLib) {
            clearInterval(interval);
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
            resolve();
         } else {
            checks++;
            if (checks > 10) {
               clearInterval(interval);
               reject(new Error("PDF.js loaded but object not found"));
            }
         }
      }, 50);
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js script"));
    document.head.appendChild(script);
  });
}
