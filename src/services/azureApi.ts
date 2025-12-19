import { azureConfig, isAzureConfigured } from '@/config/azureConfig';
import { Photo, Comment, UploadPhotoData } from '@/types';
import { mockPhotos } from './mockData';

// Helper to make authenticated API calls
async function fetchWithAuth(url: string, options: RequestInit = {}, accessToken?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Photo API Service
export const photoService = {
  // Get all photos
  async getPhotos(accessToken?: string): Promise<Photo[]> {
    if (!isAzureConfigured()) {
      // Return mock data if Azure is not configured
      return mockPhotos;
    }

    return fetchWithAuth(azureConfig.api.endpoints.photos, {}, accessToken);
  },

  // Get single photo by ID
  async getPhotoById(id: string, accessToken?: string): Promise<Photo | null> {
    if (!isAzureConfigured()) {
      return mockPhotos.find(p => p.id === id) || null;
    }

    return fetchWithAuth(`${azureConfig.api.endpoints.photos}/${id}`, {}, accessToken);
  },

  // Get photos by creator
  async getPhotosByCreator(creatorId: string, accessToken?: string): Promise<Photo[]> {
    if (!isAzureConfigured()) {
      return mockPhotos.filter(p => p.creatorId === creatorId);
    }

    return fetchWithAuth(
      `${azureConfig.api.endpoints.photos}?creatorId=${creatorId}`,
      {},
      accessToken
    );
  },

  // Upload a new photo
  async uploadPhoto(data: UploadPhotoData, creatorId: string, accessToken?: string): Promise<Photo> {
    if (!isAzureConfigured()) {
      // Mock upload - create a local blob URL
      const newPhoto: Photo = {
        id: `photo-${Date.now()}`,
        url: URL.createObjectURL(data.file),
        thumbnailUrl: URL.createObjectURL(data.file),
        title: data.title,
        caption: data.caption,
        location: data.location,
        people: data.people,
        creatorId,
        creatorName: 'Mock Creator',
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: new Date(),
        tags: [],
      };
      return newPhoto;
    }

    // First, upload the image to Azure Blob Storage
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('caption', data.caption);
    if (data.location) formData.append('location', data.location);
    if (data.people) formData.append('people', JSON.stringify(data.people));

    const response = await fetch(azureConfig.api.endpoints.photos, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    return response.json();
  },

  // Delete a photo
  async deletePhoto(photoId: string, accessToken?: string): Promise<void> {
    if (!isAzureConfigured()) {
      return; // Mock delete
    }

    await fetchWithAuth(
      `${azureConfig.api.endpoints.photos}/${photoId}`,
      { method: 'DELETE' },
      accessToken
    );
  },

  // Like a photo
  async likePhoto(photoId: string, userId: string, accessToken?: string): Promise<void> {
    if (!isAzureConfigured()) {
      return; // Mock like
    }

    await fetchWithAuth(
      azureConfig.api.endpoints.likes,
      {
        method: 'POST',
        body: JSON.stringify({ photoId, userId }),
      },
      accessToken
    );
  },

  // Unlike a photo
  async unlikePhoto(photoId: string, userId: string, accessToken?: string): Promise<void> {
    if (!isAzureConfigured()) {
      return; // Mock unlike
    }

    await fetchWithAuth(
      `${azureConfig.api.endpoints.likes}/${photoId}/${userId}`,
      { method: 'DELETE' },
      accessToken
    );
  },

  // Add a comment
  async addComment(
    photoId: string,
    userId: string,
    content: string,
    accessToken?: string
  ): Promise<Comment> {
    if (!isAzureConfigured()) {
      // Mock comment
      return {
        id: `comment-${Date.now()}`,
        userId,
        userName: 'Mock User',
        content,
        createdAt: new Date(),
      };
    }

    return fetchWithAuth(
      azureConfig.api.endpoints.comments,
      {
        method: 'POST',
        body: JSON.stringify({ photoId, userId, content }),
      },
      accessToken
    );
  },
};

// User API Service
export const userService = {
  // Get user profile
  async getProfile(userId: string, accessToken?: string) {
    if (!isAzureConfigured()) {
      return null;
    }

    return fetchWithAuth(`${azureConfig.api.endpoints.users}/${userId}`, {}, accessToken);
  },

  // Update user profile
  async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string },
    accessToken?: string
  ) {
    if (!isAzureConfigured()) {
      return null;
    }

    return fetchWithAuth(
      `${azureConfig.api.endpoints.users}/${userId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      accessToken
    );
  },

  // Get user role
  async getUserRole(userId: string, accessToken?: string): Promise<'creator' | 'consumer'> {
    if (!isAzureConfigured()) {
      return 'consumer'; // Default role
    }

    const response = await fetchWithAuth(
      `${azureConfig.api.endpoints.users}/${userId}/role`,
      {},
      accessToken
    );
    return response.role;
  },
};
