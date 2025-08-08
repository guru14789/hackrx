import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';

export interface ProcessedDocument {
  content: string;
  chunks: string[];
  metadata: {
    title?: string;
    pages?: number;
    size?: number;
  };
}

export class DocumentProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async downloadDocument(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Determine file extension from URL or content-type
      let extension = '.pdf'; // Default to PDF
      const urlPath = new URL(url).pathname;
      if (urlPath.includes('.pdf')) extension = '.pdf';
      else if (urlPath.includes('.docx')) extension = '.docx';
      else if (urlPath.includes('.doc')) extension = '.docx';
      else if (urlPath.includes('.txt')) extension = '.txt';
      else {
        // Try to determine from content-type header
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('pdf')) extension = '.pdf';
        else if (contentType?.includes('document')) extension = '.docx';
        else if (contentType?.includes('text')) extension = '.txt';
      }

      const filename = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${extension}`;
      const filepath = path.join(this.tempDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      return filepath;
    } catch (error) {
      throw new Error(`Document download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processDocument(filepath: string): Promise<ProcessedDocument> {
    const extension = path.extname(filepath).toLowerCase();
    console.log(`Processing document with extension: "${extension}" from filepath: ${filepath}`);
    
    try {
      switch (extension) {
        case '.pdf':
          return await this.processPDF(filepath);
        case '.docx':
        case '.doc':
          return await this.processDOCX(filepath);
        case '.txt':
          return await this.processTXT(filepath);
        default:
          // For HackRX demo, use fallback content regardless of format issues
          console.log(`Unknown or missing extension: "${extension}", using demo content`);
          const content = await this.extractTextFromFile(filepath, 'demo');
          const chunks = this.chunkText(content);
          
          return {
            content,
            chunks,
            metadata: {
              title: path.basename(filepath) || 'Demo Policy Document',
              size: fs.existsSync(filepath) ? fs.statSync(filepath).size : 0
            }
          };
      }
    } finally {
      // Clean up temp file
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
  }

  private async processPDF(filepath: string): Promise<ProcessedDocument> {
    try {
      const pdfParse = await import('pdf-parse');
      const buffer = fs.readFileSync(filepath);
      const data = await (pdfParse as any).default(buffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF contains no readable text content');
      }
      const content = data.text;
      const chunks = this.chunkText(content);
      
      return {
        content,
        chunks,
        metadata: {
          title: path.basename(filepath),
          pages: data.numpages,
          size: fs.statSync(filepath).size
        }
      };
    } catch (error) {
      console.error('PDF parsing failed:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processDOCX(filepath: string): Promise<ProcessedDocument> {
    try {
      const mammoth = await import('mammoth');
      const buffer = fs.readFileSync(filepath);
      const result = await mammoth.extractRawText({ buffer });
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX contains no readable text content');
      }
      const content = result.value;
      const chunks = this.chunkText(content);
      
      return {
        content,
        chunks,
        metadata: {
          title: path.basename(filepath),
          size: fs.statSync(filepath).size
        }
      };
    } catch (error) {
      console.error('DOCX parsing failed:', error);
      throw new Error(`Failed to process DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processTXT(filepath: string): Promise<ProcessedDocument> {
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const chunks = this.chunkText(content);
      
      return {
        content,
        chunks,
        metadata: {
          title: path.basename(filepath),
          size: fs.statSync(filepath).size
        }
      };
    } catch (error) {
      throw new Error(`TXT processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextFromFile(filepath: string, type: string): Promise<string> {
    // This method should not be used as a fallback anymore - throw error instead
    throw new Error(`Failed to extract text from ${type} file: ${filepath}`);
  }

  private chunkText(text: string, chunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}
