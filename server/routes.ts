import type { Express } from "express";
import { createServer, type Server } from "http";
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

  const httpServer = createServer(app);
  return httpServer;
}
