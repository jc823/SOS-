import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, UserPlus, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const codeFromUrl = params.get('code') || '';

  const [inviteCode, setInviteCode] = useState(codeFromUrl);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Validate invite code
  const inviteQuery = trpc.auth.validateInvite.useQuery(
    { code: inviteCode },
    { enabled: inviteCode.length >= 8, retry: false }
  );

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      // Redirect customers to their portal, staff to the main page
      if (data.user?.role === 'customer') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    },
    onError: (err) => {
      setError(err.message || 'Registration failed');
    },
  });

  const isInviteValid = inviteQuery.data?.valid === true;
  const inviteRole = inviteQuery.data?.role;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    if (!isInviteValid) {
      setError(inviteQuery.data?.reason || 'Invalid invite code');
      return;
    }
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, underscores, dots, and hyphens');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    registerMutation.mutate({
      inviteCode: inviteCode.trim(),
      username: username.trim(),
      password,
      name: name.trim(),
      email: email.trim() || undefined,
    });
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
            SOS <span className="text-gold">Scorecard</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            Create Your Account
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-xs text-red-400">{error}</span>
              </div>
            )}

            {/* Invite Code */}
            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Invite Code *
              </Label>
              <div className="relative">
                <Input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Paste your invite code"
                  autoFocus={!codeFromUrl}
                  className={`h-11 pr-10 bg-muted/20 border-border/40 focus:border-gold/50 focus:ring-gold/20 font-data text-sm ${
                    isInviteValid ? 'border-green-500/50' : inviteQuery.data && !inviteQuery.data.valid ? 'border-red-500/50' : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {inviteQuery.isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                  {isInviteValid && <CheckCircle2 size={14} className="text-green-400" />}
                  {inviteQuery.data && !inviteQuery.data.valid && <AlertCircle size={14} className="text-red-400" />}
                </div>
              </div>
              {isInviteValid && inviteRole && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-gold" />
                  <span className="text-[10px] text-gold capitalize">
                    {inviteRole} access granted
                  </span>
                </div>
              )}
              {inviteQuery.data && !inviteQuery.data.valid && (
                <p className="text-[10px] text-red-400">{inviteQuery.data.reason}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="h-11 bg-muted/20 border-border/40 focus:border-gold/50 focus:ring-gold/20"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Username *
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                autoComplete="username"
                className="h-11 bg-muted/20 border-border/40 focus:border-gold/50 focus:ring-gold/20"
              />
              <p className="text-[10px] text-muted-foreground">
                Letters, numbers, underscores, dots, hyphens. Min 3 characters.
              </p>
            </div>

            {/* Email (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="h-11 bg-muted/20 border-border/40 focus:border-gold/50 focus:ring-gold/20"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Confirm Password *
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={`h-11 bg-muted/20 border-border/40 focus:border-gold/50 focus:ring-gold/20 ${
                  confirmPassword && password !== confirmPassword ? 'border-red-500/50' : ''
                }`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-red-400">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending || !isInviteValid}
              className="w-full h-11 bg-gold text-black font-bold hover:bg-gold-light disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={16} className="mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-gold hover:text-gold-light font-semibold transition-colors"
              >
                Sign in
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
