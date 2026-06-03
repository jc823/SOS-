import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Mail, CheckCircle2 } from 'lucide-react';

type Tab = 'password' | 'magic';

export default function Login() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const returnPath = searchParams.get('return') || '/';
  const magicToken = searchParams.get('magic') || '';

  const [tab, setTab] = useState<Tab>('password');

  // Password tab state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState('');

  // Magic link tab state
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState('');

  // Google toast
  const [showGoogleToast, setShowGoogleToast] = useState(false);

  // ── Auto-verify magic token from URL ──────────────────────────────────────
  const verifyMutation = trpc.auth.verifyMagicLink.useMutation({
    onSuccess: (data) => {
      const u = data.user as any;
      if (u?.role === 'customer') navigate('/portal');
      else if (u?.techLevel) navigate('/tech');
      else navigate(returnPath);
    },
    onError: () => { /* token expired — stay on login */ },
  });

  useEffect(() => {
    if (magicToken) {
      verifyMutation.mutate({ token: magicToken });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Password login ────────────────────────────────────────────────────────
  function getRedirect(user: { role?: string; techLevel?: number | null } | null | undefined) {
    if (!user) return returnPath;
    if (user.role === 'customer') return '/portal';
    if (user.techLevel) return '/tech';
    return returnPath;
  }

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => navigate(getRedirect(data.user)),
    onError: (err) => setPwError(err.message || 'Invalid username or password'),
  });

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    if (!username.trim() || !password.trim()) {
      setPwError('Please enter both username and password');
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  }

  // ── Magic link ────────────────────────────────────────────────────────────
  const sendMagicMutation = trpc.auth.sendMagicLink.useMutation({
    onSuccess: () => setMagicSent(true),
    onError: (err) => setMagicError(err.message || 'Something went wrong. Please try again.'),
  });

  function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMagicError('');
    if (!magicEmail.trim()) {
      setMagicError('Please enter your email address');
      return;
    }
    sendMagicMutation.mutate({ email: magicEmail.trim() });
  }

  // ── Verifying magic token ─────────────────────────────────────────────────
  if (magicToken && verifyMutation.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-gold mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Verifying your magic link…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-[100px]" />
      </div>

      {/* Google coming-soon toast */}
      {showGoogleToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm">
          <CheckCircle2 size={16} className="text-gold" />
          Google sign-in coming soon — use email + password for now.
        </div>
      )}

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

        {/* Card */}
        <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Access your assessment tool or client portal
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-muted/20 rounded-xl p-1 mb-6">
            {(['password', 'magic'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tab === t
                    ? 'bg-gold text-black'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'password' ? '🔑 Password' : '✉️ Magic Link'}
              </button>
            ))}
          </div>

          {/* ── Password Tab ── */}
          {tab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {pwError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <span className="text-xs text-red-400">{pwError}</span>
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
                  <><Loader2 size={16} className="animate-spin mr-2" /> Signing in…</>
                ) : (
                  <><LogIn size={16} className="mr-2" /> Sign In</>
                )}
              </Button>

              {/* Google OAuth placeholder */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowGoogleToast(true);
                  setTimeout(() => setShowGoogleToast(false), 3500);
                }}
                className="w-full h-11 border-border/40 hover:border-gold/30 text-sm gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
                <span className="text-[10px] text-muted-foreground/60 ml-1">(coming soon)</span>
              </Button>
            </form>
          )}

          {/* ── Magic Link Tab ── */}
          {tab === 'magic' && (
            <>
              {magicSent ? (
                <div className="text-center py-4">
                  <Mail size={36} className="text-gold mx-auto mb-4" />
                  <h3 className="text-base font-bold mb-2">Check your inbox</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    If an account exists for <strong>{magicEmail}</strong>, we've sent
                    a magic sign-in link. It expires in 15 minutes.
                  </p>
                  <button
                    onClick={() => { setMagicSent(false); setMagicEmail(''); }}
                    className="text-xs text-gold hover:underline"
                  >
                    Try a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicSubmit} className="space-y-5">
                  {magicError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <span className="text-xs text-red-400">{magicError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="magicEmail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="magicEmail"
                      type="email"
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoFocus
                      autoComplete="email"
                      className="h-11 bg-muted/20 border-border/40 focus:border-gold/50 focus:ring-gold/20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sendMagicMutation.isPending}
                    className="w-full h-11 bg-gold text-black font-bold hover:bg-gold-light disabled:opacity-50"
                  >
                    {sendMagicMutation.isPending ? (
                      <><Loader2 size={16} className="animate-spin mr-2" /> Sending…</>
                    ) : (
                      <><Mail size={16} className="mr-2" /> Send Magic Link</>
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground/50">
                    We'll email you a one-click sign-in link — no password needed.
                  </p>
                </form>
              )}
            </>
          )}

          {/* Bottom links */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] space-y-2 text-center">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-gold hover:text-gold-light font-semibold transition-colors"
              >
                Register with invite code
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              New here?{' '}
              <a href="/quiz" className="text-gold/70 hover:text-gold transition-colors">
                Take the free SOS Quiz first →
              </a>
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
