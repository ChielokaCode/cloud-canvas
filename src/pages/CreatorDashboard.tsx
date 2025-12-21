import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Image, Heart, MessageCircle, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { UploadForm } from '@/components/creator/UploadForm';
import { CreatorPhotoCard } from '@/components/creator/CreatorPhotoCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePhotos } from '@/contexts/PhotoContext';


const CreatorDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { getPhotosByCreator, photos } = usePhotos();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'creator') {
    return <Navigate to="/browse" replace />;
  }

  const myPhotos = getPhotosByCreator(user.id);
  
  // Calculate stats
  const totalLikes = myPhotos.reduce(
  (sum, photo) => sum + (photo.likes ?? 0),
  0
);

const totalComments = myPhotos.reduce(
  (sum, photo) => sum + (photo.comments?.length ?? 0),
  0
);


  const stats = [
    { label: 'Photos', value: myPhotos.length, icon: Image },
    { label: 'Total Likes', value: totalLikes, icon: Heart },
    { label: 'Comments', value: totalComments, icon: MessageCircle },
  ];


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Creator Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your photos and track engagement
            </p>
          </div>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Upload Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Upload New Photo</DialogTitle>
              </DialogHeader>
              <UploadForm onSuccess={() => setUploadDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-6 shadow-soft border border-border/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <Tabs defaultValue="photos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="photos">My Photos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            {myPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CreatorPhotoCard photo={photo} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-2xl border border-border/50">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="font-display text-xl font-semibold mb-2">No photos yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start sharing your work with the world
                </p>
                <Button variant="hero" onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Photo
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="bg-card rounded-2xl border border-border/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Performance Overview</h3>
                  <p className="text-sm text-muted-foreground">Your content engagement metrics</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">{myPhotos.length}</p>
                  <p className="text-sm text-muted-foreground">Total Uploads</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">{totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">{totalComments}</p>
                  <p className="text-sm text-muted-foreground">Total Comments</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">
                    {myPhotos.length > 0 ? Math.round(totalLikes / myPhotos.length) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg. Likes/Photo</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-6 text-center">
                In production, this would show detailed analytics from Azure Application Insights
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CreatorDashboard;
