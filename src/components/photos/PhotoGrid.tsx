import { useState } from 'react';
import { Photo } from '@/types';
import { PhotoCard } from './PhotoCard';
import { PhotoDetail } from './PhotoDetail';

interface PhotoGridProps {
  photos: Photo[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <>
      <div className="masonry-grid">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <PhotoCard
              photo={photo}
              onOpenDetail={setSelectedPhoto}
            />
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <PhotoDetail
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
