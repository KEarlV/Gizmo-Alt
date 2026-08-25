/*
 * Mochi Study — Paper Lantern Lab
 * Recovery state styled as a misplaced study card, with Miso's calm companion voice.
 */
import { ArrowUpRight, Undo2 } from "lucide-react";
import { Link } from "wouter";

const MISO = "/manus-storage/miso-mascot_2b73d15b.png";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-scribble not-found-scribble--one">✦</div>
      <div className="not-found-scribble not-found-scribble--two">· · ·</div>
      <section className="not-found-card">
        <div className="not-found-card__tape" />
        <div className="not-found-card__topline"><span>MOCHI STUDY</span><span>DESK NOTE 404</span></div>
        <div className="not-found-card__mascot"><img src={MISO} alt="Miso, Mochi Study's mouse mascot" /></div>
        <p className="section-kicker">A card wandered off</p>
        <h1>Let's get you<br /><em>back to the desk.</em></h1>
        <p className="not-found-card__copy">Miso checked beneath the notebooks, but this page is not in the stack. The good news: your study thread is still right where you left it.</p>
        <Link href="/" className="button button--dark"><Undo2 size={15} /> Back to Today <ArrowUpRight size={15} /></Link>
        <span className="not-found-card__footer">No hearts lost along the way.</span>
      </section>
    </main>
  );
}
