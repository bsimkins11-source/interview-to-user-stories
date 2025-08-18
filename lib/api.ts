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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Create a new job and get upload URL
export const createJob = async (construct: any, transcripts: any[]) => {
  try {
    const response = await api('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        construct: construct,
        transcripts: transcripts,
        status: 'CREATED'
      })
    });
    return response;
  } catch (error) {
    console.error('Job creation failed:', error);
    throw error;
  }
};

// Upload files to the job
export const uploadFilesToJob = async (jobId: string, files: File[]) => {
  try {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file); // Use 'files' as the key for multiple files
    });

    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

// Mark upload as complete and start processing
export const startProcessing = async (jobId: string) => {
  try {
    const response = await api(`/jobs/${jobId}/uploadComplete`, {
      method: 'PUT'
    });
    return response;
  } catch (error) {
    console.error('Processing start failed:', error);
    throw error;
  }
};

// Get job status
export const getJobStatus = async (jobId: string) => {
  try {
    const response = await api(`/jobs/${jobId}`);
    return response;
  } catch (error) {
    console.error('Job status fetch failed:', error);
    throw error;
  }
};

// Create construct template
export const createConstruct = async (construct: any) => {
  try {
    const response = await api('/constructs', {
      method: 'POST',
      body: JSON.stringify(construct)
    });
    return response;
  } catch (error) {
    console.error('Construct creation failed:', error);
    throw error;
  }
};

// Get default construct
export const getDefaultConstruct = async () => {
  try {
    const response = await api('/constructs/default');
    return response;
  } catch (error) {
    console.error('Default construct fetch failed:', error);
    throw error;
  }
};

// Upload ZIP file to backend (legacy function - keeping for compatibility)
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
