import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole, loading, signIn } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && userRole === 'admin') {
        navigate('/admin/dashboard');
      }
      setCheckingAuth(false);
    }
  }, [user, userRole, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: 'Please enter both email and password'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use AuthContext signIn to update the context state
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: error.message || 'Invalid email or password'
        });
        return;
      }

      // Wait a bit for AuthContext to update, then check role
      // Use a small delay to ensure AuthContext state is updated
      setTimeout(async () => {
        // Fetch fresh user data to check role
        try {
          const currentUserResponse = await authApi.getCurrentUser();
          const currentUser = currentUserResponse?.user;
          
          console.log('User after login:', currentUser);
          
          if (!currentUser) {
            toast({
              variant: 'destructive',
              title: 'Login failed',
              description: 'Unable to retrieve user information'
            });
            setIsLoading(false);
            return;
          }
          
          if (currentUser.role !== 'admin') {
            toast({
              variant: 'destructive',
              title: 'Access denied',
              description: `This account does not have admin privileges. Current role: "${currentUser.role}". Please run "npm run create-admin" to create/update the admin user.`
            });
            setIsLoading(false);
            return;
          }
          
          toast({
            title: 'Welcome back, Admin!',
            description: 'Redirecting to dashboard...'
          });
          navigate('/admin/dashboard');
        } catch (err: any) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to verify admin status: ' + (err.message || 'Unknown error')
          });
        } finally {
          setIsLoading(false);
        }
      }, 200);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'An error occurred during login'
      });
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Login - SkillUp</title>
        <meta name="description" content="Admin portal login for SkillUp platform" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
        
        <Card className="w-full max-w-md relative z-10 border-slate-700 bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-heading text-white">Admin Portal</CardTitle>
              <CardDescription className="text-slate-400">
                Sign in to access the administration panel
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in to Admin Panel'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a href="/" className="text-sm text-slate-400 hover:text-primary transition-colors">
                ← Back to main site
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminLogin;
