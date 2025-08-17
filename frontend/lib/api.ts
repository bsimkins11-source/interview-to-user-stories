export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 
      "Content-Type": "application/json", 
      ...(init?.headers || {}) 
    },
    cache: "no-store",
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
}

export async function uploadZip(jobId: string, uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/zip" },
    body: file,
  });
  
  if (!res.ok) {
    throw new Error("Upload failed");
  }
  
  await api(`/jobs/${jobId}/uploadComplete`, { method: "PUT" });
}

// API endpoints
export const apiEndpoints = {
  jobs: {
    create: (data: any) => api('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => api(`/jobs/${id}`),
    uploadComplete: (id: string) => api(`/jobs/${id}/uploadComplete`, { method: 'PUT' }),
  },
  constructs: {
    create: (data: any) => api('/constructs', { method: 'POST', body: JSON.stringify(data) }),
    list: () => api('/constructs'),
    get: (id: string) => api(`/constructs/${id}`),
  },
};
