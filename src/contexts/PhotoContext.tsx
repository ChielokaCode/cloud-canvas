import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { Photo, Comment, UploadPhotoData } from "@/types";
import { mockPhotos } from "@/services/mockData";
import { photoService } from "@/services/azureApi";
import { isAzureConfigured } from "@/config/azureConfig";
import { useAuth } from "./AuthContext";

interface PhotoContextType {
  photos: Photo[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  refreshPhotos: () => Promise<void>;
  uploadPhoto: (data: UploadPhotoData) => Promise<Photo>;
  deletePhoto: (photoId: string) => Promise<void>;
  likePhoto: (photoId: string) => void;
  unlikePhoto: (photoId: string) => void;
  getPhotoById: (photoId: string) => Photo | undefined;
  getPhotosByCreator: (creatorId: string) => Photo[];
}

// -------------------------------------
// Helper: normalize photo object
// -------------------------------------

const normalizePhoto = (photo: Partial<Photo>): Photo => ({
  id: photo.id ?? "", // required
  url: photo.url ?? "",
  thumbnailUrl: photo.thumbnailUrl ?? "",
  imageUrl: photo.imageUrl ?? "",
  title: photo.title ?? "",
  caption: photo.caption ?? "",
  location: photo.location ?? "",
  people: photo.people ?? [],
  creatorId: photo.creatorId ?? "",
  creatorName: photo.creatorName ?? "Unknown",
  creatorRole: photo.creatorRole ?? "",
  creatorAvatar: photo.creatorAvatar ?? "",
  likes: photo.likes ?? 0,
  likedBy: photo.likedBy ?? [],
  comments: photo.comments ?? [],
  createdAt: photo.createdAt ? new Date(photo.createdAt) : new Date(),
  tags: photo.tags ?? [],
});


const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------
  // Utility to get access token
  // ---------------------------
  const getAccessToken = () => localStorage.getItem("token");
  const getUserName = () => localStorage.getItem("userName") ?? "Unknown";
  const getUserRole = () => localStorage.getItem("userRole") ?? "";
  const getUserId = () => localStorage.getItem("userId") ?? "";

  // -------------------------------------
  // Fetch all photos from API
  // -------------------------------------
  const refreshPhotos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      //const token = getAccessToken();
      const fetchedPhotos = await photoService.getPhotos();

      // Normalize every photo
      setPhotos(fetchedPhotos.map(normalizePhoto));
    } catch (err) {
      console.error("Failed to fetch photos:", err);
      setError("Failed to load photos");

      if (!isAzureConfigured()) {
        setPhotos(mockPhotos.map(normalizePhoto));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  // -------------------------------------
  // Upload photo
  // -------------------------------------
  const uploadPhoto = useCallback(
    async (data: UploadPhotoData): Promise<Photo> => {
      if (getUserRole() !== "creator") {
        throw new Error("Only creators can upload photos");
      }

      setIsUploading(true);
      try {
        const token = getAccessToken();
        const newPhoto = await photoService.uploadPhoto(data, token);

        const photoWithCreator: Photo = normalizePhoto({
          ...newPhoto,
          creatorName: getUserName(),
          creatorId: getUserId(),
          creatorRole: getUserRole(),
        });

        setPhotos((prev) => [photoWithCreator, ...prev]);
        return photoWithCreator;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  // -------------------------------------
  // Delete photo
  // -------------------------------------
  const deletePhoto = useCallback(
    async (photoId: string): Promise<void> => {
      if (getUserRole() !== "creator") {
        throw new Error("Only creators can delete photos");
      }

      setIsLoading(true);
      try {
        const token = getAccessToken();
        await photoService.deletePhoto(photoId);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // -------------------------------------
  // Like / Unlike photo
  // -------------------------------------
  const likePhoto = useCallback(
    async (photoId: string) => {
      if (!user) return;
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId && !photo.likedBy.includes(user.id)
            ? { ...photo, likes: photo.likes + 1, likedBy: [...photo.likedBy, user.id] }
            : photo
        )
      );
      try {
        const token = getAccessToken();
        await photoService.likePhoto(photoId, user.id);
      } catch (err) {
        console.error("Failed to like photo:", err);
        setPhotos((prev) =>
          prev.map((photo) =>
            photo.id === photoId
              ? { ...photo, likes: photo.likes - 1, likedBy: photo.likedBy.filter((id) => id !== user.id) }
              : photo
          )
        );
      }
    },
    [user]
  );

  const unlikePhoto = useCallback(
    async (photoId: string) => {
      if (!user) return;
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId && photo.likedBy.includes(user.id)
            ? { ...photo, likes: photo.likes - 1, likedBy: photo.likedBy.filter((id) => id !== user.id) }
            : photo
        )
      );
      try {
        const token = getAccessToken();
        await photoService.unlikePhoto(photoId, user.id);
      } catch (err) {
        console.error("Failed to unlike photo:", err);
        setPhotos((prev) =>
          prev.map((photo) =>
            photo.id === photoId
              ? { ...photo, likes: photo.likes + 1, likedBy: [...photo.likedBy, user.id] }
              : photo
          )
        );
      }
    },
    [user]
  );

  const getPhotoById = useCallback(
    (photoId: string) => photos.find((p) => p.id === photoId),
    [photos]
  );

  const getPhotosByCreator = useCallback(
    (creatorId: string) => photos.filter((p) => p.creatorId === creatorId),
    [photos]
  );


  return (
    <PhotoContext.Provider
      value={{
        photos,
        isLoading,
        isUploading,
        error,
        refreshPhotos,
        uploadPhoto,
        deletePhoto,
        likePhoto,
        unlikePhoto,
        getPhotoById,
        getPhotosByCreator,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhotos() {
  const context = useContext(PhotoContext);
  if (!context) throw new Error("usePhotos must be used within a PhotoProvider");
  return context;
}
