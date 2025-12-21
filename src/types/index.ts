export type UserRole = 'creator' | 'consumer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  createdAt: Date;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  imageUrl: string;
  title: string;
  caption: string;
  location?: string;
  people?: string[];
  creatorId: string;
  creatorName: string;
  creatorRole: string;
  creatorAvatar?: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  createdAt: Date;
  tags?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface UploadPhotoData {
  file: File;
  title: string;
  caption: string;
  location?: string;
  people?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
