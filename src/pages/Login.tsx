import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginAsRole, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(email, password);
    
    if (success) {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/browse');
    } else {
      toast({
        title: 'Login failed',
        description: 'Invalid email or password.',
        variant: 'destructive',
      });
    }
  };

  const handleQuickLogin = (role: 'creator' | 'consumer') => {
    loginAsRole(role);
    toast({
      title: 'Welcome!',
      description: `Logged in as ${role}.`,
    });
    navigate(role === 'creator' ? '/creator' : '/browse');
  };

  return (
    <div className="min-h-screen gradient-sunset flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-warm shadow-glow">
            <Camera className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold">Lumina</span>
        </Link>

        {/* Login Card */}
        <div className="bg-card rounded-2xl shadow-medium p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to continue to Lumina</p>
          </div>

          {/* Quick login buttons */}
          <div className="space-y-3 mb-8">
            <p className="text-sm text-center text-muted-foreground">Quick access (Demo)</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleQuickLogin('creator')}
                className="h-12"
              >
                Login as Creator
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickLogin('consumer')}
                className="h-12"
              >
                Login as Consumer
              </Button>
            </div>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            In production, this would use Azure AD B2C
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
