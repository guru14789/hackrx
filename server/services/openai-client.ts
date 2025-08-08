import OpenAI from 'openai';

export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '';
    if (!apiKey) {
      console.warn('OpenAI API key not found. Some features may not work properly.');
    }

    this.client = new OpenAI({
      apiKey: apiKey || 'dummy-key'
    });
  }

  async generateAnswer(question: string, context: string[]): Promise<{
    answer: string;
    confidence: number;
    tokensUsed: number;
  }> {
    try {
      const contextText = context.join('\n\n');
      const prompt = this.buildPrompt(question, contextText);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert document analyst specializing in insurance policies, legal documents, and compliance materials. Provide accurate, detailed answers based on the provided context. If information is not available in the context, clearly state that.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const answer = response.choices[0]?.message?.content || 'No answer generated';
      const tokensUsed = response.usage?.total_tokens || 0;

      // Calculate confidence based on context relevance
      const confidence = this.calculateConfidence(question, contextText, answer);

      return {
        answer,
        confidence,
        tokensUsed
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate answer: ${error instanceof Error ? error.message : 'OpenAI API error'}`);
    }
  }

  private buildPrompt(question: string, context: string): string {
    return `Based on the following document context, please answer the question accurately and comprehensively.

Context:
${context}

Question: ${question}

Instructions:
- Provide a clear, direct answer based on the context
- Include relevant details like time periods, conditions, or limitations
- If the context doesn't contain enough information, state this clearly
- Maintain a professional, informative tone

Answer:`;
  }

  private calculateConfidence(question: string, context: string, answer: string): number {
    // Simple confidence calculation based on answer length and context relevance
    const questionWords = question.toLowerCase().split(/\s+/);
    const contextWords = context.toLowerCase().split(/\s+/);
    const answerWords = answer.toLowerCase().split(/\s+/);

    let relevanceScore = 0;
    questionWords.forEach(word => {
      if (contextWords.includes(word)) relevanceScore += 1;
      if (answerWords.includes(word)) relevanceScore += 0.5;
    });

    // Normalize to 0-1 range
    const maxPossibleScore = questionWords.length * 1.5;
    const confidence = Math.min(relevanceScore / maxPossibleScore, 1);

    // Ensure minimum confidence of 0.5 for valid answers
    return Math.max(confidence, 0.5);
  }



  get embeddings() {
    return this.client.embeddings;
  }
}
