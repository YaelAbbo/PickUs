import { GoogleGenAI } from '@google/genai';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { createHash } from 'crypto';

const EMBEDDING_MODEL = 'gemini-embedding-2';
const OUTPUT_DIMENSIONALITY = 768;
const TASK_PREFIX = 'task: clustering | query:';
const CACHE_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not defined — embedding calls will fail.',
      );
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey ?? '' });
  }

  private buildEmbeddingText(content: string): string {
    return `${TASK_PREFIX} ${content}`;
  }

  /**
   * Produces a stable, fixed-length cache key by SHA-256 hashing the full
   * embedding string for Redis memory efficiency.
   */
  private getCacheKey(text: string): string {
    return `emb:${createHash('sha256').update(text).digest('hex')}`;
  }

  async generateEmbedding(content: string): Promise<number[]> {
    const embeddingText = this.buildEmbeddingText(content);
    const cacheKey = this.getCacheKey(embeddingText);

    const cached = await this.cacheManager.get<number[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for embedding key: ${cacheKey}`);
      return cached;
    }

    const result = await this.ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: embeddingText,
      config: { outputDimensionality: OUTPUT_DIMENSIONALITY },
    });

    const vector = result.embeddings?.[0]?.values ?? [];
    if (vector.length === 0) {
      throw new Error('Gemini returned an empty embedding vector.');
    }

    await this.cacheManager.set(cacheKey, vector, CACHE_TTL_MS);
    this.logger.debug(`Embedding cached under key: ${cacheKey}`);

    return vector;
  }
}
