// API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://interview-etl-backend-289778453333.us-central1.run.app'
  : 'http://localhost:8000';

// Enterprise-grade API configuration
const API_CONFIG = {
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  circuitBreakerThreshold: 5, // failures before opening circuit
  circuitBreakerTimeout: 30000, // 30 seconds before trying again
  requestDeduplication: true,
  performanceMonitoring: true
};

// Circuit breaker implementation
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  canExecute(): boolean {
    if (this.state === 'CLOSED') return true;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > API_CONFIG.circuitBreakerTimeout) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    
    return this.state === 'HALF_OPEN';
  }

  onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= API_CONFIG.circuitBreakerThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Request deduplication cache
const requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Performance monitoring
const performanceMetrics = {
  requests: 0,
  failures: 0,
  totalTime: 0,
  averageTime: 0
};

// Circuit breaker instances per endpoint
const circuitBreakers = new Map<string, CircuitBreaker>();

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Utility function to create timeout promise
const createTimeoutPromise = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
  });
};

// Utility function to delay execution
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate cache key for request deduplication
const generateCacheKey = (endpoint: string, options: RequestInit): string => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${endpoint}:${body}`;
};

// Check if request is cacheable
const isCacheable = (method: string, status: number): boolean => {
  return method === 'GET' && status === 200;
};

// Enhanced fetch with enterprise features
async function fetchWithEnterpriseFeatures(
  url: string, 
  options: RequestInit, 
  endpoint: string,
  retries: number = API_CONFIG.maxRetries
): Promise<Response> {
  const startTime = Date.now();
  const method = options.method || 'GET';
  
  // Check circuit breaker
  const circuitBreaker = circuitBreakers.get(endpoint) || new CircuitBreaker();
  circuitBreakers.set(endpoint, circuitBreaker);
  
  if (!circuitBreaker.canExecute()) {
    throw new APIError(
      'Service temporarily unavailable (circuit breaker open)',
      503,
      'CIRCUIT_BREAKER_OPEN',
      { endpoint, retryAfter: API_CONFIG.circuitBreakerTimeout },
      true
    );
  }

  try {
    // Create a race between fetch and timeout
    const response = await Promise.race([
      fetch(url, options),
      createTimeoutPromise(API_CONFIG.timeout)
    ]);

    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new APIError(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText,
        errorData,
        response.status >= 500 // Retryable for server errors
      );
      
      circuitBreaker.onFailure();
      throw error;
    }

    // Record success
    circuitBreaker.onSuccess();
    performanceMetrics.requests++;
    performanceMetrics.totalTime += Date.now() - startTime;
    performanceMetrics.averageTime = performanceMetrics.totalTime / performanceMetrics.requests;
    
    return response;

  } catch (error) {
    // Record failure
    circuitBreaker.onFailure();
    performanceMetrics.failures++;
    
    // If we have retries left and it's a retryable error, retry
    if (retries > 0 && (
      error instanceof TypeError || 
      error.message.includes('timeout') ||
      (error instanceof APIError && error.retryable)
    )) {
      console.warn(`API request failed, retrying... (${retries} retries left)`);
      await delay(API_CONFIG.retryDelay);
      return fetchWithEnterpriseFeatures(url, options, endpoint, retries - 1);
    }

    // If it's our custom API error, re-throw it
    if (error instanceof APIError) {
      throw error;
    }

    // Otherwise, wrap it in our API error format
    throw new APIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0,
      'NETWORK_ERROR',
      error,
      false
    );
  }
}

// Generic API request function with enterprise features
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  
  // Request deduplication for GET requests
  if (API_CONFIG.requestDeduplication && method === 'GET') {
    const cacheKey = generateCacheKey(endpoint, options);
    const cached = requestCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
  }
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetchWithEnterpriseFeatures(url, defaultOptions, endpoint);
    const data = await response.json();
    
    // Check if the response contains an error
    if (data.error) {
      throw new APIError(
        data.error,
        response.status,
        data.code || 'API_ERROR',
        data.details,
        response.status >= 500
      );
    }

    // Cache successful GET responses
    if (API_CONFIG.requestDeduplication && isCacheable(method, response.status)) {
      const cacheKey = generateCacheKey(endpoint, options);
      requestCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000 // 5 minutes
      });
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Wrap unknown errors
    throw new APIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0,
      'UNKNOWN_ERROR',
      error,
      false
    );
  }
}

// Health check with enhanced error handling
export async function checkHealth(): Promise<any> {
  try {
    return await apiRequest('/health');
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// Create construct with validation
export async function createConstruct(construct: any): Promise<any> {
  // Validate construct data
  if (!construct || typeof construct !== 'object') {
    throw new APIError('Invalid construct data', 400, 'VALIDATION_ERROR');
  }

  if (!construct.name || typeof construct.name !== 'string' || !construct.name.trim()) {
    throw new APIError('Construct name is required', 400, 'VALIDATION_ERROR');
  }

  if (!construct.output_schema || !Array.isArray(construct.output_schema) || construct.output_schema.length === 0) {
    throw new APIError('Construct output schema is required and must be a non-empty array', 400, 'VALIDATION_ERROR');
  }

  try {
    return await apiRequest('/constructs', {
      method: 'POST',
      body: JSON.stringify(construct),
    });
  } catch (error) {
    console.error('Failed to create construct:', error);
    throw error;
  }
}

// Create job with validation
export async function createJob(construct: any, transcripts: any[]): Promise<any> {
  // Validate job data
  if (!construct || typeof construct !== 'object') {
    throw new APIError('Invalid construct data', 400, 'VALIDATION_ERROR');
  }

  if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
    throw new APIError('At least one transcript is required', 400, 'VALIDATION_ERROR');
  }

  // Validate each transcript
  for (let i = 0; i < transcripts.length; i++) {
    const transcript = transcripts[i];
    if (!transcript || typeof transcript !== 'object') {
      throw new APIError(`Invalid transcript at index ${i}`, 400, 'VALIDATION_ERROR');
    }
    
    if (!transcript.name || !transcript.source) {
      throw new APIError(`Transcript at index ${i} missing required fields (name, source)`, 400, 'VALIDATION_ERROR');
    }
  }

  try {
    return await apiRequest('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        construct,
        transcripts,
      }),
    });
  } catch (error) {
    console.error('Failed to create job:', error);
    throw error;
  }
}

// Get job status with validation
export async function getJobStatus(jobId: string): Promise<any> {
  if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
    throw new APIError('Valid job ID is required', 400, 'VALIDATION_ERROR');
  }

  try {
    return await apiRequest(`/jobs/${jobId}/status`);
  } catch (error) {
    console.error('Failed to get job status:', error);
    throw error;
  }
}

// Download results with validation
export async function downloadResults(jobId: string, type: 'stories' | 'requirements'): Promise<any> {
  if (!jobId || typeof jobId !== 'string' || !jobId.trim()) {
    throw new APIError('Valid job ID is required', 400, 'VALIDATION_ERROR');
  }

  if (!['stories', 'requirements'].includes(type)) {
    throw new APIError('Type must be either "stories" or "requirements"', 400, 'VALIDATION_ERROR');
  }

  try {
    return await apiRequest(`/jobs/${jobId}/download/${type}`);
  } catch (error) {
    console.error('Failed to download results:', error);
    throw error;
  }
}

// Performance monitoring and metrics
export function getPerformanceMetrics() {
  return {
    ...performanceMetrics,
    successRate: performanceMetrics.requests > 0 
      ? ((performanceMetrics.requests - performanceMetrics.failures) / performanceMetrics.requests * 100).toFixed(2)
      : 0,
    circuitBreakers: Object.fromEntries(
      Array.from(circuitBreakers.entries()).map(([endpoint, cb]) => [
        endpoint,
        {
          state: cb['state'],
          failures: cb['failures']
        }
      ])
    )
  };
}

// Clear cache (useful for testing or memory management)
export function clearCache(): void {
  requestCache.clear();
}

// Reset circuit breakers (useful for testing)
export function resetCircuitBreakers(): void {
  circuitBreakers.clear();
}
