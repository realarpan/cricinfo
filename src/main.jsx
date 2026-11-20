import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, CalendarDays,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3,
  CloudSun, Command, ExternalLink, Gauge, Globe2, Menu, Moon, MoreHorizontal,
  Radio, RefreshCw, Search, Settings2, ShieldCheck, Sun, Target, Trophy,
  Waves, Zap
} from "lucide-react";
import "./styles.css";


function shortName(match, i) {
  return match.teamInfo?.[i]?.shortname || match.teams?.[i]?.split(" ").map(x => x[0]).join("").slice(0, 3).toUpperCase() || ["T1", "T2"][i];
}
function scoreText(score) {
  if (!score) return "—";
  return `${score.r}/${score.w}`;
}
function scoreForTeam(match, team, index) {
  const innings = Array.isArray(match.score) ? match.score : [];
  const teamKey = String(team || "").toLowerCase();
  const byInning = innings.find((entry) =>
    entry.inning && teamKey && entry.inning.toLowerCase().includes(teamKey)
  );
  return byInning || innings[index] || null;
}
function App() {
  const [matches, setMatches] = useState([]);
  const [source, setSource] = useState("loading");
  const [apiError, setApiError] = useState("");
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState("commentary");
  const [dark, setDark] = useState(false);
  const [updated, setUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  async function loadScores() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/live");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load scores");
      if (!Array.isArray(payload.matches)) throw new Error("The score service returned an unexpected response.");
      setMatches(payload.matches);
      setSource(payload.matches.length ? (payload.source || "cricketdata") : "empty");
      setApiError(payload.matches.length ? "" : "CricketData has not returned any matches currently in progress.");
      setSelected((current) => Math.min(current, Math.max(0, payload.matches.length - 1)));
      setUpdated(payload.fetchedAt ? new Date(payload.fetchedAt) : new Date());
    } catch (error) {
      setSource("error");
      setApiError(error.message || "Could not connect to the cricket score service.");
      setMatches([]);
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => {
    loadScores();
    const timer = setInterval(loadScores, 900000);
    return () => clearInterval(timer);
  }, []);

  const match = matches[selected] || matches[0] || { id: "no-match", name: "Live scores unavailable", teams: [], score: [], status: apiError || "Waiting for match data" };
  const teamA = match.teams?.[0] || "Team A";
  const teamB = match.teams?.[1] || "Team B";
  const scoreA = scoreForTeam(match, teamA, 0);
  const scoreB = scoreForTeam(match, teamB, 1);
  const currentScore = match.score?.[match.score.length - 1] || scoreA || scoreB;
  const inningsOver = currentScore?.o;
  const runRate = currentScore && Number.isFinite(currentScore.o) && currentScore.o > 0 ? (currentScore.r / currentScore.o).toFixed(2) : "—";
  const isLive = match.isLive === true;
  const titleStatus = match.status || apiError || "Waiting for live match data";

  return <div className={dark ? "app dark" : "app"}>
    <div className="ambient ambient-blue" /><div className="ambient ambient-mint" />
    <header className="topbar">
      <a className="brand" href="#" aria-label="StumpStream home"><span className="brand-mark"><Activity size={18}/></span><span>stump<span className="brand-light">stream</span></span></a>
      <div className="topbar-center">
        <button className="match-select" onClick={() => setShowMatches(!showMatches)}>
          <span className={isLive ? "live-dot" : "muted-dot"} />{match.name}<ChevronDown size={15}/>
        </button>
        {showMatches && <div className="match-menu">{matches.map((m, i) => <button key={m.id} onClick={() => {setSelected(i);setShowMatches(false);}}>{m.name}<span>{m.status}</span></button>)}</div>}
      </div>
      <div className="top-actions">
        <span className="updated-label"><span className="pulse-dot"/>{refreshing ? "Updating" : "Updated " + updated.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
        <button className="icon-button" aria-label="Refresh scores" onClick={loadScores}><RefreshCw size={17} className={refreshing ? "spin" : ""}/></button>
        <button className="icon-button theme-button" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
        <button className="avatar">A</button>
      </div>
      <button className="mobile-toggle icon-button" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={20}/></button>
    </header>

    <main className="shell">
      <div className="page-heading">
        <div><div className="eyebrow"><span className="eyebrow-line"/> MATCH CENTRE <span className="eyebrow-date">/ 20 NOVEMBER 2026</span></div><h1>Cricket, in the moment.</h1><p>Every ball. Every turning point. All in one place.</p></div>
        <div className="heading-actions"><button className="soft-button"><Bell size={15}/> Follow match</button><button className="more-button"><MoreHorizontal size={18}/></button></div>
      </div>

      <section className="hero-card glass">
        <div className="hero-topline"><div className="live-label"><span className="live-dot"/>{isLive ? "LIVE MATCH" : "MATCH CENTRE"}</div><span className="series-label">{match.series || "INTERNATIONAL CRICKET"} <span className="series-sep">·</span> {(match.matchType || "ODI").toUpperCase()}</span><button className="hero-more"><MoreHorizontal size={19}/></button></div>
        <div className="matchup">
          <div className="team-block team-left"><div className="team-emblem india"><span>{shortName(match,0)}</span></div><div><div className="team-name">{teamA}</div><div className="team-sub">HOME TEAM</div></div></div>
          <div className="score-block"><div className="score-main">{scoreA ? scoreText(scoreA) : "—"}</div><div className="score-meta">{scoreA ? `${scoreA.o} overs` : "Yet to bat"}</div></div>
          <div className="versus">VS</div>
          <div className="score-block score-right"><div className="score-main">{scoreB ? scoreText(scoreB) : "—"}</div><div className="score-meta">{scoreB ? `${scoreB.o} overs` : "Yet to bat"}</div></div>
          <div className="team-block team-right"><div><div className="team-name">{teamB}</div><div className="team-sub">AWAY TEAM</div></div><div className="team-emblem australia"><span>{shortName(match,1)}</span></div></div>
        </div>
        <div className="match-status"><span className="status-icon"><Radio size={14}/></span><span>{titleStatus}</span><span className="status-divider"/> <span className="venue"><Globe2 size={13}/>{match.venue || "Venue to be confirmed"}</span></div>
        <div className="hero-bottom">
          <div className="probability"><div className="prob-title"><ShieldCheck size={15}/> VERIFIED SCORE FEED</div><div className="prob-row"><span className="prob-team">SOURCE</span><strong>{source === "cricketdata" && matches.length ? "CricketData" : source === "error" || source === "empty" ? "Unavailable" : "Connecting"}</strong></div><div className="prob-row"><span className="prob-team">MODE</span><strong>Live scores</strong></div></div>
          <div className="over-timeline"><div className="over-heading"><span>LIVE FEED</span><span className="over-number">{isLive ? "ACTIVE" : "STATUS"}</span></div><div className="over-caption">{isLive ? "Live match data" : "No fabricated ball events"}</div></div>
          <div className="quick-stats"><div><span>RUN RATE</span><strong>{runRate}</strong></div><div><span>OVERS</span><strong>{inningsOver == null ? "—" : inningsOver}</strong></div><div><span>FEED</span><strong>{source === "cricketdata" && matches.length ? "LIVE" : "—"}</strong></div></div>
        </div>
        {apiError && <div className="demo-note"><CircleHelp size={13}/> {apiError}</div>}

      </section>

      <div className="content-grid">
        <section className="main-column">
          <div className="tabs glass">
            <button className={tab==="commentary"?"active":""} onClick={()=>setTab("commentary")}><Radio size={15}/> Commentary <span className="tab-live">FEED</span></button>
            <button className={tab==="scorecard"?"active":""} onClick={()=>setTab("scorecard")}><BarChart3 size={15}/> Full scorecard</button>
            <button className={tab==="wickets"?"active":""} onClick={()=>setTab("wickets")}><Zap size={15}/> Fall of wickets</button>
          </div>
          <div className="panel glass">
            {tab==="commentary" && <><div className="panel-header"><div><h2>Ball-by-ball</h2><p>Commentary data supplied by the provider</p></div><button className="filter-button">All events <ChevronDown size={14}/></button></div><div className="innings-strip"><span>2ND INNINGS</span><strong>{teamA}</strong><span className="innings-score">{scoreA ? scoreText(scoreA) : "Yet to bat"}</span></div><div className="empty-data"><Radio size={18}/><strong>Ball-by-ball commentary is not included in the live-score feed.</strong><span>This panel will only show delivery events when the provider supplies them. No sample commentary is presented as live.</span></div></>}
            {tab==="scorecard" && <><div className="panel-header"><div><h2>Full scorecard</h2><p>Detailed batting and bowling data</p></div></div><div className="empty-data"><BarChart3 size={18}/><strong>Detailed scorecards are not available in this live-score response.</strong><span>Only score values returned by the provider are displayed above.</span></div></>}
            {tab==="wickets" && <><div className="panel-header"><div><h2>Fall of wickets</h2><p>Wicket events from the match</p></div></div><div className="empty-data"><Zap size={18}/><strong>Wicket timeline is not present in the current live-score feed.</strong><span>No illustrative wicket events are shown.</span></div></>}
          </div>
        </section>

        <aside className="side-column">
          <section className="side-card glass"><div className="side-heading"><div><span className="side-kicker">DATA QUALITY</span><h3>Live score source</h3></div><span className="side-icon"><ShieldCheck size={17}/></span></div><div className="insight-feature"><div className="insight-icon mint"><ShieldCheck size={17}/></div><div><strong>{source === "cricketdata" && matches.length ? "Live data received" : source === "error" || source === "empty" ? "No live data received" : "Connecting to provider"}</strong><p>The status reflects whether the provider has returned a live match.</p></div></div><div className="insight-footer"><span><span className="tiny-green"/> No generated score values</span><span>{refreshing ? "Refreshing" : "Auto refresh: 15 min"}</span></div></section>
          <section className="side-card glass pitch-card"><div className="side-heading"><div><span className="side-kicker">PROVIDER</span><h3>Data attribution</h3></div><span className="side-icon"><Globe2 size={17}/></span></div><div className="pitch-legend"><div><strong>CricketData API</strong></div><p>Live score data is provided by CricketData. Availability and refresh frequency depend on the provider service.</p></div><div className="weather-line"><ShieldCheck size={15}/><span>API key protected server-side</span></div></section>
          <section className="side-card glass fixtures-card"><div className="side-heading"><div><span className="side-kicker">MATCH CENTRE</span><h3>Available matches</h3></div></div><div className="fixtures-list">{matches.length ? matches.map((item) => <div className="fixture" key={item.id}><div className="fixture-date"><strong>{item.matchType.toUpperCase()}</strong><span>{item.isLive ? "LIVE" : "MATCH"}</span></div><div className="fixture-info"><strong>{item.name}</strong><span>{item.status}</span></div><ChevronRight size={15}/></div>) : <div className="empty-data compact"><strong>No live matches right now</strong><span>CricketData has not returned a match currently in progress.</span></div>}</div></section>
        </aside>
      </div>
      <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><Activity size={15}/></span><span>stump<span className="brand-light">stream</span></span></a><span>Made for the love of the game.</span><div><a href="https://cricketdata.org/" target="_blank" rel="noreferrer">CricketData source <ExternalLink size={11}/></a><span>© 2026 StumpStream</span></div></footer>
    </main>
  </div>;
}
function TrendingIcon(){return <ArrowUpRight size={17}/>;}
createRoot(document.getElementById("root")).render(<App/>);