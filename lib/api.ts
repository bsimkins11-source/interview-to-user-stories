// API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://interview-etl-backend-289778453333.us-central1.run.app'
  : 'http://localhost:8000';

// API timeout configuration
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
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

// Enhanced fetch with timeout and retry logic
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries: number = MAX_RETRIES
): Promise<Response> {
  try {
    // Create a race between fetch and timeout
    const response = await Promise.race([
      fetch(url, options),
      createTimeoutPromise(API_TIMEOUT)
    ]);

    // Check if response is ok
    if (!response.ok) {
      throw new APIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    return response;

  } catch (error) {
    // If we have retries left and it's a retryable error, retry
    if (retries > 0 && (error instanceof TypeError || error.message.includes('timeout'))) {
      console.warn(`API request failed, retrying... (${retries} retries left)`);
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
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
      error
    );
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetchWithRetry(url, defaultOptions);
    const data = await response.json();
    
    // Check if the response contains an error
    if (data.error) {
      throw new APIError(
        data.error,
        response.status,
        data.code || 'API_ERROR',
        data.details
      );
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
      error
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
