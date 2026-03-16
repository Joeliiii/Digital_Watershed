import { API_URL } from './constants';

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
    bulkCreateItems: async (data: FormData) => {
        const response = await fetch(`${API_URL}/items/bulk`, {
            method: 'POST',
            body: data,
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
    generateShareLink: async (projectId: string) => {
        const response = await fetch(`${API_URL}/projects/${projectId}/share`, {
            method: 'POST',
        });
        return handleResponse(response);
    },
    revokeShareLink: async (projectId: string) => {
        const response = await fetch(`${API_URL}/projects/${projectId}/share`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },
    getSharedProject: async (token: string) => {
        const response = await fetch(`${API_URL}/projects/shared/${token}`);
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
    },

    // Tag Relationships
    getTagRelationships: async () => {
        const response = await fetch(`${API_URL}/tag-relationships`);
        return handleResponse(response);
    },
    getRelationshipsByTag: async (tagId: string) => {
        const response = await fetch(`${API_URL}/tag-relationships/by-tag/${tagId}`);
        return handleResponse(response);
    },
    createTagRelationship: async (data: { fromTagId: string; toTagId: string; relationshipType: string }) => {
        const response = await fetch(`${API_URL}/tag-relationships`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    updateTagRelationship: async (id: string, data: { relationshipType: string }) => {
        const response = await fetch(`${API_URL}/tag-relationships/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    deleteTagRelationship: async (id: string) => {
        const response = await fetch(`${API_URL}/tag-relationships/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    },
    getTagRelationshipSuggestions: async () => {
        const response = await fetch(`${API_URL}/tag-relationships/suggestions`);
        return handleResponse(response);
    }
};
