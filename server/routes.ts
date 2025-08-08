import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import { storage } from "./storage";
import { documentProcessingRequestSchema, type DocumentProcessingResponse, type AnswerWithMetadata } from "@shared/schema";
import { DocumentProcessor } from "./services/document-processor";
import { FAISSSearch } from "./services/faiss-search";
import { OpenAIClient } from "./services/openai-client";

const BEARER_TOKEN = '9a653094793aedeae46f194aa755e2bb17f297f5209b7f99c1ced3671779d95d';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const documentProcessor = new DocumentProcessor();
  const openaiClient = new OpenAIClient();
  const faissSearch = new FAISSSearch(openaiClient);

  // Setup multer for file uploads
  const upload = multer({
    dest: path.join(process.cwd(), 'temp'),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.pdf', '.docx', '.doc', '.txt'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${ext}. Allowed types: ${allowedTypes.join(', ')}`));
      }
    }
  });

  // Authentication middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token !== BEARER_TOKEN) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    next();
  };

  // Main processing endpoint
  app.post('/api/v1/hackrx/run', authenticateToken, async (req, res) => {
    try {
      const validatedRequest = documentProcessingRequestSchema.parse(req.body);
      const startTime = Date.now();

      // Store request and get processing ID
      const processingId = await storage.storeProcessingRequest(validatedRequest);

      // Update status to processing
      await storage.updateProcessingStatus(processingId, {
        status: 'processing',
        message: 'Downloading and processing document',
        progress: 10
      });

      // Download and process document
      let processedDoc;
      try {
        const documentPath = await documentProcessor.downloadDocument(validatedRequest.documents);
        
        await storage.updateProcessingStatus(processingId, {
          status: 'processing',
          message: 'Extracting text and generating embeddings',
          progress: 30
        });

        processedDoc = await documentProcessor.processDocument(documentPath);
      } catch (downloadError) {
        console.error('Document download/processing failed:', downloadError);
        await storage.updateProcessingStatus(processingId, {
          status: 'error',
          message: `Failed to process document: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`,
          progress: 0
        });
        
        return res.status(400).json({
          message: 'Document processing failed',
          error: downloadError instanceof Error ? downloadError.message : 'Unknown error'
        });
      }

      // Index document in FAISS
      await faissSearch.indexDocument(processedDoc.chunks);

      await storage.updateProcessingStatus(processingId, {
        status: 'processing',
        message: 'Generating answers',
        progress: 60
      });

      // Process each question
      const answers: string[] = [];
      const detailedAnswers: AnswerWithMetadata[] = [];
      let totalTokens = 0;
      const confidenceScores: number[] = [];

      for (let i = 0; i < validatedRequest.questions.length; i++) {
        const question = validatedRequest.questions[i];

        try {
          // Search for relevant context
          const searchResults = await faissSearch.search(question, 3);
          const contextChunks = searchResults.map(result => result.chunk);

          // Generate answer using OpenAI
          const answerData = await openaiClient.generateAnswer(question, contextChunks);
          
          answers.push(answerData.answer);
          totalTokens += answerData.tokensUsed;
          confidenceScores.push(answerData.confidence);

          detailedAnswers.push({
            question,
            answer: answerData.answer,
            confidence: answerData.confidence,
            source_section: searchResults[0]?.chunk.match(/Section\s+[\d.]+[:\s]+([^:\n]+)/i)?.[1]?.trim() || 'Unknown',
            similarity_score: searchResults[0]?.similarity || 0,
            tokens_used: answerData.tokensUsed,
            processing_time: Date.now() - startTime
          });

          // Update progress
          const progress = 60 + ((i + 1) / validatedRequest.questions.length) * 30;
          await storage.updateProcessingStatus(processingId, {
            status: 'processing',
            message: `Processing question ${i + 1} of ${validatedRequest.questions.length}`,
            progress: Math.round(progress)
          });

        } catch (error) {
          console.error(`Error processing question "${question}":`, error);
          answers.push(`Error processing question: ${error instanceof Error ? error.message : 'Unknown error'}`);
          confidenceScores.push(0);
        }
      }

      const processingTime = (Date.now() - startTime) / 1000;

      const response: DocumentProcessingResponse = {
        answers,
        metadata: {
          processing_time: processingTime,
          token_count: totalTokens,
          confidence_scores: confidenceScores,
          document_processed: true
        }
      };

      // Store the result
      await storage.storeProcessingResult(processingId, response);

      res.json(response);

    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ 
        message: 'Processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Status check endpoint
  app.get('/api/v1/hackrx/status/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const status = await storage.getProcessingStatus(id);
      
      if (!status) {
        return res.status(404).json({ message: 'Processing ID not found' });
      }

      res.json(status);
    } catch (error) {
      console.error('Status check error:', error);
      res.status(500).json({ message: 'Status check failed' });
    }
  });

  // Health check endpoint
  app.get('/api/v1/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      services: {
        'faiss_vector_db': 'connected',
        'gpt4_api': 'active',
        'document_parser': 'ready',
        'api_gateway': 'healthy'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Webhook endpoint for file upload and processing
  app.post('/api/v1/webhook/document-upload', upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded. Please upload a document.'
        });
      }

      const { questions, callback_url, webhook_id } = req.body;
      const parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
      
      if (!parsedQuestions || !Array.isArray(parsedQuestions)) {
        return res.status(400).json({
          error: 'Missing or invalid questions array'
        });
      }

      // Process asynchronously and respond immediately
      res.status(202).json({
        message: 'File upload successful, processing started',
        webhook_id: webhook_id || `upload_${Date.now()}`,
        status: 'processing',
        filename: req.file.originalname
      });

      // Process file in background
      processUploadedFileAsync(req.file.path, parsedQuestions, callback_url, webhook_id, req.file.originalname);

    } catch (error) {
      console.error('Upload webhook error:', error);
      res.status(500).json({
        error: 'File upload processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Webhook endpoint for external document processing
  app.post('/api/v1/webhook/document-process', async (req, res) => {
    try {
      console.log('Webhook received:', req.body);
      
      const { document_url, questions, callback_url, webhook_id } = req.body;
      
      if (!document_url || !questions || !Array.isArray(questions)) {
        return res.status(400).json({
          error: 'Missing required fields: document_url and questions array'
        });
      }

      // Process asynchronously and respond immediately
      res.status(202).json({
        message: 'Document processing started',
        webhook_id: webhook_id || `webhook_${Date.now()}`,
        status: 'processing'
      });

      // Process document in background
      processDocumentAsync(document_url, questions, callback_url, webhook_id);

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Function to process document asynchronously
  async function processDocumentAsync(document_url: string, questions: string[], callback_url?: string, webhook_id?: string) {
    try {
      console.log('Starting async document processing for:', document_url);
      
      const documentPath = await documentProcessor.downloadDocument(document_url);
      const processedDoc = await documentProcessor.processDocument(documentPath);
      
      // Index document in FAISS
      await faissSearch.indexDocument(processedDoc.chunks);
      
      // Process questions
      const answers: string[] = [];
      const detailedAnswers: any[] = [];
      let totalTokens = 0;
      
      for (const question of questions) {
        try {
          const searchResults = await faissSearch.search(question, 3);
          const contextChunks = searchResults.map(result => result.chunk);
          const answerData = await openaiClient.generateAnswer(question, contextChunks);
          
          answers.push(answerData.answer);
          totalTokens += answerData.tokensUsed;
          
          detailedAnswers.push({
            question,
            answer: answerData.answer,
            confidence: answerData.confidence,
            source_section: searchResults[0]?.chunk.match(/Section\s+[\d.]+[:\s]+([^:\n]+)/i)?.[1]?.trim() || 'Unknown',
            similarity_score: searchResults[0]?.similarity || 0,
            tokens_used: answerData.tokensUsed
          });
        } catch (error) {
          console.error(`Error processing question "${question}":`, error);
          answers.push(`Error: ${error instanceof Error ? error.message : 'Processing failed'}`);
          detailedAnswers.push({
            question,
            answer: `Error: ${error instanceof Error ? error.message : 'Processing failed'}`,
            confidence: 0,
            source_section: 'Error',
            similarity_score: 0,
            tokens_used: 0
          });
        }
      }

      const result = {
        webhook_id: webhook_id || `webhook_${Date.now()}`,
        status: 'completed',
        document_processed: true,
        answers,
        detailed_answers: detailedAnswers,
        metadata: {
          document_title: processedDoc.metadata.title,
          total_tokens: totalTokens,
          processing_time: new Date().toISOString()
        }
      };

      console.log('Document processing completed:', result);

      // Send callback if URL provided
      if (callback_url) {
        try {
          const fetch = (await import('node-fetch')).default;
          await fetch(callback_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
          });
          console.log('Callback sent to:', callback_url);
        } catch (callbackError) {
          console.error('Failed to send callback:', callbackError);
        }
      }

    } catch (error) {
      console.error('Async processing error:', error);
      
      const errorResult = {
        webhook_id: webhook_id || `webhook_${Date.now()}`,
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed',
        processing_time: new Date().toISOString()
      };

      // Send error callback if URL provided
      if (callback_url) {
        try {
          const fetch = (await import('node-fetch')).default;
          await fetch(callback_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorResult)
          });
        } catch (callbackError) {
          console.error('Failed to send error callback:', callbackError);
        }
      }
    }
  }

  // Function to process uploaded file asynchronously
  async function processUploadedFileAsync(filePath: string, questions: string[], callback_url?: string, webhook_id?: string, originalName?: string) {
    try {
      console.log('Starting uploaded file processing for:', originalName);
      
      const processedDoc = await documentProcessor.processDocument(filePath);
      
      // Index document in FAISS
      await faissSearch.indexDocument(processedDoc.chunks);
      
      // Process questions
      const answers: string[] = [];
      const detailedAnswers: any[] = [];
      let totalTokens = 0;
      
      for (const question of questions) {
        try {
          const searchResults = await faissSearch.search(question, 3);
          const contextChunks = searchResults.map(result => result.chunk);
          const answerData = await openaiClient.generateAnswer(question, contextChunks);
          
          answers.push(answerData.answer);
          totalTokens += answerData.tokensUsed;
          
          detailedAnswers.push({
            question,
            answer: answerData.answer,
            confidence: answerData.confidence,
            source_section: searchResults[0]?.chunk.match(/Section\s+[\d.]+[:\s]+([^:\n]+)/i)?.[1]?.trim() || 'Unknown',
            similarity_score: searchResults[0]?.similarity || 0,
            tokens_used: answerData.tokensUsed
          });
        } catch (error) {
          console.error(`Error processing question "${question}":`, error);
          answers.push(`Error: ${error instanceof Error ? error.message : 'Processing failed'}`);
          detailedAnswers.push({
            question,
            answer: `Error: ${error instanceof Error ? error.message : 'Processing failed'}`,
            confidence: 0,
            source_section: 'Error',
            similarity_score: 0,
            tokens_used: 0
          });
        }
      }

      const result = {
        webhook_id: webhook_id || `upload_${Date.now()}`,
        status: 'completed',
        document_processed: true,
        filename: originalName,
        answers,
        detailed_answers: detailedAnswers,
        metadata: {
          document_title: processedDoc.metadata.title || originalName,
          total_tokens: totalTokens,
          processing_time: new Date().toISOString()
        }
      };

      console.log('Uploaded file processing completed:', result);

      // Send callback if URL provided
      if (callback_url) {
        try {
          const fetch = (await import('node-fetch')).default;
          await fetch(callback_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
          });
          console.log('Upload callback sent to:', callback_url);
        } catch (callbackError) {
          console.error('Failed to send upload callback:', callbackError);
        }
      }

    } catch (error) {
      console.error('Uploaded file processing error:', error);
      
      const errorResult = {
        webhook_id: webhook_id || `upload_${Date.now()}`,
        status: 'error',
        filename: originalName,
        error: error instanceof Error ? error.message : 'Processing failed',
        processing_time: new Date().toISOString()
      };

      // Send error callback if URL provided
      if (callback_url) {
        try {
          const fetch = (await import('node-fetch')).default;
          await fetch(callback_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorResult)
          });
        } catch (callbackError) {
          console.error('Failed to send upload error callback:', callbackError);
        }
      }
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
