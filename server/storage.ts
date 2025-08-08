import { type DocumentProcessingRequest, type DocumentProcessingResponse, type AnswerWithMetadata, type ProcessingStatus } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  storeProcessingRequest(request: DocumentProcessingRequest): Promise<string>;
  getProcessingResult(id: string): Promise<DocumentProcessingResponse | undefined>;
  storeProcessingResult(id: string, result: DocumentProcessingResponse): Promise<void>;
  updateProcessingStatus(id: string, status: ProcessingStatus): Promise<void>;
  getProcessingStatus(id: string): Promise<ProcessingStatus | undefined>;
}

export class MemStorage implements IStorage {
  private requests: Map<string, DocumentProcessingRequest>;
  private results: Map<string, DocumentProcessingResponse>;
  private statuses: Map<string, ProcessingStatus>;

  constructor() {
    this.requests = new Map();
    this.results = new Map();
    this.statuses = new Map();
  }

  async storeProcessingRequest(request: DocumentProcessingRequest): Promise<string> {
    const id = randomUUID();
    this.requests.set(id, request);
    this.statuses.set(id, {
      status: 'idle',
      message: 'Request received',
      progress: 0
    });
    return id;
  }

  async getProcessingResult(id: string): Promise<DocumentProcessingResponse | undefined> {
    return this.results.get(id);
  }

  async storeProcessingResult(id: string, result: DocumentProcessingResponse): Promise<void> {
    this.results.set(id, result);
    this.statuses.set(id, {
      status: 'completed',
      message: 'Processing completed successfully',
      progress: 100
    });
  }

  async updateProcessingStatus(id: string, status: ProcessingStatus): Promise<void> {
    this.statuses.set(id, status);
  }

  async getProcessingStatus(id: string): Promise<ProcessingStatus | undefined> {
    return this.statuses.get(id);
  }
}

export const storage = new MemStorage();
