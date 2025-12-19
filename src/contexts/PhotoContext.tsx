import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Photo, Comment, UploadPhotoData } from '@/types';
import { mockPhotos } from '@/services/mockData';
import { useAuth } from './AuthContext';

interface PhotoContextType {
  photos: Photo[];
  isLoading: boolean;
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
  const { user } = useAuth();

  const uploadPhoto = useCallback(async (data: UploadPhotoData): Promise<Photo> => {
    if (!user || user.role !== 'creator') {
      throw new Error('Only creators can upload photos');
    }

    setIsLoading(true);
    
    // Simulate upload delay - In production, this would upload to Azure Blob Storage
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newPhoto: Photo = {
      id: `photo-${Date.now()}`,
      url: URL.createObjectURL(data.file),
      thumbnailUrl: URL.createObjectURL(data.file),
      title: data.title,
      caption: data.caption,
      location: data.location,
      people: data.people,
      creatorId: user.id,
      creatorName: user.name,
      creatorAvatar: user.avatar,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: new Date(),
      tags: [],
    };

    setPhotos(prev => [newPhoto, ...prev]);
    setIsLoading(false);
    
    return newPhoto;
  }, [user]);

  const deletePhoto = useCallback(async (photoId: string): Promise<void> => {
    if (!user || user.role !== 'creator') {
      throw new Error('Only creators can delete photos');
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setIsLoading(false);
  }, [user]);

  const likePhoto = useCallback((photoId: string) => {
    if (!user) return;
    
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
  }, [user]);

  const unlikePhoto = useCallback((photoId: string) => {
    if (!user) return;
    
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
  }, [user]);

  const addComment = useCallback((photoId: string, content: string) => {
    if (!user) return;
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content,
      createdAt: new Date(),
    };

    setPhotos(prev => prev.map(photo => {
      if (photo.id === photoId) {
        return {
          ...photo,
          comments: [...photo.comments, newComment],
        };
      }
      return photo;
    }));
  }, [user]);

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
