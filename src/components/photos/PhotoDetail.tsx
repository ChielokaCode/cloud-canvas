import { useEffect, useState } from 'react';
import { Heart, MessageCircle, MapPin, Users, X, Send } from 'lucide-react';
import { Photo } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { usePhotos } from '@/contexts/PhotoContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { API_BASE_URL } from '@/config/azureConfig';

interface PhotoDetailProps {
  photo: Photo;
  onClose: () => void;
}

interface GetLikesResponse {
  count: number;
  userHasLiked: boolean;
}


export function PhotoDetail({ photo, onClose }: PhotoDetailProps) {
  const { user } = useAuth();
  const { likePhoto, unlikePhoto} = usePhotos();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(photo.comments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);


    const getUserName = () => {
  return localStorage.getItem("userName");
}

const getUserRole = () => {
  return localStorage.getItem("userRole");
}

const getUserId = () => {
  return localStorage.getItem("userId");
}

  const userId = getUserId();



  const getLikes = async (
  photoId: string,
  userId?: string
): Promise<GetLikesResponse> => {
  const response = await fetch(`${API_BASE_URL}/get-likes`, {
    method: 'GET',
    headers: {
      'x-photo-id': photoId,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
};

useEffect(() => {
    const fetchLikes = async () => {
      try {
        const data = await getLikes(photo.id, userId ?? undefined);
        setLikes(data.count);
        setIsLiked(data.userHasLiked);
      } catch (err) {
        console.error('Failed to fetch likes:', err);
      }
    };

    fetchLikes();
  }, [photo.id, userId]);




  const likePhotoRequest = async () => {
  const response = await fetch(`${API_BASE_URL}/like-photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photoId: photo.id }),
  });

  return response.ok;
};

const unlikePhotoRequest = async () => {
  const response = await fetch(`${API_BASE_URL}/unlike-photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photoId: photo.id }),
  });

  return response.ok;
};


 const handleLike = async () => {
  if (!user || !userId) return;

  try {
    if (isLiked) {
  const success = await unlikePhotoRequest();
  if (success) {
    setLikes(prev => Math.max(0, prev - 1));
    setIsLiked(false);
    unlikePhoto(photo.id); // update context
  }
} else {
  const success = await likePhotoRequest();
  if (success) {
    setLikes(prev => prev + 1);
    setIsLiked(true);
    likePhoto(photo.id); // update context
  }
}

  } catch (err) {
    console.error('Like/unlike failed:', err);
  }
};





useEffect(() => {
  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-comments`, {
        method: 'GET', 
        headers: {
          'x-photo-id': photo.id,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch comments', await response.text());
        return;
      }

      const data = await response.json();
       setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  fetchComments();
}, [photo.id]);



const handleSubmitComment = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!comment.trim() || !user) return;
setLoading(true); 
setError(null);
  try {
    const response = await fetch(`${API_BASE_URL}/create-comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        photoId: photo.id,
        userId: getUserId(),
        userName: getUserName(),
        userRole: getUserRole(),
        content: comment.trim(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to post comment', await response.text());
      return;
    }

    const savedComment = await response.json();

    // Update local state via context helper
    //addComment(photo.id, savedComment.content);
    
    setComments(prev => [...prev, savedComment]);
    
  } catch (err) {
    setError('Failed to post comment');
    console.error('Error posting comment:', err);
  }finally {
    setLoading(false);
  }
};


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-card rounded-2xl shadow-medium overflow-hidden m-4 animate-scale-in">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-background/50 backdrop-blur-sm hover:bg-background/80"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* Image */}
          <div className="flex-1 bg-foreground/5 flex items-center justify-center min-h-[300px] lg:min-h-0">
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="max-w-full max-h-[50vh] lg:max-h-[90vh] object-contain"
            />
          </div>

          {/* Details sidebar */}
          <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-border">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  <AvatarImage src={photo.creatorAvatar} alt={photo.creatorName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {photo.creatorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{photo.creatorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <h2 className="font-display text-xl font-semibold mb-2">{photo.title}</h2>
              <p className="text-muted-foreground text-sm mb-3">{photo.caption}</p>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {photo.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{photo.location}</span>
                  </div>
                )}
                {photo.people && photo.people.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{photo.people.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 p-4 border-b border-border">
              <Button
  variant="ghost"
  size="sm"
  className={cn("gap-2", isLiked && "text-primary")}
  onClick={handleLike}
>
  <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
 <span>
  {photo.likes + (isLiked && !photo.likedBy.includes(user?.id || '') ? 1 : 0)}
</span>
</Button>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>{comments.length}</span>
              </div>
            </div>

            {/* Comments */}
            <ScrollArea className="flex-1 p-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No comments yet. Be the first!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                        <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                          {comment.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm">{comment.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Comment input */}
            {user && (
              <form onSubmit={handleSubmitComment} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button type="submit" size="icon" disabled={loading}>
                    {loading ? '...' : <Send className="h-4 w-4" />} 
                  </Button>
                </div>
                 {error && <p style={{ color: 'red' }}>{error}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
