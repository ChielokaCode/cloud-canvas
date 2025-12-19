import { useState } from 'react';
import { Heart, MessageCircle, Trash2, MapPin } from 'lucide-react';
import { Photo } from '@/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { usePhotos } from '@/contexts/PhotoContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CreatorPhotoCardProps {
  photo: Photo;
}

export function CreatorPhotoCard({ photo }: CreatorPhotoCardProps) {
  const { deletePhoto } = usePhotos();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePhoto(photo.id);
      toast({
        title: 'Photo deleted',
        description: 'Your photo has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete photo.',
        variant: 'destructive',
      });
    }
    setIsDeleting(false);
  };

  return (
    <div className="group bg-card rounded-xl shadow-soft overflow-hidden transition-all duration-300 hover:shadow-medium">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={photo.thumbnailUrl}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Delete button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your photo
                  and all associated comments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-lg mb-1 truncate">{photo.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{photo.caption}</p>
        
        {photo.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="h-3 w-3" />
            <span>{photo.location}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span>{photo.likes}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span>{photo.comments.length}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
