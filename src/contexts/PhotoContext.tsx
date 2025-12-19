import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Photo, Comment, UploadPhotoData } from '@/types';
import { mockPhotos } from '@/services/mockData';
import { photoService } from '@/services/azureApi';
import { isAzureConfigured } from '@/config/azureConfig';
import { useAuth } from './AuthContext';

interface PhotoContextType {
  photos: Photo[];
  isLoading: boolean;
  error: string | null;
  refreshPhotos: () => Promise<void>;
  uploadPhoto: (data: UploadPhotoData) => Promise<Photo>;
  deletePhoto: (photoId: string) => Promise<void>;
  likePhoto: (photoId: string) => void;
  unlikePhoto: (photoId: string) => void;
  addComment: (photoId: string, content: string) => void;
  getPhotoById: (photoId: string) => Photo | undefined;
  getPhotosByCreator: (creatorId: string) => Photo[];
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>(mockPhotos);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, getAccessToken } = useAuth();

  // Fetch photos from API
  const refreshPhotos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = await getAccessToken();
      const fetchedPhotos = await photoService.getPhotos(token || undefined);
      setPhotos(fetchedPhotos);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      setError('Failed to load photos');
      // Fall back to mock data
      if (!isAzureConfigured()) {
        setPhotos(mockPhotos);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  // Load photos on mount
  useEffect(() => {
    refreshPhotos();
  }, []);

  const uploadPhoto = useCallback(async (data: UploadPhotoData): Promise<Photo> => {
    if (!user || user.role !== 'creator') {
      throw new Error('Only creators can upload photos');
    }

    setIsLoading(true);
    
    try {
      const token = await getAccessToken();
      const newPhoto = await photoService.uploadPhoto(data, user.id, token || undefined);
      
      // Add creator info to the photo
      const photoWithCreator: Photo = {
        ...newPhoto,
        creatorName: user.name,
        creatorAvatar: user.avatar,
      };

      setPhotos(prev => [photoWithCreator, ...prev]);
      return photoWithCreator;
    } finally {
      setIsLoading(false);
    }
  }, [user, getAccessToken]);

  const deletePhoto = useCallback(async (photoId: string): Promise<void> => {
    if (!user || user.role !== 'creator') {
      throw new Error('Only creators can delete photos');
    }

    setIsLoading(true);
    
    try {
      const token = await getAccessToken();
      await photoService.deletePhoto(photoId, token || undefined);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } finally {
      setIsLoading(false);
    }
  }, [user, getAccessToken]);

  const likePhoto = useCallback(async (photoId: string) => {
    if (!user) return;
    
    // Optimistic update
    setPhotos(prev => prev.map(photo => {
      if (photo.id === photoId && !photo.likedBy.includes(user.id)) {
        return {
          ...photo,
          likes: photo.likes + 1,
          likedBy: [...photo.likedBy, user.id],
        };
      }
      return photo;
    }));

    // Sync with API
    try {
      const token = await getAccessToken();
      await photoService.likePhoto(photoId, user.id, token || undefined);
    } catch (err) {
      console.error('Failed to like photo:', err);
      // Revert on error
      setPhotos(prev => prev.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            likes: photo.likes - 1,
            likedBy: photo.likedBy.filter(id => id !== user.id),
          };
        }
        return photo;
      }));
    }
  }, [user, getAccessToken]);

  const unlikePhoto = useCallback(async (photoId: string) => {
    if (!user) return;
    
    // Optimistic update
    setPhotos(prev => prev.map(photo => {
      if (photo.id === photoId && photo.likedBy.includes(user.id)) {
        return {
          ...photo,
          likes: photo.likes - 1,
          likedBy: photo.likedBy.filter(id => id !== user.id),
        };
      }
      return photo;
    }));

    // Sync with API
    try {
      const token = await getAccessToken();
      await photoService.unlikePhoto(photoId, user.id, token || undefined);
    } catch (err) {
      console.error('Failed to unlike photo:', err);
      // Revert on error
      setPhotos(prev => prev.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            likes: photo.likes + 1,
            likedBy: [...photo.likedBy, user.id],
          };
        }
        return photo;
      }));
    }
  }, [user, getAccessToken]);

  const addComment = useCallback(async (photoId: string, content: string) => {
    if (!user) return;
    
    const optimisticComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content,
      createdAt: new Date(),
    };

    // Optimistic update
    setPhotos(prev => prev.map(photo => {
      if (photo.id === photoId) {
        return {
          ...photo,
          comments: [...photo.comments, optimisticComment],
        };
      }
      return photo;
    }));

    // Sync with API
    try {
      const token = await getAccessToken();
      const savedComment = await photoService.addComment(photoId, user.id, content, token || undefined);
      
      // Update with server response
      setPhotos(prev => prev.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            comments: photo.comments.map(c => 
              c.id === optimisticComment.id ? { ...savedComment, userName: user.name, userAvatar: user.avatar } : c
            ),
          };
        }
        return photo;
      }));
    } catch (err) {
      console.error('Failed to add comment:', err);
      // Revert on error
      setPhotos(prev => prev.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            comments: photo.comments.filter(c => c.id !== optimisticComment.id),
          };
        }
        return photo;
      }));
    }
  }, [user, getAccessToken]);

  const getPhotoById = useCallback((photoId: string) => {
    return photos.find(p => p.id === photoId);
  }, [photos]);

  const getPhotosByCreator = useCallback((creatorId: string) => {
    return photos.filter(p => p.creatorId === creatorId);
  }, [photos]);

  return (
    <PhotoContext.Provider value={{
      photos,
      isLoading,
      error,
      refreshPhotos,
      uploadPhoto,
      deletePhoto,
      likePhoto,
      unlikePhoto,
      addComment,
      getPhotoById,
      getPhotosByCreator,
    }}>
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhotos() {
  const context = useContext(PhotoContext);
  if (context === undefined) {
    throw new Error('usePhotos must be used within a PhotoProvider');
  }
  return context;
}
