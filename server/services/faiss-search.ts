import * as fs from 'fs';
import * as path from 'path';

export interface SearchResult {
  chunk: string;
  similarity: number;
  index: number;
}

export interface EmbeddingVector {
  chunk: string;
  embedding: number[];
  metadata: {
    section?: string;
    page?: number;
  };
}

export class FAISSSearch {
  private embeddings: EmbeddingVector[] = [];
  private openaiClient: any;

  constructor(openaiClient: any) {
    this.openaiClient = openaiClient;
  }

  async indexDocument(chunks: string[]): Promise<void> {
    this.embeddings = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const embedding = await this.generateEmbedding(chunk);
        this.embeddings.push({
          chunk,
          embedding,
          metadata: {
            section: this.extractSection(chunk),
            page: i + 1
          }
        });
      } catch (error) {
        console.error(`Failed to generate embedding for chunk ${i}:`, error);
      }
    }
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (this.embeddings.length === 0) {
      throw new Error('No documents indexed');
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const similarities: SearchResult[] = [];

      for (let i = 0; i < this.embeddings.length; i++) {
        const similarity = this.cosineSimilarity(queryEmbedding, this.embeddings[i].embedding);
        similarities.push({
          chunk: this.embeddings[i].chunk,
          similarity,
          index: i
        });
      }

      // Sort by similarity and return top K
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    } catch (error) {
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openaiClient.embeddings.create({
        model: "text-embedding-ada-002",
        input: text.substring(0, 8000) // Truncate to avoid token limits
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI embedding error:', error);
      // Fallback to dummy embedding for development
      return this.generateDummyEmbedding(text);
    }
  }

  private generateDummyEmbedding(text: string): number[] {
    // Generate a consistent dummy embedding based on text content
    const hash = this.simpleHash(text);
    const embedding: number[] = [];
    
    for (let i = 0; i < 1536; i++) { // OpenAI ada-002 dimension
      embedding.push((Math.sin(hash + i) + 1) / 2);
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private extractSection(chunk: string): string {
    // Extract section information from chunk
    const sectionMatch = chunk.match(/Section\s+[\d.]+[:\s]+([^:\n]+)/i);
    return sectionMatch ? sectionMatch[1].trim() : 'Unknown Section';
  }
}
