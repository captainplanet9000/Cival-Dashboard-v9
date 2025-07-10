'use client'

/**
 * Semantic Search Service for Agent Memories
 * Provides embedding generation and similarity search capabilities
 * Phase 3: Advanced Memory Features
 */

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>
  getDimensions(): number
  getModelName(): string
}

export interface SemanticSearchOptions {
  threshold?: number
  limit?: number
  memoryTypes?: string[]
  agentId?: string
  includeArchived?: boolean
}

export interface SemanticSearchResult {
  memoryId: string
  similarity: number
  memory: any
  relevanceScore: number
}

/**
 * Mock Embedding Provider for development
 * In production, this would connect to OpenAI, Cohere, or local models
 */
class MockEmbeddingProvider implements EmbeddingProvider {
  private dimensions = 384 // Standard for sentence transformers
  
  async generateEmbedding(text: string): Promise<number[]> {
    // Generate deterministic mock embeddings based on text content
    const words = text.toLowerCase().split(/\s+/)
    const embedding = new Array(this.dimensions).fill(0)
    
    // Create a simple hash-based embedding
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const hash = this.simpleHash(word)
      
      for (let j = 0; j < this.dimensions; j++) {
        const index = (hash + j) % this.dimensions
        embedding[index] += Math.sin(hash * j * 0.1) * 0.1
      }
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
  }
  
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }
  
  getDimensions(): number {
    return this.dimensions
  }
  
  getModelName(): string {
    return 'mock-embedding-model-v1'
  }
}

/**
 * OpenAI Embedding Provider (for production use)
 */
class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string
  private model = 'text-embedding-3-small'
  private dimensions = 1536
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not provided')
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          encoding_format: 'float'
        })
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error('Error generating OpenAI embedding:', error)
      throw error
    }
  }
  
  getDimensions(): number {
    return this.dimensions
  }
  
  getModelName(): string {
    return this.model
  }
}

/**
 * Semantic Search Service
 */
export class SemanticSearchService {
  private embeddingProvider: EmbeddingProvider
  private embeddingCache = new Map<string, number[]>()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  
  constructor(provider?: EmbeddingProvider) {
    // Use OpenAI if API key is available, otherwise use mock provider
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
    
    if (provider) {
      this.embeddingProvider = provider
    } else if (openaiKey) {
      this.embeddingProvider = new OpenAIEmbeddingProvider(openaiKey)
    } else {
      console.warn('No OpenAI API key found, using mock embedding provider')
      this.embeddingProvider = new MockEmbeddingProvider()
    }
  }
  
  /**
   * Generate embedding for text with caching
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.getCacheKey(text)
    
    // Check cache first
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!
    }
    
    try {
      const embedding = await this.embeddingProvider.generateEmbedding(text)
      
      // Cache the result
      this.embeddingCache.set(cacheKey, embedding)
      
      // Clean cache if it gets too large
      if (this.embeddingCache.size > 1000) {
        this.cleanCache()
      }
      
      return embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    if (normA === 0 || normB === 0) {
      return 0
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
  
  /**
   * Search memories using semantic similarity
   */
  async searchMemories(
    query: string,
    memories: any[],
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResult[]> {
    const {
      threshold = 0.7,
      limit = 10,
      memoryTypes,
      includeArchived = false
    } = options
    
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query)
      
      // Filter memories based on options
      let filteredMemories = memories.filter(memory => {
        if (!includeArchived && memory.archivedAt) return false
        if (memoryTypes && !memoryTypes.includes(memory.memoryType)) return false
        return true
      })
      
      // Calculate similarities
      const results: SemanticSearchResult[] = []
      
      for (const memory of filteredMemories) {
        try {
          let memoryEmbedding: number[]
          
          // Try to get embedding from memory or generate new one
          if (memory.embedding && Array.isArray(memory.embedding)) {
            memoryEmbedding = memory.embedding
          } else if (typeof memory.embedding === 'string') {
            memoryEmbedding = JSON.parse(memory.embedding)
          } else {
            // Generate embedding for memory content
            memoryEmbedding = await this.generateEmbedding(memory.content)
          }
          
          const similarity = this.calculateCosineSimilarity(queryEmbedding, memoryEmbedding)
          
          if (similarity >= threshold) {
            // Calculate relevance score (similarity + importance + recency)
            const recencyScore = this.calculateRecencyScore(memory.createdAt)
            const importanceScore = memory.importanceScore || 0.5
            const relevanceScore = (similarity * 0.6) + (importanceScore * 0.3) + (recencyScore * 0.1)
            
            results.push({
              memoryId: memory.id,
              similarity,
              memory,
              relevanceScore
            })
          }
        } catch (error) {
          console.warn(`Error processing memory ${memory.id} for semantic search:`, error)
          continue
        }
      }
      
      // Sort by relevance score and limit results
      return results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)
        
    } catch (error) {
      console.error('Error in semantic search:', error)
      throw error
    }
  }
  
  /**
   * Find similar memories to a given memory
   */
  async findSimilarMemories(
    targetMemory: any,
    allMemories: any[],
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResult[]> {
    return this.searchMemories(targetMemory.content, allMemories, {
      ...options,
      threshold: options.threshold || 0.8 // Higher threshold for similarity
    })
  }
  
  /**
   * Cluster memories based on semantic similarity
   */
  async clusterMemories(
    memories: any[],
    clusterCount: number = 5,
    similarityThreshold: number = 0.75
  ): Promise<Array<{ centroid: number[], memories: any[], coherence: number }>> {
    try {
      if (memories.length === 0) return []
      
      // Generate embeddings for all memories
      const embeddings: { memory: any, embedding: number[] }[] = []
      
      for (const memory of memories) {
        try {
          let embedding: number[]
          
          if (memory.embedding && Array.isArray(memory.embedding)) {
            embedding = memory.embedding
          } else if (typeof memory.embedding === 'string') {
            embedding = JSON.parse(memory.embedding)
          } else {
            embedding = await this.generateEmbedding(memory.content)
          }
          
          embeddings.push({ memory, embedding })
        } catch (error) {
          console.warn(`Error processing memory ${memory.id} for clustering:`, error)
          continue
        }
      }
      
      if (embeddings.length === 0) return []
      
      // Simple k-means clustering
      const clusters = this.performKMeansClustering(embeddings, Math.min(clusterCount, embeddings.length))
      
      return clusters.map(cluster => ({
        centroid: cluster.centroid,
        memories: cluster.memories,
        coherence: this.calculateClusterCoherence(cluster)
      }))
      
    } catch (error) {
      console.error('Error clustering memories:', error)
      throw error
    }
  }
  
  /**
   * Get embedding provider information
   */
  getProviderInfo() {
    return {
      modelName: this.embeddingProvider.getModelName(),
      dimensions: this.embeddingProvider.getDimensions(),
      cacheSize: this.embeddingCache.size
    }
  }
  
  // Private helper methods
  
  private getCacheKey(text: string): string {
    // Simple hash for cache key
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return `${this.embeddingProvider.getModelName()}_${Math.abs(hash)}`
  }
  
  private cleanCache(): void {
    // Remove oldest entries when cache is full
    const entries = Array.from(this.embeddingCache.entries())
    const toRemove = entries.slice(0, Math.floor(entries.length * 0.2))
    toRemove.forEach(([key]) => this.embeddingCache.delete(key))
  }
  
  private calculateRecencyScore(createdAt: string | Date): number {
    const now = new Date()
    const created = new Date(createdAt)
    const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    
    // Exponential decay: newer memories get higher scores
    return Math.exp(-daysDiff / 30) // 30-day half-life
  }
  
  private performKMeansClustering(
    embeddings: { memory: any, embedding: number[] }[],
    k: number
  ): Array<{ centroid: number[], memories: any[] }> {
    const dimensions = embeddings[0].embedding.length
    
    // Initialize centroids randomly
    const centroids: number[][] = []
    for (let i = 0; i < k; i++) {
      const centroid = new Array(dimensions).fill(0).map(() => Math.random() - 0.5)
      centroids.push(centroid)
    }
    
    let iterations = 0
    const maxIterations = 50
    let converged = false
    
    while (!converged && iterations < maxIterations) {
      // Assign points to clusters
      const clusters: Array<{ centroid: number[], memories: any[] }> = centroids.map(centroid => ({
        centroid: [...centroid],
        memories: []
      }))
      
      for (const { memory, embedding } of embeddings) {
        let bestCluster = 0
        let bestSimilarity = -1
        
        for (let i = 0; i < centroids.length; i++) {
          const similarity = this.calculateCosineSimilarity(embedding, centroids[i])
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestCluster = i
          }
        }
        
        clusters[bestCluster].memories.push(memory)
      }
      
      // Update centroids
      converged = true
      for (let i = 0; i < k; i++) {
        if (clusters[i].memories.length === 0) continue
        
        const newCentroid = new Array(dimensions).fill(0)
        const clusterEmbeddings = clusters[i].memories.map(memory => {
          const embedding = embeddings.find(e => e.memory.id === memory.id)
          return embedding ? embedding.embedding : new Array(dimensions).fill(0)
        })
        
        // Calculate mean
        for (let j = 0; j < dimensions; j++) {
          newCentroid[j] = clusterEmbeddings.reduce((sum, emb) => sum + emb[j], 0) / clusterEmbeddings.length
        }
        
        // Check for convergence
        const similarity = this.calculateCosineSimilarity(centroids[i], newCentroid)
        if (similarity < 0.99) converged = false
        
        centroids[i] = newCentroid
        clusters[i].centroid = newCentroid
      }
      
      iterations++
    }
    
    return centroids.map((centroid, i) => ({
      centroid,
      memories: embeddings
        .filter(({ memory, embedding }) => {
          let bestCluster = 0
          let bestSimilarity = -1
          
          for (let j = 0; j < centroids.length; j++) {
            const similarity = this.calculateCosineSimilarity(embedding, centroids[j])
            if (similarity > bestSimilarity) {
              bestSimilarity = similarity
              bestCluster = j
            }
          }
          
          return bestCluster === i
        })
        .map(({ memory }) => memory)
    }))
  }
  
  private calculateClusterCoherence(cluster: { centroid: number[], memories: any[] }): number {
    if (cluster.memories.length <= 1) return 1.0
    
    // Calculate average intra-cluster similarity
    let totalSimilarity = 0
    let comparisons = 0
    
    for (let i = 0; i < cluster.memories.length; i++) {
      for (let j = i + 1; j < cluster.memories.length; j++) {
        // This would need the embeddings, simplified for now
        totalSimilarity += 0.8 // Mock similarity
        comparisons++
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 1.0
  }
}

// Singleton instance
let semanticSearchService: SemanticSearchService | null = null

export function getSemanticSearchService(): SemanticSearchService {
  if (!semanticSearchService) {
    semanticSearchService = new SemanticSearchService()
  }
  return semanticSearchService
}