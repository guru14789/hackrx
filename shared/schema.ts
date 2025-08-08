import { z } from "zod";

// Document processing request schema
export const documentProcessingRequestSchema = z.object({
  documents: z.string().min(1, "Document URL is required"),
  questions: z.array(z.string().min(1, "Question cannot be empty"))
});

export const documentProcessingResponseSchema = z.object({
  answers: z.array(z.string()),
  metadata: z.object({
    processing_time: z.number(),
    token_count: z.number(),
    confidence_scores: z.array(z.number()),
    document_processed: z.boolean()
  }).optional()
});

// Question schema
export const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Question cannot be empty"),
  order: z.number()
});

// Answer with metadata schema
export const answerWithMetadataSchema = z.object({
  question: z.string(),
  answer: z.string(),
  confidence: z.number(),
  source_section: z.string().optional(),
  similarity_score: z.number().optional(),
  tokens_used: z.number().optional(),
  processing_time: z.number().optional()
});

// Processing status schema
export const processingStatusSchema = z.object({
  status: z.enum(['idle', 'processing', 'completed', 'error']),
  message: z.string().optional(),
  progress: z.number().min(0).max(100).optional()
});

export type DocumentProcessingRequest = z.infer<typeof documentProcessingRequestSchema>;
export type DocumentProcessingResponse = z.infer<typeof documentProcessingResponseSchema>;
export type Question = z.infer<typeof questionSchema>;
export type AnswerWithMetadata = z.infer<typeof answerWithMetadataSchema>;
export type ProcessingStatus = z.infer<typeof processingStatusSchema>;
