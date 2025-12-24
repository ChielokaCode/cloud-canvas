import { Link } from 'react-router-dom';
import { Camera, Image, Users, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated, loginAsRole } = useAuth();

  return (
    <div className="min-h-screen gradient-sunset">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container relative pt-20 pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              <span>Share your world through images</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
              Where{' '}
              <span className="text-gradient">moments</span>
              {' '}become{' '}
              <span className="text-gradient">memories</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Connect with a vibrant community of creators and fans. Share your best shots, explore inspiring content, and interact through the art of photos and stories.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              {isAuthenticated ? (
                <Link to="/browse">
                  <Button variant="hero" size="xl">
                    Start Exploring
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  {/* <Button 
                    variant="hero" 
                    size="xl"
                    onClick={() => loginAsRole('consumer')}
                  >
                    Browse as Consumer
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="hero-outline" 
                    size="xl"
                    onClick={() => loginAsRole('creator')}
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Login as Creator
                  </Button> */}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Everything you need to share your story
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether you're sharing your moments or exploring stories from others…
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Image,
                title: 'Beautiful Galleries',
                description: 'Showcase your photos in stunning masonry layouts that highlight every detail.',
              },
              {
                icon: Users,
                title: 'Vibrant Community',
                description: 'Connect with photographers and enthusiasts who share your passion.',
              },
              {
                icon: Heart,
                title: 'Meaningful Engagement',
                description: 'Like, comment, and save your favorite moments from creators worldwide.',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-background border border-border/50 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-warm flex items-center justify-center mb-4 shadow-glow group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="relative rounded-3xl gradient-warm p-12 md:p-16 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            
            <div className="relative text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to share your story?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Chat with friends and family while sharing your unique perspective with the world.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* <Button 
                  size="lg" 
                  className="bg-background text-foreground hover:bg-background/90"
                  onClick={() => loginAsRole('creator')}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Start Creating
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => loginAsRole('consumer')}
                >
                  Explore Photos
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-warm">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Lumina</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Lumina Photo App.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
