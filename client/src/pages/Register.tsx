import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, UserPlus, AlertCircle, Loader2, BarChart3 } from 'lucide-react';

export default function Register() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const prefillEmail = params.get('prefill') || '';
  const fromQuiz = params.get('from') === 'quiz';

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState(decodeURIComponent(prefillEmail));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');

  const registerMutation = trpc.auth.openRegister.useMutation({
    onSuccess: (data) => {
      if (data.user?.role === 'customer') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    },
    onError: (err) => setError(err.message || 'Registration failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    registerMutation.mutate({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663344377985/bstGyXVcPKnASnnU.png" alt="Scale Detailing" className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            SOS <span className="text-gold">Scorecard</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Create Your Free Account</p>
        </div>

        {/* Quiz welcome banner */}
        {fromQuiz && (
          <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 mb-6 flex items-start gap-3">
            <BarChart3 size={16} className="text-gold mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gold mb-0.5">Your quiz results are waiting!</p>
              <p className="text-[11px] text-muted-foreground">Create your account to save your SOS score and track your progress over time.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-xs text-red-400">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" autoFocus className="h-11 bg-muted/20 border-border/40 focus:border-gold/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email *</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" className="h-11 bg-muted/20 border-border/40 focus:border-gold/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password *</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" className="h-11 pr-10 bg-muted/20 border-border/40 focus:border-gold/50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password *</Label>
              <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password"
                className={`h-11 bg-muted/20 border-border/40 focus:border-gold/50 ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : ''}`} />
              {confirmPassword && password !== confirmPassword && <p className="text-[10px] text-red-400">Passwords do not match</p>}
            </div>

            <Button type="submit" disabled={registerMutation.isPending} className="w-full h-11 bg-gold text-black font-bold hover:bg-gold-light disabled:opacity-50">
              {registerMutation.isPending
                ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating account…</>
                : <><UserPlus size={16} className="mr-2" /> Create Free Account</>}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-gold hover:text-gold-light font-semibold transition-colors">Sign in</button>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 mt-6 uppercase tracking-widest">
          Scale Toolkit · Powered by Scale Detailing
        </p>
      </div>
    </div>
  );
}
