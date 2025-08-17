// API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://interview-etl-backend-289778453333.us-central1.run.app';

// API fetch wrapper with error handling
export const api = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Upload ZIP file to backend
export const uploadZip = async (file: File, construct: any) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('construct', JSON.stringify(construct));

  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// API endpoints
export const apiEndpoints = {
  jobs: {
    create: '/jobs',
    get: (id: string) => `/jobs/${id}`,
    uploadComplete: (id: string) => `/jobs/${id}/uploadComplete`,
    list: '/jobs',
  },
  constructs: {
    create: '/constructs',
    get: (id: string) => `/constructs/${id}`,
    list: '/constructs',
    default: '/constructs/default',
  },
  externalImports: {
    folder: '/external-imports/folder',
    document: '/external-imports/document',
    link: '/external-imports/link',
    history: '/external-imports',
    stories: (importId: string) => `/external-imports/${importId}/stories`,
    delete: (importId: string) => `/external-imports/${importId}`,
    compare: (importId: string, jobId: string) => `/external-imports/${importId}/compare?job_id=${jobId}`,
  },
  health: '/health',
};
