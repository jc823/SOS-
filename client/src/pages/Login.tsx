import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Get return path from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const returnPath = searchParams.get('return') || '/';

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      // Redirect customers to their portal, staff to the requested path
      if (data.user?.role === 'customer') {
        navigate('/portal');
      } else {
        navigate(returnPath);
      }
    },
    onError: (err) => {
      setError(err.message || 'Invalid username or password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png"
              alt="Scale Detailing"
              className="h-10 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Scale <span className="text-gold">Toolkit</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            Powered by Scale Detailing
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your credentials to access the assessment tool
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-xs text-red-400">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                className="h-11 bg-muted/20 border-border/40 focus:border-gold/50 focus:ring-gold/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-11 pr-10 bg-muted/20 border-border/40 focus:border-gold/50 focus:ring-gold/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-11 bg-gold text-black font-bold hover:bg-gold-light disabled:opacity-50"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} className="mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-gold hover:text-gold-light font-semibold transition-colors"
              >
                Register with invite code
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/40 mt-6 uppercase tracking-widest">
          Scale Toolkit · Powered by Scale Detailing
        </p>
      </div>
    </div>
  );
}
