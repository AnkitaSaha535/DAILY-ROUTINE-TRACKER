import { useState, useEffect, useCallback } from "react";

// ─── DEMO DATA SEED ──────────────────────────────────────────────────────────
const today = new Date();
const fmt = (d) => d.toISOString().split("T")[0];
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

const HABITS_SEED = [
  { id: "h1", name: "Morning Meditation", icon: "🧘", color: "#a78bfa", createdAt: daysAgo(20) },
  { id: "h2", name: "Read 20 Pages", icon: "📖", color: "#34d399", createdAt: daysAgo(20) },
  { id: "h3", name: "Exercise", icon: "🏃", color: "#f97316", createdAt: daysAgo(20) },
  { id: "h4", name: "No Sugar", icon: "🍎", color: "#f43f5e", createdAt: daysAgo(20) },
  { id: "h5", name: "Journal Entry", icon: "✍️", color: "#60a5fa", createdAt: daysAgo(20) },
];

// Completions: [habitId, date]
const COMPLETIONS_SEED = (() => {
  const c = [];
  const patterns = {
    h1: [0,1,2,3,4,5,6,7,8,9,10,11,13,14,15,16],
    h2: [0,1,2,4,5,6,7,8,9,10,12,13,14,15,16],
    h3: [0,1,3,4,5,6,7,9,10,11,12,13,14,16],
    h4: [0,1,2,3,5,6,7,8,9,11,12,13,14,15,16],
    h5: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
  };
  for (const [hid, days] of Object.entries(patterns)) {
    for (const d of days) c.push({ habitId: hid, date: daysAgo(d) });
  }
  return c;
})();

const JOURNAL_SEED = [
  { id: "j1", date: daysAgo(16), title: "A fresh start", body: "Decided to commit to a real routine today. Woke up at 6am and meditated for 10 minutes. The silence was profound — I noticed how rarely I give myself that stillness. Read the first chapter of Atomic Habits. The concept of identity-based habits clicked immediately. I am not trying to run a marathon, I am becoming a runner.", updatedAt: daysAgo(16) },
  { id: "j2", date: daysAgo(15), title: "Resistance", body: "Skipped exercise today. Found every excuse imaginable. But I did meditate and read, so not a total loss. Journalling about it helps me see the pattern — I tend to skip physical effort when I'm anxious. Something to work on. The book says 'never miss twice', so tomorrow I'm back on track.", updatedAt: daysAgo(15) },
  { id: "j3", date: daysAgo(14), title: "Back on track", body: "Did a 30-minute run this morning. The first five minutes were miserable, then something shifted and it felt effortless. Meditated after. Finished chapter three of the book — the habit loop (cue, craving, response, reward) is such a clean framework. Starting to see it everywhere in my life. Ate clean all day too. Feeling genuinely optimistic.", updatedAt: daysAgo(14) },
  { id: "j4", date: daysAgo(13), title: "Small wins compound", body: "Seven days in. All five habits checked. It doesn't feel like effort anymore — it feels like who I am on a Tuesday. I made a deal with myself: no phone until after meditation and reading. That single rule changed my entire morning architecture.", updatedAt: daysAgo(13) },
  { id: "j5", date: daysAgo(12), title: "Slept in, adjusted", body: "Slept until 8 — didn't beat myself up. Did a shorter meditation (5 min), quick 15-min workout, still read. Flexibility within structure. The goal is not perfection, it's consistency. Skipped the no-sugar habit at a birthday dinner. Worth it.", updatedAt: daysAgo(12) },
  { id: "j6", date: daysAgo(11), title: "Deep focus day", body: "Got into a flow state around 10am that lasted three hours. I think the meditation habit is genuinely affecting my concentration. Read 40 pages today instead of 20. Can't stop thinking about the idea that we don't rise to the level of our goals, we fall to the level of our systems.", updatedAt: daysAgo(11) },
  { id: "j7", date: daysAgo(10), title: "Social evening", body: "Had dinner with old friends. Good conversation. Resisted dessert (technically). Made it home late but still did a five-minute body scan meditation before bed. The streak matters to me now. That's new.", updatedAt: daysAgo(10) },
  { id: "j8", date: daysAgo(9), title: "Reflection: week two", body: "Two weeks of data. Meditation: 13/14 days. Reading: 12/14. Exercise: 11/14. No sugar: 12/14. I'm averaging 86% across all habits. That is extraordinary for me. The visual streaks are genuinely motivating — there's a psychological pull to not break the chain.", updatedAt: daysAgo(9) },
  { id: "j9", date: daysAgo(7), title: "Morning pages experiment", body: "Tried writing three pages longhand before my digital journal entry. Stream of consciousness. Surfaced some fears I hadn't consciously acknowledged about a work project. The body knows before the mind admits. Exercise was a yoga session today — different energy but counts.", updatedAt: daysAgo(7) },
  { id: "j10", date: daysAgo(5), title: "Productivity peak", body: "Most productive day in months. I attribute it entirely to the morning stack: meditation → reading → exercise → breakfast. The sequence matters. Each one primes the next. No sugar today was easy because I'd already made 'good' choices all morning — the momentum carried me.", updatedAt: daysAgo(5) },
  { id: "j11", date: daysAgo(3), title: "The identity shift", body: "Someone at work asked if I wanted a doughnut and I said 'no thanks, I don't eat sugar.' Not 'I'm trying to avoid sugar' — I said I *don't*. That's an identity statement. I didn't plan it. It just came out. Something has genuinely shifted in how I see myself.", updatedAt: daysAgo(3) },
  { id: "j12", date: daysAgo(1), title: "Evening check-in", body: "Completed everything today. Meditation felt particularly deep — got to a place of real quiet. Read about stoicism and the dichotomy of control. Journalling is the thread that holds the whole system together. It's where I process, notice, and recommit. Grateful for this practice.", updatedAt: daysAgo(1) },
  { id: "j13", date: fmt(today), title: "Today", body: "Starting today's entry. The morning stack is becoming automatic — I barely decide to do it, I just find myself doing it. That's the dream, isn't it? Virtue becomes habit becomes character.", updatedAt: fmt(today) },
];

// ─── STREAK LOGIC ─────────────────────────────────────────────────────────────
function computeStreaks(habitId, completions) {
  const dates = completions
    .filter((c) => c.habitId === habitId)
    .map((c) => c.date)
    .sort();
  if (!dates.length) return { current: 0, longest: 0 };

  const todayStr = fmt(today);
  const yesterdayStr = daysAgo(1);

  let longest = 1, cur = 1, maxStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; longest = Math.max(longest, cur); }
    else cur = 1;
  }

  // Current streak: must include today or yesterday
  const lastDate = dates[dates.length - 1];
  let currentStreak = 0;
  if (lastDate === todayStr || lastDate === yesterdayStr) {
    currentStreak = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      const next = new Date(dates[i + 1]);
      const curr = new Date(dates[i]);
      if ((next - curr) / 86400000 === 1) currentStreak++;
      else break;
    }
  }

  return { current: currentStreak, longest: Math.max(longest, currentStreak) };
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    flame: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c0 0-7 6-7 12a7 7 0 0 0 14 0c0-6-7-12-7-12zm0 18a5 5 0 0 1-5-5c0-3.5 3-7.5 5-9.5 2 2 5 6 5 9.5a5 5 0 0 1-5 5z"/></svg>,
    book: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    save: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  };
  return icons[name] || null;
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function DailyRoutine() {
  const [tab, setTab] = useState("today");
  const [habits, setHabits] = useState(HABITS_SEED);
  const [completions, setCompletions] = useState(COMPLETIONS_SEED);
  const [journals, setJournals] = useState(JOURNAL_SEED);
  const [editingJournal, setEditingJournal] = useState(null);
  const [newHabitModal, setNewHabitModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", icon: "⭐", color: "#a78bfa" });
  const [selectedCalDate, setSelectedCalDate] = useState(fmt(today));
  const [calOffset, setCalOffset] = useState(0);

  const todayStr = fmt(today);

  // Toggle habit completion for today
  const toggleHabit = (habitId) => {
    const existing = completions.find(c => c.habitId === habitId && c.date === todayStr);
    if (existing) setCompletions(prev => prev.filter(c => !(c.habitId === habitId && c.date === todayStr)));
    else setCompletions(prev => [...prev, { habitId, date: todayStr }]);
  };

  const isCompleted = (habitId, date = todayStr) =>
    completions.some(c => c.habitId === habitId && c.date === date);

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    setHabits(prev => [...prev, { id: `h${Date.now()}`, ...newHabit, createdAt: todayStr }]);
    setNewHabit({ name: "", icon: "⭐", color: "#a78bfa" });
    setNewHabitModal(false);
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setCompletions(prev => prev.filter(c => c.habitId !== id));
  };

  // Journal helpers
  const todayJournal = journals.find(j => j.date === todayStr);

  const saveJournal = (entry) => {
    setJournals(prev => {
      const existing = prev.find(j => j.id === entry.id);
      if (existing) return prev.map(j => j.id === entry.id ? { ...entry, updatedAt: todayStr } : j);
      return [...prev, { ...entry, updatedAt: todayStr }];
    });
    setEditingJournal(null);
  };

  // Calendar helpers
  const getCalendarMonth = () => {
    const d = new Date(today);
    d.setDate(1);
    d.setMonth(d.getMonth() + calOffset);
    return d;
  };

  const calMonth = getCalendarMonth();
  const calDays = (() => {
    const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
    const last = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
    const days = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const date = fmt(new Date(calMonth.getFullYear(), calMonth.getMonth(), d));
      days.push(date);
    }
    return days;
  })();

  const getCompletionRate = (date) => {
    if (!habits.length) return 0;
    const done = habits.filter(h => isCompleted(h.id, date)).length;
    return done / habits.length;
  };

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  // Styles
  const S = {
    app: { fontFamily: "'DM Serif Display', Georgia, serif", background: "#0d0d0f", minHeight: "100vh", color: "#f0ede8", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", position: "relative" },
    header: { padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" },
    logo: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "#f0ede8" },
    logoSpan: { color: "#c9b99a" },
    dateChip: { fontSize: 11, fontFamily: "'DM Mono', monospace", background: "#1a1a1f", padding: "6px 12px", borderRadius: 20, color: "#7a7870", letterSpacing: "0.5px", textTransform: "uppercase" },
    nav: { display: "flex", gap: 0, background: "#141418", borderRadius: 16, margin: "16px 20px", padding: 4, position: "sticky", top: 8, zIndex: 10 },
    navBtn: (active) => ({ flex: 1, padding: "10px 0", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.5px", textTransform: "uppercase", transition: "all 0.2s", background: active ? "#c9b99a" : "transparent", color: active ? "#0d0d0f" : "#5a5850", fontWeight: active ? "700" : "400" }),
    section: { padding: "0 20px 100px" },
    card: { background: "#141418", borderRadius: 16, padding: "18px 20px", marginBottom: 12, border: "1px solid #1f1f25" },
    habitRow: (done) => ({ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: done ? "#1a1f1a" : "#141418", borderRadius: 14, marginBottom: 10, border: `1px solid ${done ? "#2a3a2a" : "#1f1f25"}`, transition: "all 0.25s", cursor: "pointer" }),
    habitCheck: (done, color) => ({ width: 28, height: 28, borderRadius: 8, border: `2px solid ${done ? color : "#2a2a35"}`, background: done ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", color: "#fff" }),
    habitName: (done) => ({ flex: 1, fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: done ? "#7a8a7a" : "#e0ddd8", textDecoration: done ? "line-through" : "none", letterSpacing: "-0.2px" }),
    streakBadge: (color) => ({ fontSize: 11, fontFamily: "'DM Mono', monospace", color: color, background: `${color}18`, padding: "3px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }),
    label: { fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#4a4840", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12, display: "block" },
    sectionTitle: { fontSize: 22, fontWeight: 700, color: "#f0ede8", marginBottom: 4, letterSpacing: "-0.5px" },
    subTitle: { fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#5a5850", marginBottom: 20 },
    btn: (variant = "primary") => ({ border: "none", borderRadius: 12, padding: variant === "primary" ? "14px 20px" : "10px 16px", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "-0.2px", background: variant === "primary" ? "#c9b99a" : "#1f1f25", color: variant === "primary" ? "#0d0d0f" : "#a0a898", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }),
    textarea: { width: "100%", background: "#0d0d0f", border: "1px solid #2a2a35", borderRadius: 12, padding: 16, color: "#f0ede8", fontSize: 15, fontFamily: "'DM Serif Display', Georgia, serif", lineHeight: 1.7, resize: "none", outline: "none", boxSizing: "border-box", minHeight: 220 },
    input: { width: "100%", background: "#0d0d0f", border: "1px solid #2a2a35", borderRadius: 12, padding: "12px 16px", color: "#f0ede8", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" },
    modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", zIndex: 100, backdropFilter: "blur(4px)" },
    modalBox: { background: "#141418", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", width: "100%", maxWidth: 480, margin: "0 auto", border: "1px solid #1f1f25", borderBottom: "none" },
    statGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 },
    statCard: (color) => ({ background: "#141418", borderRadius: 14, padding: "16px 18px", border: "1px solid #1f1f25" }),
    statNum: (color) => ({ fontSize: 32, fontWeight: 700, color: color, letterSpacing: "-1px", lineHeight: 1 }),
    statLabel: { fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#4a4840", letterSpacing: "1px", textTransform: "uppercase", marginTop: 4 },
    calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 12 },
    calDay: (rate, isSelected, isToday, isFuture) => ({
      aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: isFuture ? "default" : "pointer",
      border: isToday ? "2px solid #c9b99a" : "2px solid transparent",
      background: isSelected ? "#c9b99a22" : isFuture ? "transparent" : rate > 0.75 ? "#1a3a1a" : rate > 0.4 ? "#1a2a1a" : rate > 0 ? "#1f2518" : "#141418",
      color: isSelected ? "#c9b99a" : isFuture ? "#2a2a30" : rate > 0.5 ? "#4a7a4a" : "#4a4840",
      fontWeight: isSelected || isToday ? "700" : "400",
      transition: "all 0.15s",
    }),
    journalEntry: { background: "#141418", borderRadius: 16, padding: "18px 20px", marginBottom: 12, border: "1px solid #1f1f25", cursor: "pointer" },
    journalDate: { fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#4a4840", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 },
    journalTitle: { fontSize: 17, fontWeight: 700, color: "#e0ddd8", letterSpacing: "-0.3px", marginBottom: 6 },
    journalPreview: { fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#5a5850", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
    progressBar: (pct, color) => ({ height: 3, background: "#1f1f25", borderRadius: 2, overflow: "hidden", marginTop: 8, position: "relative" }),
  };

  // ── TODAY VIEW ──────────────────────────────────────────────────────────────
  const TodayView = () => {
    const doneCount = habits.filter(h => isCompleted(h.id)).length;
    const pct = habits.length ? doneCount / habits.length : 0;
    const weekDays = Array.from({length: 7}, (_, i) => daysAgo(6 - i));
    const dayLabels = ["Su","Mo","Tu","We","Th","Fr","Sa"];

    return (
      <div style={S.section}>
        <div style={{ marginBottom: 24 }}>
          <div style={S.sectionTitle}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} ✦</div>
          <div style={S.subTitle}>{doneCount} of {habits.length} habits complete today</div>
          
          {/* Progress bar */}
          <div style={{ height: 6, background: "#1f1f25", borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${pct * 100}%`, background: "linear-gradient(90deg, #c9b99a, #a78bfa)", borderRadius: 3, transition: "width 0.4s ease" }} />
          </div>

          {/* Week mini view */}
          <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
            {weekDays.map((d, i) => {
              const rate = getCompletionRate(d);
              const isT = d === todayStr;
              return (
                <div key={d} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: isT ? "#c9b99a" : "#3a3830", letterSpacing: "0.5px", marginBottom: 4 }}>
                    {dayLabels[new Date(d + "T12:00:00").getDay()]}
                  </div>
                  <div style={{ height: 32, borderRadius: 6, background: isT ? "#c9b99a22" : rate > 0.7 ? "#1a3a1a" : rate > 0.3 ? "#1a2a1a" : "#141418", border: isT ? "1px solid #c9b99a44" : "1px solid #1f1f25", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: isT ? "#c9b99a" : rate > 0.7 ? "#4a9a4a" : rate > 0.3 ? "#3a6a3a" : "#2a2a30" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <span style={S.label}>Habits</span>
        {habits.map(h => {
          const done = isCompleted(h.id);
          const { current } = computeStreaks(h.id, completions);
          return (
            <div key={h.id} style={S.habitRow(done)} onClick={() => toggleHabit(h.id)}>
              <div style={S.habitCheck(done, h.color)}>
                {done && <Icon name="check" size={14} />}
              </div>
              <span style={{ fontSize: 18 }}>{h.icon}</span>
              <span style={S.habitName(done)}>{h.name}</span>
              {current > 0 && (
                <div style={S.streakBadge(h.color)}>
                  <Icon name="flame" size={10} />
                  {current}
                </div>
              )}
            </div>
          );
        })}

        <button style={{ ...S.btn("secondary"), width: "100%", justifyContent: "center", marginTop: 4, marginBottom: 24 }}
          onClick={() => setNewHabitModal(true)}>
          <Icon name="plus" size={15} /> New Habit
        </button>

        {/* Today's Journal */}
        <span style={S.label}>Today's Entry</span>
        {todayJournal ? (
          <div style={S.journalEntry} onClick={() => setEditingJournal(todayJournal)}>
            <div style={S.journalTitle}>{todayJournal.title}</div>
            <div style={S.journalPreview}>{todayJournal.body}</div>
          </div>
        ) : (
          <div style={{ ...S.card, textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✍️</div>
            <div style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#4a4840", marginBottom: 16 }}>No entry yet — capture today</div>
            <button style={{ ...S.btn("primary"), margin: "0 auto" }}
              onClick={() => setEditingJournal({ id: `j${Date.now()}`, date: todayStr, title: "", body: "", updatedAt: todayStr })}>
              Write entry
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── HABITS DASHBOARD ────────────────────────────────────────────────────────
  const HabitsView = () => (
    <div style={S.section}>
      <div style={S.sectionTitle}>Habits</div>
      <div style={S.subTitle}>{habits.length} active · tap to manage</div>

      <div style={S.statGrid}>
        <div style={S.statCard()}>
          <div style={S.statNum("#c9b99a")}>{habits.filter(h => computeStreaks(h.id, completions).current > 0).length}</div>
          <div style={S.statLabel}>Active Streaks</div>
        </div>
        <div style={S.statCard()}>
          <div style={S.statNum("#a78bfa")}>{Math.round(habits.reduce((acc, h) => {
            const last7 = Array.from({length:7},(_,i)=>daysAgo(i));
            return acc + last7.filter(d => isCompleted(h.id, d)).length;
          }, 0) / (habits.length * 7) * 100) || 0}%</div>
          <div style={S.statLabel}>7-Day Rate</div>
        </div>
        <div style={S.statCard()}>
          <div style={S.statNum("#34d399")}>{Math.max(...habits.map(h => computeStreaks(h.id, completions).longest), 0)}</div>
          <div style={S.statLabel}>Best Streak</div>
        </div>
        <div style={S.statCard()}>
          <div style={S.statNum("#f97316")}>{completions.filter(c => c.date === todayStr).length}/{habits.length}</div>
          <div style={S.statLabel}>Done Today</div>
        </div>
      </div>

      {habits.map(h => {
        const { current, longest } = computeStreaks(h.id, completions);
        const last14 = Array.from({length:14},(_,i)=>daysAgo(13-i));
        return (
          <div key={h.id} style={{ ...S.card, borderLeft: `3px solid ${h.color}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{h.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>{h.name}</div>
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#4a4840", marginTop: 1 }}>since {h.createdAt}</div>
                </div>
              </div>
              <button style={{ background: "transparent", border: "none", cursor: "pointer", color: "#3a3830", padding: 4 }} onClick={() => deleteHabit(h.id)}>
                <Icon name="trash" size={14} />
              </button>
            </div>

            {/* 14-day mini grid */}
            <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
              {last14.map(d => (
                <div key={d} style={{ flex: 1, height: 20, borderRadius: 3, background: isCompleted(h.id, d) ? h.color : "#1f1f25", opacity: isCompleted(h.id, d) ? 0.85 : 1, transition: "background 0.2s" }} title={d} />
              ))}
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: h.color }}>{current}</div>
                <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: "#4a4840", letterSpacing: "1px" }}>CURRENT</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#5a5850" }}>{longest}</div>
                <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: "#4a4840", letterSpacing: "1px" }}>LONGEST</div>
              </div>
            </div>
          </div>
        );
      })}

      <button style={{ ...S.btn("secondary"), width: "100%", justifyContent: "center", marginTop: 4 }} onClick={() => setNewHabitModal(true)}>
        <Icon name="plus" size={15} /> Add Habit
      </button>
    </div>
  );

  // ── JOURNAL VIEW ─────────────────────────────────────────────────────────────
  const JournalView = () => {
    const sorted = [...journals].sort((a, b) => b.date.localeCompare(a.date));
    return (
      <div style={S.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={S.sectionTitle}>Journal</div>
            <div style={S.subTitle}>{journals.length} entries</div>
          </div>
          <button style={S.btn("primary")} onClick={() => {
            const existing = journals.find(j => j.date === todayStr);
            setEditingJournal(existing || { id: `j${Date.now()}`, date: todayStr, title: "", body: "", updatedAt: todayStr });
            setTab("journal");
          }}>
            <Icon name="plus" size={14} /> Today
          </button>
        </div>

        {sorted.map(entry => {
          const d = new Date(entry.date + "T12:00:00");
          const label = entry.date === todayStr ? "Today" : entry.date === daysAgo(1) ? "Yesterday" : d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
          const habitsForDay = habits.filter(h => isCompleted(h.id, entry.date));
          return (
            <div key={entry.id} style={S.journalEntry} onClick={() => setEditingJournal(entry)}>
              <div style={S.journalDate}>{label}</div>
              <div style={S.journalTitle}>{entry.title || "Untitled"}</div>
              <div style={S.journalPreview}>{entry.body}</div>
              {habitsForDay.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                  {habitsForDay.map(h => (
                    <span key={h.id} style={{ fontSize: 12, background: `${h.color}15`, color: h.color, padding: "2px 8px", borderRadius: 6, fontFamily: "'DM Mono', monospace" }}>{h.icon} {h.name}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── HISTORY VIEW ─────────────────────────────────────────────────────────────
  const HistoryView = () => {
    const calJournal = journals.find(j => j.date === selectedCalDate);
    const calHabits = habits.filter(h => isCompleted(h.id, selectedCalDate));
    const isFutureDate = (d) => d > todayStr;

    return (
      <div style={S.section}>
        <div style={S.sectionTitle}>History</div>
        <div style={S.subTitle}>Tap a day to explore</div>

        {/* Calendar nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button style={{ ...S.btn("secondary"), padding: "8px 14px" }} onClick={() => setCalOffset(o => o - 1)}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>
            {monthNames[calMonth.getMonth()]} {calMonth.getFullYear()}
          </div>
          <button style={{ ...S.btn("secondary"), padding: "8px 14px" }} onClick={() => setCalOffset(o => Math.min(o + 1, 0))}>→</button>
        </div>

        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 9, fontFamily: "'DM Mono', monospace", color: "#3a3830", padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={S.calGrid}>
          {calDays.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const rate = getCompletionRate(d);
            const future = isFutureDate(d);
            return (
              <div key={d} style={S.calDay(rate, d === selectedCalDate, d === todayStr, future)}
                onClick={() => !future && setSelectedCalDate(d)}>
                {new Date(d + "T12:00:00").getDate()}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginTop: 12, marginBottom: 24 }}>
          {[["None", "#141418"], ["Partial", "#1a2a1a"], ["Good", "#1a3a1a"]].map(([l, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c, border: "1px solid #2a2a30" }} />
              <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#3a3830" }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Selected day detail */}
        <span style={S.label}>{selectedCalDate === todayStr ? "Today" : selectedCalDate}</span>

        {calHabits.length > 0 && (
          <div style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#4a4840", marginBottom: 10, letterSpacing: "1px" }}>COMPLETED HABITS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {habits.map(h => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: isCompleted(h.id, selectedCalDate) ? `${h.color}15` : "#1f1f25", border: `1px solid ${isCompleted(h.id, selectedCalDate) ? `${h.color}30` : "transparent"}` }}>
                  <span style={{ fontSize: 14 }}>{h.icon}</span>
                  <span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: isCompleted(h.id, selectedCalDate) ? h.color : "#3a3830" }}>{h.name}</span>
                  {isCompleted(h.id, selectedCalDate) && <Icon name="check" size={10} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {calJournal ? (
          <div style={S.journalEntry} onClick={() => setEditingJournal(calJournal)}>
            <div style={S.journalDate}>Journal entry</div>
            <div style={S.journalTitle}>{calJournal.title}</div>
            <div style={S.journalPreview}>{calJournal.body}</div>
          </div>
        ) : (
          <div style={{ ...S.card, textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#3a3830" }}>No journal entry for this day</div>
          </div>
        )}
      </div>
    );
  };

  // ── JOURNAL EDITOR ───────────────────────────────────────────────────────────
  const JournalEditor = ({ entry }) => {
    const [title, setTitle] = useState(entry.title);
    const [body, setBody] = useState(entry.body);
    return (
      <div style={{ ...S.section, paddingTop: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button style={{ ...S.btn("secondary"), padding: "8px 14px" }} onClick={() => setEditingJournal(null)}>
            ← Back
          </button>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#4a4840", letterSpacing: "1px" }}>{entry.date}</div>
          <button style={{ ...S.btn("primary"), padding: "8px 16px" }} onClick={() => saveJournal({ ...entry, title, body })}>
            <Icon name="save" size={14} /> Save
          </button>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Entry title..."
          style={{ ...S.input, marginBottom: 12, fontSize: 18, fontFamily: "'DM Serif Display', Georgia, serif", fontWeight: 700, letterSpacing: "-0.5px" }} />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="What happened today? How are you feeling? What did you learn?"
          style={{ ...S.textarea, height: 400 }} />
        <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#3a3830", marginTop: 8, textAlign: "right" }}>
          {body.split(/\s+/).filter(Boolean).length} words
        </div>
      </div>
    );
  };

  const EMOJI_OPTIONS = ["⭐","💪","🧘","📖","🏃","🍎","💧","🌙","🎯","✍️","🎵","🌿","💊","🧠","❤️","🔥"];
  const COLOR_OPTIONS = ["#a78bfa","#34d399","#f97316","#f43f5e","#60a5fa","#fbbf24","#e879f9","#2dd4bf"];

  return (
    <div style={S.app}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        textarea::placeholder, input::placeholder { color: #3a3830; }
      `}</style>

      {!editingJournal && (
        <div style={S.header}>
          <div style={S.logo}>Daily<span style={S.logoSpan}>Routine</span></div>
          <div style={S.dateChip}>{today.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
        </div>
      )}

      {!editingJournal && (
        <div style={S.nav}>
          {[["today","Today","home"],["habits","Habits","flame"],["journal","Journal","book"],["history","History","calendar"]].map(([id,label,icon]) => (
            <button key={id} style={S.navBtn(tab === id)} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      )}

      {editingJournal ? (
        <JournalEditor entry={editingJournal} />
      ) : tab === "today" ? <TodayView />
        : tab === "habits" ? <HabitsView />
        : tab === "journal" ? <JournalView />
        : <HistoryView />}

      {/* New Habit Modal */}
      {newHabitModal && (
        <div style={S.modal} onClick={(e) => e.target === e.currentTarget && setNewHabitModal(false)}>
          <div style={S.modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>New Habit</div>
              <button style={{ background: "transparent", border: "none", cursor: "pointer", color: "#5a5850" }} onClick={() => setNewHabitModal(false)}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <input value={newHabit.name} onChange={e => setNewHabit(p => ({...p, name: e.target.value}))}
              placeholder="Habit name (e.g. Drink 2L water)"
              style={{ ...S.input, marginBottom: 16 }} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#4a4840", letterSpacing: "1px", marginBottom: 8 }}>ICON</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} style={{ background: newHabit.icon === e ? "#2a2a35" : "transparent", border: newHabit.icon === e ? "1px solid #3a3a45" : "1px solid #1f1f25", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 18 }}
                    onClick={() => setNewHabit(p => ({...p, icon: e}))}>{e}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#4a4840", letterSpacing: "1px", marginBottom: 8 }}>COLOR</div>
              <div style={{ display: "flex", gap: 8 }}>
                {COLOR_OPTIONS.map(c => (
                  <button key={c} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: newHabit.color === c ? "3px solid #f0ede8" : "3px solid transparent", cursor: "pointer" }}
                    onClick={() => setNewHabit(p => ({...p, color: c}))} />
                ))}
              </div>
            </div>

            <button style={{ ...S.btn("primary"), width: "100%", justifyContent: "center" }} onClick={addHabit}>
              Create Habit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
