import { ArrowUpRight, CheckCircle2, CircleHelp, Infinity as InfinityIcon, Loader2, Sparkles, Undo2 } from "lucide-react";
import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

export default function SharePage() {
  const [, params] = useRoute("/share/:token");
  const token = params?.token ?? "";
  const query = trpc.share.get.useQuery({ token }, { enabled: Boolean(token) });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (query.isLoading) return <main className="share-page share-page--center"><Loader2 className="spin" size={22} /><span>Miso is laying out the cards…</span></main>;
  if (query.error || !query.data) return <main className="share-page share-page--center"><div className="share-error"><div className="share-error__mark">?</div><h1>This deck wandered<br /><em>off the desk.</em></h1><p>The share link may have expired or been copied with a missing piece.</p><a href="/" className="button button--dark">Back to Mochi <ArrowUpRight size={15} /></a></div></main>;

  const { deck, cards } = query.data;
  const card = cards[index];
  return <main className="share-page"><header className="share-header"><a href="/" className="share-wordmark"><span>mochi</span><small>study desk</small></a><span className="share-badge"><InfinityIcon size={13} /> unlimited hearts</span></header><section className="share-hero"><div><span className="share-kicker">A deck shared with you</span><h1>{deck.title}</h1><p>{deck.summary ?? "A small set of ideas, shaped for a good study hour."}</p></div><div className="share-hero__note"><Sparkles size={16} /><span>{deck.mnemonic ?? "Keep the thread warm."}</span></div></section><section className="share-study"><div className="share-study__meta"><span>Card {String(index + 1).padStart(2, "0")} <i>/</i> {cards.length}</span><span>Read-only study preview</span></div><div className="share-progress"><span style={{ width: `${((index + (revealed ? 1 : 0)) / cards.length) * 100}%` }} /></div><button className={`share-card ${revealed ? "share-card--revealed" : ""}`} onClick={() => setRevealed(true)}>{revealed ? <><CheckCircle2 size={25} /><span>The short version</span><strong>{card.back}</strong><small>{card.hint}</small></> : <><CircleHelp size={26} /><span>Think it through</span><strong>{card.front}</strong><small>Tap to reveal the answer</small></>}</button>{revealed && <div className="share-card-actions"><button className="button button--dark" onClick={() => { setIndex((value) => (value + 1) % cards.length); setRevealed(false); }}>Next card <ArrowUpRight size={15} /></button></div>}</section><footer className="share-footer"><Undo2 size={14} /><span>Shared from Mochi Study · make your own deck at <a href="/">mochistudy.manus.space</a></span></footer></main>;
}
