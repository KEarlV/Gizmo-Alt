/*
 * Mochi Study — Paper Lantern Lab
 * This page follows the warm editorial study-desk direction: asymmetric rail navigation,
 * Fraunces display type, DM Sans utility copy, persimmon action marks, and the original Miso mascot.
 */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  FolderPlus,
  Home as HomeIcon,
  Infinity as InfinityIcon,
  Layers3,
  Library,
  ListChecks,
  Menu,
  MoreHorizontal,
  PencilLine,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Undo2,
  X,
} from "lucide-react";

const MISO = "/manus-storage/miso-mascot_2b73d15b.png";
const DESK_ILLUSTRATION = "/manus-storage/paper-desk-illustration_5b03151f.png";

type View = "home" | "decks" | "insights" | "library" | "review";
type DeckKind = "biology" | "psychology" | "astronomy" | "history" | "new";

type Deck = {
  id: string;
  name: string;
  subject: string;
  cards: number;
  due: number;
  progress: number;
  accent: string;
  kind: DeckKind;
  updated: string;
};

type ReviewCard = {
  prompt: string;
  answer: string;
  hint: string;
};

const initialDecks: Deck[] = [
  {
    id: "biology",
    name: "Cell Biology",
    subject: "Biology · Midterm sprint",
    cards: 48,
    due: 12,
    progress: 68,
    accent: "persimmon",
    kind: "biology",
    updated: "12 min ago",
  },
  {
    id: "psychology",
    name: "Cognitive Psychology",
    subject: "Psychology · Chapter 4",
    cards: 32,
    due: 8,
    progress: 42,
    accent: "moss",
    kind: "psychology",
    updated: "Yesterday",
  },
  {
    id: "astronomy",
    name: "Astronomy Basics",
    subject: "Science · Night-sky notes",
    cards: 24,
    due: 0,
    progress: 91,
    accent: "denim",
    kind: "astronomy",
    updated: "Aug 22",
  },
  {
    id: "history",
    name: "Modern History",
    subject: "History · Essay preparation",
    cards: 36,
    due: 4,
    progress: 26,
    accent: "butter",
    kind: "history",
    updated: "Aug 20",
  },
];

const reviewCards: Record<string, ReviewCard[]> = {
  biology: [
    {
      prompt: "What is the primary function of the mitochondrion?",
      answer: "To produce ATP through cellular respiration, supplying usable energy for the cell.",
      hint: "Think of the organelle as the cell's small power station.",
    },
    {
      prompt: "Why is the cell membrane described as selectively permeable?",
      answer: "It allows some substances to pass through while restricting others, helping the cell maintain internal balance.",
      hint: "The word selective is doing the work here.",
    },
    {
      prompt: "What do ribosomes assemble?",
      answer: "Ribosomes assemble proteins by linking amino acids according to messenger RNA instructions.",
      hint: "They read the recipe and build the chain.",
    },
  ],
  psychology: [
    {
      prompt: "What is the spacing effect?",
      answer: "Information is remembered more effectively when study sessions are spread over time instead of crammed together.",
      hint: "Your future self needs a little room between visits.",
    },
    {
      prompt: "What is working memory?",
      answer: "A limited system for temporarily holding and manipulating information during an active task.",
      hint: "It is the small desk surface in your mind.",
    },
    {
      prompt: "What does retrieval practice strengthen?",
      answer: "It strengthens the ability to access knowledge later by practicing recall rather than only rereading.",
      hint: "The act of reaching for the idea is part of the learning.",
    },
  ],
  astronomy: [
    {
      prompt: "What causes the phases of the Moon?",
      answer: "The Moon's phases come from the changing angle between the Sun, Moon, and Earth as the Moon orbits us.",
      hint: "The Moon is always half lit; we just see different slices.",
    },
    {
      prompt: "What is a light-year?",
      answer: "A unit of distance: the distance light travels in one year, about 9.46 trillion kilometers.",
      hint: "It measures space, not time.",
    },
    {
      prompt: "Why do stars appear to twinkle?",
      answer: "Earth's moving atmosphere bends starlight slightly as it travels through layers of air with different temperatures.",
      hint: "The star is steady; the air is not.",
    },
  ],
  history: [
    {
      prompt: "What makes a primary source useful to a historian?",
      answer: "It provides direct evidence from the period being studied, such as a letter, artifact, speech, or photograph.",
      hint: "It is close to the event, not a later retelling.",
    },
    {
      prompt: "What is historical context?",
      answer: "The surrounding political, social, economic, and cultural conditions that shape how an event should be understood.",
      hint: "No event happens in a vacuum.",
    },
    {
      prompt: "Why compare multiple accounts of the same event?",
      answer: "Comparing accounts reveals perspective, bias, agreement, and omissions that one source alone may hide.",
      hint: "A wider desk gives you a better view.",
    },
  ],
};

const navItems: { id: Exclude<View, "review">; label: string; icon: typeof HomeIcon }[] = [
  { id: "home", label: "Today", icon: HomeIcon },
  { id: "decks", label: "My decks", icon: Layers3 },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "library", label: "Library", icon: Library },
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function AppMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={classNames("brand-lockup", compact && "brand-lockup--compact")}>
      <div className="brand-mark">
        <img src={MISO} alt="Miso, Mochi Study's mouse mascot" />
      </div>
      {!compact && (
        <div className="brand-copy">
          <span className="brand-name">mochi</span>
          <span className="brand-subtitle">study desk</span>
        </div>
      )}
    </div>
  );
}

function SectionKicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={classNames("section-kicker", className)}>{children}</div>;
}

function UnlimitedHearts({ onClick }: { onClick: () => void }) {
  return (
    <button className="unlimited-badge" onClick={onClick} aria-label="Show unlimited hearts details">
      <span className="unlimited-badge__icon"><InfinityIcon size={18} strokeWidth={2.5} /></span>
      <span><strong>∞ hearts</strong><small>deep study mode</small></span>
    </button>
  );
}

function ProgressLine({ value, accent = "persimmon" }: { value: number; accent?: Deck["accent"] }) {
  return (
    <div className="progress-line" aria-label={`${value}% complete`}>
      <span className={classNames("progress-line__fill", `progress-line__fill--${accent}`)} style={{ width: `${value}%` }} />
    </div>
  );
}

function DeckCover({ kind, size = "default" }: { kind: DeckKind; size?: "default" | "small" }) {
  if (kind === "astronomy") {
    return (
      <div className={classNames("deck-cover", "deck-cover--astronomy", size === "small" && "deck-cover--small")} aria-label="Night sky study deck">
        <span className="astronomy-moon">☾</span>
        <span className="astronomy-star astronomy-star--one">✦</span>
        <span className="astronomy-star astronomy-star--two">·</span>
        <span className="cover-stamp">night sky</span>
      </div>
    );
  }

  return (
    <div className={classNames("deck-cover", `deck-cover--${kind}`, size === "small" && "deck-cover--small")}>
      <span className="cover-orbit cover-orbit--one" />
      <span className="cover-orbit cover-orbit--two" />
      <span className="cover-glyph">{kind === "biology" ? "✣" : kind === "psychology" ? "◌" : "↗"}</span>
      <span className="cover-stamp">{kind === "biology" ? "living systems" : kind === "psychology" ? "mind notes" : "field notes"}</span>
    </div>
  );
}

function SideRail({ view, setView }: { view: View; setView: (view: Exclude<View, "review">) => void }) {
  return (
    <aside className="side-rail">
      <div className="side-rail__top">
        <AppMark compact />
        <button className="mobile-menu" aria-label="Open navigation"><Menu size={20} /></button>
      </div>
      <div className="side-rail__brand"><AppMark /></div>

      <nav className="rail-nav" aria-label="Primary navigation">
        <SectionKicker>Workspace</SectionKicker>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setView(id)} className={classNames("rail-nav__item", view === id && "rail-nav__item--active")}>
            <Icon size={18} strokeWidth={view === id ? 2.3 : 1.8} />
            <span>{label}</span>
            {id === "home" && <span className="rail-nav__dot" />}
          </button>
        ))}
        <SectionKicker className="rail-nav__kicker--later">Your spaces</SectionKicker>
        <button className="rail-nav__item" onClick={() => setView("decks")}>
          <Bookmark size={18} strokeWidth={1.8} /><span>Saved sets</span><span className="rail-nav__count">3</span>
        </button>
        <button className="rail-nav__item" onClick={() => setView("decks")}>
          <FolderPlus size={18} strokeWidth={1.8} /><span>New collection</span>
        </button>
      </nav>

      <div className="side-rail__bottom">
        <div className="rail-note">
          <span className="rail-note__pin" />
          <strong>Unlimited hearts</strong>
          <span>Focus without the timer.</span>
        </div>
        <button className="rail-nav__item rail-nav__item--settings"><Settings size={18} strokeWidth={1.8} /><span>Settings</span></button>
        <div className="profile-chip">
          <div className="profile-chip__avatar">AM</div>
          <div><strong>Alex Morgan</strong><span>Study gardener</span></div>
          <MoreHorizontal size={17} />
        </div>
      </div>
    </aside>
  );
}

function TopBar({ onFocusClick, onStartReview }: { onFocusClick: () => void; onStartReview: () => void }) {
  return (
    <header className="top-bar">
      <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>Today</strong></div>
      <div className="top-bar__actions">
        <label className="search-box">
          <Search size={17} />
          <input aria-label="Search decks" placeholder="Search decks" />
          <span className="search-box__shortcut">⌘ K</span>
        </label>
        <UnlimitedHearts onClick={onFocusClick} />
        <button className="top-bar__review" onClick={onStartReview}><Play size={15} fill="currentColor" /> Start review</button>
      </div>
    </header>
  );
}

function Dashboard({ decks, onReview, onViewDecks, onShowFocus }: { decks: Deck[]; onReview: (id?: string) => void; onViewDecks: () => void; onShowFocus: () => void }) {
  const totalDue = decks.reduce((sum, deck) => sum + deck.due, 0);
  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <SectionKicker>Tuesday · August 25, 2026</SectionKicker>
          <h1>Your next good hour<br /><em>starts here.</em></h1>
          <p className="welcome-copy">A quiet place to pick up the thread, Alex. You have <strong>{totalDue} cards</strong> waiting when you are ready.</p>
        </div>
        <div className="welcome-doodle" aria-hidden="true"><span>✦</span><span>↗</span><span>· · ·</span></div>
      </section>

      <section className="focus-card">
        <div className="focus-card__copy">
          <SectionKicker>Tonight's focus <span className="kicker-rule" /></SectionKicker>
          <div className="focus-card__title-row"><h2>Cell Biology</h2><span className="focus-card__tag">12 due</span></div>
          <p>Keep the thread on organelles, membranes, and the tiny machinery that keeps a cell alive.</p>
          <div className="focus-card__meta"><span><Clock3 size={15} /> 15–20 min</span><span><ListChecks size={15} /> 12 cards</span><span><Target size={15} /> 68% familiar</span></div>
          <button className="button button--dark" onClick={() => onReview("biology")}><Play size={16} fill="currentColor" /> Continue session <ArrowUpRight size={16} /></button>
        </div>
        <div className="focus-card__art"><img src={DESK_ILLUSTRATION} alt="Open notebook and flashcards on a warm study desk" /><span className="focus-card__label">desk note 04</span></div>
      </section>

      <section className="stat-grid">
        <article className="stat-card stat-card--warm"><div className="stat-card__top"><SectionKicker>Today</SectionKicker><CheckCircle2 size={18} /></div><strong>24 <small>cards</small></strong><p>12 more than yesterday <span className="stat-arrow">↗</span></p><div className="stat-bars"><i style={{ height: "42%" }} /><i style={{ height: "68%" }} /><i style={{ height: "54%" }} /><i style={{ height: "84%" }} /><i style={{ height: "76%" }} /><i className="stat-bars__today" style={{ height: "94%" }} /></div></article>
        <article className="stat-card"><div className="stat-card__top"><SectionKicker>Study streak</SectionKicker><Flame size={18} /></div><strong>9 <small>days</small></strong><p>Best this month <span className="stat-arrow">✦</span></p><div className="streak-dots">{[1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0].map((on, index) => <i key={index} className={on ? "is-on" : ""} />)}</div></article>
        <article className="stat-card stat-card--blue"><div className="stat-card__top"><SectionKicker>Recall health</SectionKicker><BarChart3 size={18} /></div><strong>82<small>%</small></strong><p>Across 4 active decks <span className="stat-arrow">↗</span></p><div className="health-meter"><span style={{ width: "82%" }} /></div><div className="health-meter__labels"><span>needs a look</span><span>steady</span></div></article>
      </section>

      <section className="section-header"><div><SectionKicker>Keep going</SectionKicker><h2>Open a deck</h2></div><button className="text-button" onClick={onViewDecks}>View all decks <ArrowUpRight size={15} /></button></section>
      <section className="deck-grid">
        {decks.slice(0, 3).map((deck) => <DeckTile key={deck.id} deck={deck} onReview={onReview} />)}
        <button className="new-deck-tile" onClick={onViewDecks}><span className="new-deck-tile__icon"><Plus size={21} /></span><strong>Build a new deck</strong><span>Turn a note into a study set.</span></button>
      </section>

      <section className="lower-grid">
        <div className="activity-panel paper-panel"><div className="panel-heading"><div><SectionKicker>Recent activity</SectionKicker><h3>A little proof of practice</h3></div><button className="icon-button" aria-label="Activity options"><MoreHorizontal size={18} /></button></div><div className="activity-list"><ActivityItem icon={<Check size={15} />} accent="persimmon" title="Cell Biology" detail="12 cards reviewed" time="12 min ago" /><ActivityItem icon={<Trophy size={15} />} accent="butter" title="Nine-day streak" detail="You showed up again" time="Yesterday" /><ActivityItem icon={<Bookmark size={15} />} accent="moss" title="Astronomy Basics" detail="Deck marked steady" time="Aug 22" /></div><button className="panel-link" onClick={onShowFocus}>View study history <ChevronRight size={15} /></button></div>
        <div className="note-panel"><div className="note-panel__paper"><div className="note-panel__copy"><SectionKicker>From Miso's desk</SectionKicker><h3>Small steps<br /><em>count twice.</em></h3><p>One honest recall is worth more than three distracted rereads.</p><button className="note-link" onClick={onShowFocus}>Why this works <ArrowUpRight size={15} /></button></div><img src={MISO} alt="Miso sitting beside a stack of flashcards" /></div></div>
      </section>
    </div>
  );
}

function ActivityItem({ icon, accent, title, detail, time }: { icon: ReactNode; accent: string; title: string; detail: string; time: string }) {
  return <div className="activity-item"><span className={classNames("activity-item__icon", `activity-item__icon--${accent}`)}>{icon}</span><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>;
}

function DeckTile({ deck, onReview }: { deck: Deck; onReview: (id: string) => void }) {
  return (
    <article className="deck-tile" onClick={() => onReview(deck.id)}>
      <DeckCover kind={deck.kind} />
      <div className="deck-tile__body"><div className="deck-tile__title"><div><SectionKicker>{deck.subject.split(" · ")[0]}</SectionKicker><h3>{deck.name}</h3></div><button className="tile-more" onClick={(event) => event.stopPropagation()} aria-label={`${deck.name} options`}><MoreHorizontal size={17} /></button></div><div className="deck-tile__stats"><span>{deck.cards} cards</span><span>{deck.due ? `${deck.due} due` : "All caught up"}</span></div><ProgressLine value={deck.progress} accent={deck.accent as Deck["accent"]} /><div className="deck-tile__footer"><span>{deck.progress}% familiar</span><button onClick={(event) => { event.stopPropagation(); onReview(deck.id); }}>Review <ArrowUpRight size={14} /></button></div></div>
    </article>
  );
}

function DecksView({ decks, onReview, onCreate }: { decks: Deck[]; onReview: (id: string) => void; onCreate: () => void }) {
  return (
    <div className="page-stack page-stack--subpage"><section className="subpage-heading"><div><SectionKicker>Your study library</SectionKicker><h1>My decks <em>↗</em></h1><p>Everything you are building, in one quiet row.</p></div><button className="button button--dark" onClick={onCreate}><Plus size={16} /> New deck</button></section><div className="deck-library-grid">{decks.map((deck) => <DeckTile key={deck.id} deck={deck} onReview={onReview} />)}<button className="new-deck-tile new-deck-tile--large" onClick={onCreate}><span className="new-deck-tile__icon"><Plus size={21} /></span><strong>Build a new deck</strong><span>Paste notes, add prompts, or start blank.</span></button></div></div>
  );
}

function InsightsView() {
  const bars = [36, 52, 43, 68, 58, 76, 89, 63, 82, 74, 92, 86, 97, 78];
  return <div className="page-stack page-stack--subpage"><section className="subpage-heading"><div><SectionKicker>Patterns worth keeping</SectionKicker><h1>Study <em>insights</em></h1><p>Notice what your practice is making easier.</p></div><button className="quiet-select"><CalendarDays size={15} /> Last 14 days <ChevronRight size={14} /></button></section><section className="insight-hero paper-panel"><div><SectionKicker>Recall health</SectionKicker><strong>82<span>%</span></strong><p>up 7% from your previous two weeks</p></div><div className="insight-chart" aria-label="Recall health chart">{bars.map((value, index) => <div key={index} className={classNames("insight-bar", index === bars.length - 1 && "is-current")} style={{ height: `${value}%` }}><span>{index === bars.length - 1 ? "today" : ""}</span></div>)}</div></section><div className="insight-grid"><article className="paper-panel insight-card"><div className="insight-card__icon insight-card__icon--persimmon"><RotateCcw size={18} /></div><SectionKicker>Best move</SectionKicker><h3>Short, steady reviews</h3><p>You recall 18% more when sessions stay under 20 minutes.</p><button className="panel-link">See session rhythm <ArrowUpRight size={15} /></button></article><article className="paper-panel insight-card"><div className="insight-card__icon insight-card__icon--moss"><Target size={18} /></div><SectionKicker>Most familiar</SectionKicker><h3>Astro vocabulary</h3><p>Your Astronomy Basics deck has held above 90% for five days.</p><button className="panel-link">Open deck <ArrowUpRight size={15} /></button></article><article className="paper-panel insight-card"><div className="insight-card__icon insight-card__icon--butter"><Sparkles size={18} /></div><SectionKicker>Gentle nudge</SectionKicker><h3>History is next</h3><p>Four cards are ready for a second look before your essay session.</p><button className="panel-link">Review four cards <ArrowUpRight size={15} /></button></article></div></div>;
}

function LibraryView({ onReview }: { onReview: (id: string) => void }) {
  return <div className="page-stack page-stack--subpage"><section className="subpage-heading"><div><SectionKicker>Curated by you</SectionKicker><h1>Saved <em>sets</em></h1><p>Little collections for the edges of your day.</p></div><button className="quiet-select"><Search size={15} /> Browse library <ArrowUpRight size={14} /></button></section><div className="saved-grid"><article className="saved-card saved-card--quote"><span className="saved-card__mark">“</span><h3>Ideas worth<br /><em>keeping close.</em></h3><p>3 sets · 68 cards</p><button className="panel-link" onClick={() => onReview("psychology")}>Open collection <ArrowUpRight size={15} /></button></article><article className="saved-card saved-card--list"><SectionKicker>Quick picks</SectionKicker><div className="saved-row"><span className="saved-row__number">01</span><div><strong>Words that clarify</strong><span>12 cards · writing</span></div><ChevronRight size={16} /></div><div className="saved-row"><span className="saved-row__number">02</span><div><strong>Late-night astronomy</strong><span>24 cards · science</span></div><ChevronRight size={16} /></div><div className="saved-row"><span className="saved-row__number">03</span><div><strong>Psych terms to know</strong><span>32 cards · psychology</span></div><ChevronRight size={16} /></div></article><article className="saved-card saved-card--prompt"><div className="saved-card__prompt-icon"><PencilLine size={19} /></div><SectionKicker>Make a set from a note</SectionKicker><h3>Have a page<br /><em>in mind?</em></h3><p>Drop in the thought. Mochi will help you shape the prompts.</p><button className="button button--dark" onClick={() => onReview("biology")}><Plus size={15} /> Try a prompt</button></article></div></div>;
}

function ReviewView({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const cards = reviewCards[deck.id] ?? reviewCards.biology;
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const current = cards[index];
  const progress = done ? 100 : ((index + (revealed ? 0.6 : 0)) / cards.length) * 100;

  const answer = (quality: "again" | "good" | "easy") => {
    if (index === cards.length - 1) {
      setDone(true);
      return;
    }
    setIndex((currentIndex) => currentIndex + 1);
    setRevealed(false);
  };

  if (done) {
    return <div className="review-shell review-shell--done"><button className="back-link" onClick={onExit}><Undo2 size={15} /> Back to workspace</button><div className="completion-card"><div className="completion-card__symbol"><Check size={34} /></div><SectionKicker>Session complete</SectionKicker><h1>Nice work<br /><em>keeping the thread.</em></h1><p>You reviewed {cards.length} cards from <strong>{deck.name}</strong>. Your focus stayed yours the whole way.</p><div className="completion-stats"><div><strong>{cards.length}</strong><span>cards reviewed</span></div><div><strong>+12</strong><span>steady points</span></div><div><strong>∞</strong><span>hearts remaining</span></div></div><button className="button button--dark" onClick={() => { setIndex(0); setDone(false); setRevealed(false); }}>Review once more <RotateCcw size={16} /></button></div><img className="completion-miso" src={MISO} alt="Miso mascot" /></div>;
  }

  return <div className="review-shell"><div className="review-header"><button className="back-link" onClick={onExit}><Undo2 size={15} /> Exit session</button><div className="review-header__deck"><DeckCover kind={deck.kind} size="small" /><div><SectionKicker>{deck.subject.split(" · ")[0]}</SectionKicker><strong>{deck.name}</strong></div></div><div className="review-header__right"><UnlimitedHearts onClick={() => undefined} /><span className="review-counter">{index + 1} <i>/</i> {cards.length}</span></div></div><div className="review-progress"><span style={{ width: `${progress}%` }} /></div><main className="review-main"><div className="review-intro"><SectionKicker>Recall card {String(index + 1).padStart(2, "0")}</SectionKicker><h1>Take a breath.<br /><em>What comes to mind?</em></h1></div><button className={classNames("review-card", revealed && "review-card--revealed")} onClick={() => setRevealed(true)} aria-label={revealed ? "Answer revealed" : "Reveal answer"}><div className="review-card__corner">{revealed ? "answer" : "prompt"}</div><div className="review-card__content">{revealed ? <><span className="review-card__eyebrow">The short version</span><h2>{current.answer}</h2><p className="review-card__hint"><Sparkles size={15} /> {current.hint}</p></> : <><CircleHelp className="review-card__question-icon" size={27} /><h2>{current.prompt}</h2><span className="review-card__reveal">Tap to reveal <ArrowUpRight size={15} /></span></>}</div><div className="review-card__scribble">{revealed ? "keep it warm" : "think slowly"}</div></button>{revealed ? <div className="answer-actions"><span>How did that feel?</span><div><button className="answer-button answer-button--again" onClick={() => answer("again")}><RotateCcw size={15} /> Again</button><button className="answer-button answer-button--good" onClick={() => answer("good")}><Check size={15} /> Got it</button><button className="answer-button answer-button--easy" onClick={() => answer("easy")}><Sparkles size={15} /> Easy</button></div></div> : <div className="review-tip"><Timer size={15} /> No rush — your hearts are unlimited.</div>}</main><div className="review-footer"><span><kbd>Space</kbd> reveal card</span><span><kbd>1</kbd> again &nbsp; <kbd>2</kbd> got it &nbsp; <kbd>3</kbd> easy</span></div></div>;
}

function NewDeckModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  return <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="new-deck-title"><div className="new-deck-modal"><button className="modal-close" onClick={onClose} aria-label="Close new deck dialog"><X size={18} /></button><div className="modal-mascot"><img src={MISO} alt="Miso mascot" /></div><SectionKicker>Start a new study set</SectionKicker><h2 id="new-deck-title">What are you<br /><em>working on?</em></h2><p>Name the deck now. You can add cards when the thought is fresh.</p><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Organic chemistry" onKeyDown={(event) => { if (event.key === "Enter" && name.trim()) onCreate(name.trim()); }} /><button className="button button--dark button--full" disabled={!name.trim()} onClick={() => onCreate(name.trim())}>Create deck <ArrowUpRight size={16} /></button><span className="modal-footnote"><InfinityIcon size={13} /> unlimited hearts, always</span></div></div>;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [selectedDeckId, setSelectedDeckId] = useState("biology");
  const [focusInfoOpen, setFocusInfoOpen] = useState(false);
  const [newDeckOpen, setNewDeckOpen] = useState(false);

  const selectedDeck = useMemo(() => decks.find((deck) => deck.id === selectedDeckId) ?? decks[0], [decks, selectedDeckId]);
  const startReview = (id = "biology") => { setSelectedDeckId(id); setView("review"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const createDeck = (name: string) => { const id = `deck-${Date.now()}`; setDecks((current) => [...current, { id, name, subject: "Personal notes", cards: 0, due: 0, progress: 0, accent: "denim", kind: "new", updated: "Just now" }]); setNewDeckOpen(false); setView("decks"); };

  return <div className="app-shell"><SideRail view={view} setView={setView} /><div className="app-main"><TopBar onFocusClick={() => setFocusInfoOpen((open) => !open)} onStartReview={() => startReview()} />{focusInfoOpen && <div className="focus-popover"><div className="focus-popover__icon"><InfinityIcon size={20} /></div><div><strong>Deep study mode is on.</strong><span>No hearts to count, no cooldown to wait through. Keep going while the idea is alive.</span></div><button onClick={() => setFocusInfoOpen(false)} aria-label="Close focus info"><X size={15} /></button></div>}{view === "home" && <Dashboard decks={decks} onReview={startReview} onViewDecks={() => setView("decks")} onShowFocus={() => setFocusInfoOpen(true)} />}{view === "decks" && <DecksView decks={decks} onReview={startReview} onCreate={() => setNewDeckOpen(true)} />}{view === "insights" && <InsightsView />}{view === "library" && <LibraryView onReview={startReview} />}{view === "review" && selectedDeck && <ReviewView deck={selectedDeck} onExit={() => setView("home")} />}</div>{newDeckOpen && <NewDeckModal onClose={() => setNewDeckOpen(false)} onCreate={createDeck} />}</div>;
}
