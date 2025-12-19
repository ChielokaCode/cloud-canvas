import { useNavigate, Link } from 'react-router-dom';
import { Camera, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isAzureConfigured } from '@/config/azureConfig';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginAsRole, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const azureConfigured = isAzureConfigured();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/browse');
    return null;
  }

  const handleAzureLogin = async () => {
    try {
      await login();
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'There was an error signing in. Please try again.',
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

          {/* Azure AD B2C Login */}
          {azureConfigured ? (
            <div className="space-y-4 mb-8">
              <Button
                onClick={handleAzureLogin}
                disabled={isLoading}
                className="w-full h-12"
                variant="hero"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="currentColor">
                      <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z"/>
                    </svg>
                    Sign in with Microsoft
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Powered by Azure Active Directory B2C
              </p>
            </div>
          ) : (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Azure AD B2C is not configured. Configure your <code>.env</code> file with Azure credentials to enable SSO login. Using demo mode for now.
              </AlertDescription>
            </Alert>
          )}

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {azureConfigured ? 'Or use demo mode' : 'Demo login'}
              </span>
            </div>
          </div>

          {/* Quick login buttons for demo */}
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Quick access (Demo)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleQuickLogin('creator')}
                className="h-12"
                disabled={isLoading}
              >
                Login as Creator
              </Button>
              <Button
                variant="outline"
                onClick={() => handleQuickLogin('consumer')}
                className="h-12"
                disabled={isLoading}
              >
                Login as Consumer
              </Button>
            </div>
          </div>

          {!azureConfigured && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">To enable Azure AD B2C:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Create an Azure AD B2C tenant</li>
                <li>Register your application</li>
                <li>Create user flows (sign-up/sign-in)</li>
                <li>Update your <code>.env</code> file with credentials</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
