const API_URL = 'http://localhost:5000/api';

// Helper to handle responses
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API Error');
    }
    return response.json();
};

export const api = {
    // Items
    getItems: async () => {
        const response = await fetch(`${API_URL}/items`);
        return handleResponse(response);
    },
    getItem: async (id: string) => {
        const response = await fetch(`${API_URL}/items/${id}`);
        return handleResponse(response);
    },
    createItem: async (data: any) => {
        const isFormData = data instanceof FormData;
        const headers: HeadersInit = isFormData ? {} : { 'Content-Type': 'application/json' };
        const body = isFormData ? data : JSON.stringify(data);

        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers,
            body,
        });
        return handleResponse(response);
    },
    updateItem: async (id: string, data: any) => {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    deleteItem: async (id: string) => {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },

    // Projects
    getProjects: async () => {
        const response = await fetch(`${API_URL}/projects`);
        return handleResponse(response);
    },
    createProject: async (data: any) => {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    updateProject: async (id: string, data: any) => {
        const response = await fetch(`${API_URL}/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    deleteProject: async (id: string) => {
        const response = await fetch(`${API_URL}/projects/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },

    // Tags
    getTags: async () => {
        const response = await fetch(`${API_URL}/tags`);
        return handleResponse(response);
    },
    createTag: async (data: any) => {
        const response = await fetch(`${API_URL}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    updateTag: async (id: string, data: any) => {
        const response = await fetch(`${API_URL}/tags/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    deleteTag: async (id: string) => {
        const response = await fetch(`${API_URL}/tags/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    }
};
