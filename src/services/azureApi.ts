import { azureConfig, isAzureConfigured } from '@/config/azureConfig';
import { Photo, Comment, UploadPhotoData } from '@/types';
import { mockPhotos } from './mockData';
import { get } from 'http';
import { API_BASE_URL } from '@/config/azureConfig';




const getAccessToken = () => {  
  return localStorage.getItem("token");
}

const getUserName = () => {
  return localStorage.getItem("userName");
}

const getUserRole = () => {
  return localStorage.getItem("userRole");
}

const getUserId = () => {
  return localStorage.getItem("userId");
}

// Helper to make authenticated API calls




// Photo API Service
export const photoService = {
  // Get all photos
  async getPhotos(): Promise<Photo[]> {
    if (!isAzureConfigured()) {
      // Return mock data if Azure is not configured
      return mockPhotos;
    }

     const response = await fetch(`${API_BASE_URL}/get-photos`, { 
      method: 'GET',
    });

    return response.json();
  },

  // Get single photo by ID
  async getPhotoById(id: string, accessToken?: string): Promise<Photo | null> {
    if (!isAzureConfigured()) {
      return mockPhotos.find(p => p.id === id) || null;
    }
    const response = await fetch(`${API_BASE_URL}/get-photo`, { 
      method: 'GET',
    });

    return response.json();
  },


  // Upload a new photo
  async uploadPhoto(data: UploadPhotoData, accessToken?: string): Promise<Photo> {

    // First, upload the image to Azure Blob Storage
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('caption', data.caption);
    if (data.location) formData.append('location', data.location);
    if (data.people) formData.append('people', JSON.stringify(data.people));

    const response = await fetch(`${API_BASE_URL}/create-photo`, { 
      method: 'POST',
      headers: {
      'x-user-id': getUserId(),
      'x-user-name': getUserName(),
      'x-user-role': getUserRole(),
      Authorization: `Bearer ${accessToken}`, // optional if you use auth
    },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    return response.json();
  },

  // Delete a photo
  async deletePhoto(photoId: string): Promise<void> {
    if (!isAzureConfigured()) {
      return; // Mock delete
    }

    const response = await fetch(`${API_BASE_URL}/delete-photos`, { 
      method: 'DELETE',
      body: JSON.stringify({ photoId }),
    });
  },

  // Like a photo
  async likePhoto(photoId: string, userId: string): Promise<void> {
    if (!isAzureConfigured()) {
      return; // Mock like
    }
    const response = await fetch(`${API_BASE_URL}/like-photo`, { 
      method: 'POST',
      body: JSON.stringify({ photoId, userId }),
    });
  },

  // Unlike a photo
  async unlikePhoto(photoId: string, userId: string): Promise<void> {
    if (!isAzureConfigured()) {
      return; // Mock unlike
    }

    const response = await fetch(`${API_BASE_URL}/unlike-photo`, { 
      method: 'POST',
      body: JSON.stringify({ photoId, userId }),
    });
  },

};

// User API Service
export const userService = {

  // Get user role
  async getUserRole(): Promise<string> {
    return getUserRole();
  },
};