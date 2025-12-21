import { useNavigate, Link } from 'react-router-dom';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isAzureConfigured } from '@/config/azureConfig';
import { useState } from 'react';

const Login = () => {
  const navigate = useNavigate();
  const { loginWithRole, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const azureConfigured = isAzureConfigured();

  const [loadingCreator, setLoadingCreator] = useState(false);
  const [loadingConsumer, setLoadingConsumer] = useState(false);

  if (isAuthenticated) {
    navigate('/browse');
    return null;
  }

  const handleLogin = async (role: 'creator' | 'consumer') => {
    if (role === 'creator') setLoadingCreator(true);
    if (role === 'consumer') setLoadingConsumer(true);

    try {
      await loginWithRole(role);
      toast({ title: 'Welcome!', description: `Logged in as ${role}.` });
      navigate(role === 'creator' ? '/creator' : '/browse');
    } catch (error) {
      toast({ title: 'Login failed', description: 'There was an error signing in.', variant: 'destructive' });
    } finally {
      if (role === 'creator') setLoadingCreator(false);
      if (role === 'consumer') setLoadingConsumer(false);
    }
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
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to continue to Lumina</p>
          </div>

          {/* Azure AD login */}
          {azureConfigured && (
            <div className="space-y-4 mb-6">
              <Button onClick={() => handleLogin('creator')} disabled={loadingCreator} className="w-full h-12" variant="hero">
                {loadingCreator ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign in with Microsoft'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Powered by Microsoft Entra External ID</p>
            </div>
          )}

          {!azureConfigured && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Azure AD is not configured. Using demo mode.</AlertDescription>
            </Alert>
          )}

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Sign up with Email</span>
            </div>
          </div>

          {/* Quick / Local Login Buttons */}
          <div className="space-y-3 mb-4">
            {/* <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => handleLogin('creator')} className="h-12">Demo Creator</Button>
              <Button variant="outline" onClick={() => handleLogin('consumer')} className="h-12">Demo Consumer</Button>
            </div> */}

            <Button variant="secondary" onClick={() => navigate('/signup-creator')} className="w-full h-12">
              Sign up as a Creator
            </Button>
            <Button variant="secondary" onClick={() => navigate('/signup-consumer')} className="w-full h-12">
              Sign up as a Consumer
            </Button>

            <p className="text-sm text-center mt-2">
              Already a user? <Link to="/signin" className="text-blue-500">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
