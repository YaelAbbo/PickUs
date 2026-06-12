import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';

// Mock the @google/genai module
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      embedContent: jest.fn(),
    },
  })),
}));

import { GoogleGenAI } from '@google/genai';

describe('AiService', () => {
  let service: AiService;
  let mockCacheManager: {
    get: jest.Mock;
    set: jest.Mock;
  };
  let mockEmbedContent: jest.Mock;

  const mockVector = Array.from({ length: 768 }, (_, i) => i * 0.001);

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    mockEmbedContent = jest.fn().mockResolvedValue({
      embeddings: [{ values: mockVector }],
    });

    (GoogleGenAI as jest.Mock).mockImplementation(() => ({
      models: {
        embedContent: mockEmbedContent,
      },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should return cached embedding if available', async () => {
      const cachedVector = [0.1, 0.2, 0.3];
      mockCacheManager.get.mockResolvedValue(cachedVector);

      const result = await service.generateEmbedding('test content');

      expect(result).toEqual(cachedVector);
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockEmbedContent).not.toHaveBeenCalled();
    });

    it('should call Gemini API when cache misses', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.generateEmbedding('test content');

      expect(result).toEqual(mockVector);
      expect(mockEmbedContent).toHaveBeenCalledWith({
        model: 'gemini-embedding-2',
        contents: 'task: clustering | query: test content',
        config: { outputDimensionality: 768 },
      });
    });

    it('should cache the embedding after API call', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      await service.generateEmbedding('test content');

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringMatching(/^emb:[a-f0-9]{64}$/), // SHA-256 hash
        mockVector,
        60 * 60 * 1000, // 1 hour TTL
      );
    });

    it('should produce consistent cache keys for same content', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      await service.generateEmbedding('identical content');
      const firstCacheKey = mockCacheManager.set.mock.calls[0][0];

      await service.generateEmbedding('identical content');
      const secondCacheKey = mockCacheManager.set.mock.calls[1][0];

      expect(firstCacheKey).toBe(secondCacheKey);
    });

    it('should produce different cache keys for different content', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      await service.generateEmbedding('content A');
      const keyA = mockCacheManager.set.mock.calls[0][0];

      await service.generateEmbedding('content B');
      const keyB = mockCacheManager.set.mock.calls[1][0];

      expect(keyA).not.toBe(keyB);
    });

    it('should throw error when Gemini returns empty embedding', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockEmbedContent.mockResolvedValue({ embeddings: [{ values: [] }] });

      await expect(service.generateEmbedding('test')).rejects.toThrow(
        'Gemini returned an empty embedding vector.',
      );
    });

    it('should throw error when Gemini returns no embeddings', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockEmbedContent.mockResolvedValue({ embeddings: [] });

      await expect(service.generateEmbedding('test')).rejects.toThrow(
        'Gemini returned an empty embedding vector.',
      );
    });

    it('should propagate Gemini API errors', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockEmbedContent.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(service.generateEmbedding('test')).rejects.toThrow(
        'API rate limit exceeded',
      );
    });
  });

  describe('constructor', () => {
    it('should initialize GoogleGenAI with API key from config', () => {
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    });
  });
});
