import { ShieldCheck, ArrowLeft, Loader2, Users, Layers3, BookOpen, Mail } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

export default function AdminPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const overview = trpc.admin.overview.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const utils = trpc.useUtils();
  const roleMutation = trpc.admin.setRole.useMutation({ onSuccess: () => utils.admin.overview.invalidate() });

  if (loading) return <main className="admin-page admin-page--center"><Loader2 className="spin" size={22} /> Checking your study desk access…</main>;
  if (!isAuthenticated) return <main className="admin-page admin-page--center"><section className="admin-card admin-card--narrow"><ShieldCheck size={28} /><h1>Admin access is gated.</h1><p>Sign in with your Mochi account to continue.</p><button className="button button--dark" onClick={() => startLogin()}>Sign in <ArrowLeft size={15} /></button></section></main>;
  if (user?.role !== "admin") return <main className="admin-page admin-page--center"><section className="admin-card admin-card--narrow"><ShieldCheck size={28} /><h1>This desk is private.</h1><p>Your account is signed in, but it does not have administrator access.</p><Link href="/" className="button button--dark">Back to Mochi <ArrowLeft size={15} /></Link></section></main>;

  const rows = overview.data ?? [];
  const totalCards = rows.reduce((sum, row) => sum + row.cardCount, 0);
  return <main className="admin-page"><header className="admin-header"><div><span className="admin-kicker"><ShieldCheck size={14} /> Mochi operations</span><h1>People at the <em>desk.</em></h1><p>Account-level visibility for keeping the study workspace healthy.</p></div><Link href="/" className="button button--light"><ArrowLeft size={15} /> Return to app</Link></header><section className="admin-stats"><article><Users size={18} /><span>Accounts</span><strong>{rows.length}</strong></article><article><Layers3 size={18} /><span>Generated decks</span><strong>{rows.reduce((sum, row) => sum + row.deckCount, 0)}</strong></article><article><BookOpen size={18} /><span>Cards shaped</span><strong>{totalCards}</strong></article></section><section className="admin-card"><div className="admin-card__heading"><div><span className="admin-kicker">Directory</span><h2>Every learner, one row at a time.</h2></div><span className="admin-live"><i /> database live</span></div><div className="admin-table" role="table"><div className="admin-table__row admin-table__row--head" role="row"><span>Name</span><span>Role</span><span>Decks</span><span>Cards</span><span>Last sign-in</span></div>{overview.isLoading ? <div className="admin-empty"><Loader2 className="spin" size={17} /> Loading account summaries…</div> : rows.map((row) => <div className="admin-table__row" role="row" key={row.id}><div className="admin-user"><span>{(row.name ?? "Mochi learner").slice(0, 2).toUpperCase()}</span><div><strong>{row.name ?? "Unnamed learner"}</strong><small><Mail size={11} /> {row.email ?? row.openId}</small></div></div><button className={row.role === "admin" ? "admin-role admin-role--admin" : "admin-role"} disabled={roleMutation.isPending || row.id === user?.id} onClick={() => roleMutation.mutate({ userId: row.id, role: row.role === "admin" ? "user" : "admin" })}>{row.role === "admin" ? "admin · remove" : "user · promote"}</button><strong>{row.deckCount}</strong><strong>{row.cardCount}</strong><time>{row.lastSignedIn ? new Date(row.lastSignedIn).toLocaleDateString() : "—"}</time></div>)}</div></section></main>;
}
