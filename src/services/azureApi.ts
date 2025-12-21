import { azureConfig, isAzureConfigured } from '@/config/azureConfig';
import { Photo, Comment, UploadPhotoData } from '@/types';
import { mockPhotos } from './mockData';
import { get } from 'http';




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

     const response = await fetch("http://localhost:7071/api/get-photos", { 
      method: 'GET',
    });

    return response.json();
  },

  // Get single photo by ID
  async getPhotoById(id: string, accessToken?: string): Promise<Photo | null> {
    if (!isAzureConfigured()) {
      return mockPhotos.find(p => p.id === id) || null;
    }
    const response = await fetch("http://localhost:7071/api/get-photo", { 
      method: 'GET',
    });

    return response.json();
  },

  // Get photos by creator
  // async getPhotosByCreator(creatorId: string, accessToken?: string): Promise<Photo[]> {
  //   if (!isAzureConfigured()) {
  //     return mockPhotos.filter(p => p.creatorId === creatorId);
  //   }
  //   const response = await fetch("http://localhost:7071/api/get-photos", { 
  //     method: 'GET',
  //   });

  //   return fetchWithAuth(
  //     `${azureConfig.api.endpoints.getPhotos}?creatorId=${creatorId}`,
  //     {},
  //     accessToken
  //   );
  // },

  // Upload a new photo
  async uploadPhoto(data: UploadPhotoData, accessToken?: string): Promise<Photo> {

    // First, upload the image to Azure Blob Storage
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    formData.append('caption', data.caption);
    if (data.location) formData.append('location', data.location);
    if (data.people) formData.append('people', JSON.stringify(data.people));

    const response = await fetch("http://localhost:7071/api/create-photo", { 
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

    const response = await fetch("http://localhost:7071/api/delete-photos", { 
      method: 'DELETE',
      body: JSON.stringify({ photoId }),
    });
  },

  // Like a photo
  async likePhoto(photoId: string, userId: string): Promise<void> {
    if (!isAzureConfigured()) {
      return; // Mock like
    }
    const response = await fetch("http://localhost:7071/api/like-photo", { 
      method: 'POST',
      body: JSON.stringify({ photoId, userId }),
    });
  },

  // Unlike a photo
  async unlikePhoto(photoId: string, userId: string): Promise<void> {
    if (!isAzureConfigured()) {
      return; // Mock unlike
    }

    const response = await fetch("http://localhost:7071/api/unlike-photo", { 
      method: 'POST',
      body: JSON.stringify({ photoId, userId }),
    });
  },

  // Add a comment
  // async addComment(
  //   photoId: string,
  //   userId: string,
  //   content: string,
  // ): Promise<Comment> {
  //   if (!isAzureConfigured()) {
  //     // Mock comment
  //     return {
  //       id: `comment-${Date.now()}`,
  //       userId,
  //       userName: 'Mock User',
  //       content,
  //       createdAt: new Date(),
  //     };
  //   }

   
  //   const response = await fetch("http://localhost:7071/api/create-comment", { 
  //     method: 'POST',
  //      body: JSON.stringify({ photoId, userId, content }),
  //   });
  //   return response.json();
  // },
};

// User API Service
export const userService = {
  // Get user profile
  // async getProfile(userId: string, accessToken?: string) {
  //   if (!isAzureConfigured()) {
  //     return null;
  //   }

  //   return fetchWithAuth(`${azureConfig.api.endpoints.users}/${userId}`, {}, accessToken);
  // },

  // Update user profile
  // async updateProfile(
  //   userId: string,
  //   data: { name?: string; avatar?: string },
  //   accessToken?: string
  // ) {
  //   if (!isAzureConfigured()) {
  //     return null;
  //   }

  //   return fetchWithAuth(
  //     `${azureConfig.api.endpoints.users}/${userId}`,
  //     {
  //       method: 'PATCH',
  //       body: JSON.stringify(data),
  //     },
  //     accessToken
  //   );
  // },

  // Get user role
  async getUserRole(): Promise<string> {
    return getUserRole();
  },
};