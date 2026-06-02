import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus, Copy, Trash2, Loader2, CheckCircle2,
  ShieldCheck, Users, Link2, AlertCircle, Clock
} from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';

export default function InviteManagement() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [role, setRole] = useState<'user' | 'admin' | 'customer'>('user');
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const shopsQuery = trpc.shops.list.useQuery();
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);

  const invitesQuery = trpc.invites.list.useQuery();
  const createMutation = trpc.invites.create.useMutation({
    onSuccess: (data) => {
      setNewCode(data.code);
      invitesQuery.refetch();
    },
  });
  const deleteMutation = trpc.invites.delete.useMutation({
    onSuccess: () => {
      invitesQuery.refetch();
    },
  });

  // Customers cannot access invite management — guard AFTER all hooks
  if (!loading && user?.role === 'customer') {
    navigate('/portal');
    return null;
  }

  const handleCreate = () => {
    createMutation.mutate({ role, expiresInDays, shopId: role === 'customer' ? (selectedShopId ?? undefined) : undefined });
  };

  const handleCopy = (code: string, id: number) => {
    const url = `${window.location.origin}/register?code=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCopyNewCode = () => {
    if (!newCode) return;
    const url = `${window.location.origin}/register?code=${newCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(-1);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck size={48} className="text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground">Admin Access Required</h2>
          <p className="text-sm text-muted-foreground mt-1">Only administrators can manage invites.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Users size={20} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Invite Management</h1>
            <p className="text-sm text-muted-foreground">Create invite codes for new team members</p>
          </div>
        </div>

        {/* Create Invite */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-gold" />
            Generate New Invite
          </h3>

          {/* Shop selector for customer invites */}
          {role === 'customer' && (
            <div className="rounded-lg border border-gold/20 bg-gold/5 p-3 mb-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-gold mb-2 block">
                Link to Shop *
              </Label>
              <Select value={selectedShopId ? String(selectedShopId) : ''} onValueChange={(v) => setSelectedShopId(Number(v))}>
                <SelectTrigger className="h-10 bg-muted/20 border-border/40">
                  <SelectValue placeholder="Select a shop..." />
                </SelectTrigger>
                <SelectContent>
                  {(shopsQuery.data || []).map((shop: any) => (
                    <SelectItem key={shop.id} value={String(shop.id)}>{shop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                The customer will only see assessments for this shop in their portal.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Role
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'user' | 'admin' | 'customer')}>
                <SelectTrigger className="h-10 bg-muted/20 border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Assessor)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="customer">Customer (Shop Owner)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Expires In
              </Label>
              <Select value={String(expiresInDays)} onValueChange={(v) => setExpiresInDays(Number(v))}>
                <SelectTrigger className="h-10 bg-muted/20 border-border/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full h-10 bg-gold text-black font-bold hover:bg-gold-light"
              >
                {createMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <UserPlus size={16} className="mr-2" />
                )}
                Generate
              </Button>
            </div>
          </div>

          {/* Newly created invite */}
          {newCode && (
            <div className="rounded-lg border-2 border-gold/30 bg-gold/5 p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-gold" />
                <span className="text-xs font-bold text-gold uppercase tracking-wider">Invite Created</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-data text-foreground bg-muted/30 rounded px-3 py-2 truncate">
                  {window.location.origin}/register?code={newCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyNewCode}
                  className="shrink-0 h-8 border-gold/40 text-gold hover:bg-gold/10"
                >
                  {copiedId === -1 ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Share this link with the person you want to invite. They'll use it to create their account.
              </p>
            </div>
          )}
        </div>

        {/* Existing Invites */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Link2 size={16} className="text-gold" />
            Active Invites
            {invitesQuery.data && (
              <span className="text-xs font-data text-muted-foreground ml-auto">
                {invitesQuery.data.length} total
              </span>
            )}
          </h3>

          {invitesQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gold" />
            </div>
          ) : !invitesQuery.data?.length ? (
            <div className="text-center py-8">
              <UserPlus size={32} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No invites yet. Generate one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invitesQuery.data.map((invite: any) => {
                const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
                const isUsed = !!invite.usedAt;

                return (
                  <div
                    key={invite.id}
                    className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                      isUsed
                        ? 'border-green-500/20 bg-green-500/5'
                        : isExpired
                        ? 'border-red-500/20 bg-red-500/5'
                        : 'border-white/[0.06] bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs font-data text-foreground truncate">
                          {invite.code.slice(0, 8)}...{invite.code.slice(-4)}
                        </code>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          invite.role === 'admin'
                            ? 'bg-gold/10 text-gold'
                            : 'bg-muted/30 text-muted-foreground'
                        }`}>
                          {invite.role}
                        </span>
                        {isUsed && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                            Used
                          </span>
                        )}
                        {isExpired && !isUsed && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          Created {new Date(invite.createdAt).toLocaleDateString()}
                        </span>
                        {invite.expiresAt && (
                          <span>
                            Expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                        {invite.usedByName && (
                          <span className="text-green-400">
                            Used by {invite.usedByName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isUsed && !isExpired && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(invite.code, invite.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-gold"
                        >
                          {copiedId === invite.id ? <CheckCircle2 size={14} className="text-gold" /> : <Copy size={14} />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate({ id: invite.id })}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
