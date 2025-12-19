import { useState, useRef } from 'react';
import { Upload, X, MapPin, Users, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePhotos } from '@/contexts/PhotoContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UploadFormProps {
  onSuccess?: () => void;
}

export function UploadForm({ onSuccess }: UploadFormProps) {
  const { uploadPhoto, isLoading } = usePhotos();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearForm = () => {
    setPreview(null);
    setFile(null);
    setTitle('');
    setCaption('');
    setLocation('');
    setPeople('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title || !caption) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await uploadPhoto({
        file,
        title,
        caption,
        location: location || undefined,
        people: people ? people.split(',').map(p => p.trim()) : undefined,
      });

      toast({
        title: 'Photo uploaded!',
        description: 'Your photo has been successfully uploaded.',
      });

      clearForm();
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your photo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Upload area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-200",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          preview ? "p-2" : "p-8"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-80 object-contain rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={clearForm}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Image className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium mb-1">Drop your photo here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Give your photo a title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <Label htmlFor="caption">Caption *</Label>
        <Textarea
          id="caption"
          placeholder="Tell the story behind this photo..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          required
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Location
        </Label>
        <Input
          id="location"
          placeholder="Where was this taken?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* People */}
      <div className="space-y-2">
        <Label htmlFor="people" className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          People
        </Label>
        <Input
          id="people"
          placeholder="Tag people (comma separated)"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
        />
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={isLoading || !file}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Photo
          </>
        )}
      </Button>
    </form>
  );
}
