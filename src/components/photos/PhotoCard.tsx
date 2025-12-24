import { useEffect, useState } from 'react';
import { Heart, MessageCircle, MapPin, Share2 } from 'lucide-react';
import { Photo } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePhotos } from '@/contexts/PhotoContext';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from "@/config/azureConfig";

interface PhotoCardProps {
  photo: Photo;
  onOpenDetail?: (photo: Photo) => void;
}

export function PhotoCard({ photo, onOpenDetail }: PhotoCardProps) {
  const { user } = useAuth();
  const { likePhoto, unlikePhoto } = usePhotos();
  const [isLiked, setIsLiked] = useState(user ? photo.likedBy.includes(user.id) : false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { photos } = usePhotos();
  const currentPhoto = photos.find(p => p.id === photo.id) || photo;
    const [comments, setComments] = useState(photo.comments || []);
  

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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    setIsAnimating(true);
    if (isLiked) {
      unlikePhoto(photo.id);
    } else {
      likePhoto(photo.id);
    }
    setIsLiked(!isLiked);
    
    setTimeout(() => setIsAnimating(false), 800);
  };

  const handleDoubleClick = () => {
    if (!user || isLiked) return;
    setIsAnimating(true);
    likePhoto(photo.id);
    setIsLiked(true);
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <div 
      className="masonry-item group cursor-pointer"
      onClick={() => onOpenDetail?.(photo)}
    >
      <div className="relative overflow-hidden rounded-xl bg-card shadow-soft transition-all duration-300 hover:shadow-medium">
        {/* Image */}
        <div 
          className="relative overflow-hidden"
          onDoubleClick={handleDoubleClick}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className={cn(
              "w-full object-cover transition-all duration-500 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Like animation overlay */}
          {isAnimating && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
              <Heart 
                className="h-20 w-20 fill-primary text-primary animate-heart-beat" 
              />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {/* Bottom info on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
            <h3 className="font-display text-lg font-semibold text-primary-foreground mb-1 drop-shadow-lg">
              {photo.title}
            </h3>
            {photo.location && (
              <div className="flex items-center gap-1 text-primary-foreground/80 text-sm">
                <MapPin className="h-3 w-3" />
                <span>{photo.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card footer */}
        <div className="p-3">
          {/* Creator info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 ring-1 ring-border">
                <AvatarImage src={photo.creatorAvatar} alt={photo.creatorName} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {photo.creatorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{photo.creatorName}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5 px-2 hover:bg-primary/10",
                isLiked && "text-primary"
              )}
              onClick={handleLike}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span className="text-xs">{photo.likes + (isLiked && !photo.likedBy.includes(user?.id || '') ? 1 : 0)}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail?.(photo);
              }}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{comments.length}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
