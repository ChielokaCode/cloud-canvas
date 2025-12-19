import { useState } from 'react';
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

interface PhotoDetailProps {
  photo: Photo;
  onClose: () => void;
}

export function PhotoDetail({ photo, onClose }: PhotoDetailProps) {
  const { user } = useAuth();
  const { likePhoto, unlikePhoto, addComment } = usePhotos();
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(user ? photo.likedBy.includes(user.id) : false);

  const handleLike = () => {
    if (!user) return;
    if (isLiked) {
      unlikePhoto(photo.id);
    } else {
      likePhoto(photo.id);
    }
    setIsLiked(!isLiked);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    addComment(photo.id, comment.trim());
    setComment('');
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
              src={photo.url}
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
                <span>{photo.likes}</span>
              </Button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>{photo.comments.length}</span>
              </div>
            </div>

            {/* Comments */}
            <ScrollArea className="flex-1 p-4">
              {photo.comments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No comments yet. Be the first!
                </p>
              ) : (
                <div className="space-y-4">
                  {photo.comments.map((comment) => (
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
                  />
                  <Button type="submit" size="icon" disabled={!comment.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
