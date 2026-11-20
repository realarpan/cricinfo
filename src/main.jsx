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

const demo = {
  source: "demo",
  matches: [{
    id: "demo-ind-aus", name: "India vs Australia, 2nd ODI", matchType: "odi",
    status: "India need 42 runs from 36 balls", venue: "Narendra Modi Stadium, Ahmedabad",
    teams: ["India", "Australia"], score: [{ r: 258, w: 5, o: 44 }, { r: 301, w: 8, o: 50 }],
    teamInfo: [{ shortname: "IND" }, { shortname: "AUS" }], isLive: true,
    series: "Australia tour of India"
  }]
};
const fallbackCommentary = [
  { over: "44.0", text: "A quiet start to the over. The field is spread and the asking rate is climbing.", runs: "0", kind: "dot" },
  { over: "43.5", text: "FOUR! Driven firmly through extra cover. Excellent placement into the gap.", runs: "4", kind: "four" },
  { over: "43.4", text: "Single taken to deep mid-wicket. Keeps the strike rotating.", runs: "1", kind: "run" },
  { over: "43.3", text: "A slower delivery outside off, safely defended into the off side.", runs: "0", kind: "dot" },
  { over: "43.2", text: "Two runs. Good running between the wickets.", runs: "2", kind: "run" },
  { over: "43.1", text: "WIDE. Sprayed down the leg side. Extra run added.", runs: "Wd", kind: "wide" }
];
const fixtures = [
  { day: "TODAY", date: "20 Nov", teams: "South Africa vs England", format: "1st T20I", time: "6:30 PM" },
  { day: "SAT, 22 NOV", date: "22 Nov", teams: "India vs Australia", format: "3rd ODI", time: "1:30 PM" },
  { day: "SUN, 23 NOV", date: "23 Nov", teams: "New Zealand vs Sri Lanka", format: "2nd Test", time: "3:30 AM" }
];

function shortName(match, i) {
  return match.teamInfo?.[i]?.shortname || match.teams?.[i]?.split(" ").map(x => x[0]).join("").slice(0, 3).toUpperCase() || ["T1", "T2"][i];
}
function scoreText(score) {
  if (!score) return "—";
  return `${score.r}/${score.w}`;
}
function App() {
  const [matches, setMatches] = useState(demo.matches);
  const [source, setSource] = useState("demo");
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
      if (Array.isArray(payload.matches) && payload.matches.length) {
        setMatches(payload.matches);
        setSource(payload.source || "demo");
        setSelected((current) => Math.min(current, payload.matches.length - 1));
      }
      setUpdated(new Date());
    } catch {
      setSource("demo");
      setMatches(demo.matches);
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => {
    loadScores();
    const timer = setInterval(loadScores, 30000);
    return () => clearInterval(timer);
  }, []);

  const match = matches[selected] || matches[0] || demo.matches[0];
  const teamA = match.teams?.[0] || "Team A";
  const teamB = match.teams?.[1] || "Team B";
  const scoreA = match.score?.[0];
  const scoreB = match.score?.[1];
  const currentScore = scoreA || scoreB;
  const inningsOver = currentScore?.o ?? 44;
  const runRate = currentScore && currentScore.o ? (currentScore.r / currentScore.o).toFixed(2) : "5.86";
  const isLive = match.isLive !== false;
  const isDemo = source !== "cricketdata";
  const overs = ["1", "2", "3", "4", "5", "6"];
  const ballResults = ["1", "0", "4", "1", "W", "2"];
  const titleStatus = match.status || "Match information updating";
  const commentary = fallbackCommentary;

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
          <div className="probability"><div className="prob-title"><Target size={15}/> WIN PROBABILITY <span className="info-dot">i</span></div><div className="prob-row"><span className="prob-team">IND</span><div className="prob-track"><span style={{width:"64%"}}/></div><strong>64%</strong></div><div className="prob-row"><span className="prob-team">AUS</span><div className="prob-track prob-track-alt"><span style={{width:"36%"}}/></div><strong>36%</strong></div></div>
          <div className="over-timeline"><div className="over-heading"><span>LAST OVER</span><span className="over-number">43.6 <ChevronDown size={12}/></span></div><div className="balls">{ballResults.map((b,i)=><span key={i} className={`ball ${b==="W"?"ball-wicket":b==="4"?"ball-four":b==="0"?"ball-dot":""}`}>{b}</span>)}</div><div className="over-caption">8 RUNS <span>·</span> 1 WICKET</div></div>
          <div className="quick-stats"><div><span>RUN RATE</span><strong>{runRate}</strong></div><div><span>OVERS</span><strong>{inningsOver}.0</strong></div><div><span>REQUIRED</span><strong>7.00</strong></div></div>
        </div>
        {isDemo && <div className="demo-note"><CircleHelp size={13}/> Preview data · Connect a CricketData API key in Vercel to show live provider scores.</div>}
      </section>

      <div className="content-grid">
        <section className="main-column">
          <div className="tabs glass">
            <button className={tab==="commentary"?"active":""} onClick={()=>setTab("commentary")}><Radio size={15}/> Commentary <span className="tab-live">LIVE</span></button>
            <button className={tab==="scorecard"?"active":""} onClick={()=>setTab("scorecard")}><BarChart3 size={15}/> Full scorecard</button>
            <button className={tab==="wickets"?"active":""} onClick={()=>setTab("wickets")}><Zap size={15}/> Fall of wickets</button>
          </div>
          <div className="panel glass">
            {tab==="commentary" && <><div className="panel-header"><div><h2>Ball-by-ball</h2><p>Live match commentary and key moments</p></div><button className="filter-button">All events <ChevronDown size={14}/></button></div><div className="innings-strip"><span>2ND INNINGS</span><strong>{teamA}</strong><span className="innings-score">{scoreA ? scoreText(scoreA) : "Yet to bat"}</span></div><div className="commentary-list">{commentary.map((item,i)=><div className="commentary-item" key={item.over}><span className="commentary-over">{item.over}</span><span className={`event-ball ${item.kind}`}>{item.runs}</span><p>{item.text}</p>{i===1&&<span className="highlight-tag">BOUNDARY</span>}</div>)}</div><button className="load-more">Load earlier commentary <ChevronDown size={14}/></button></>}
            {tab==="scorecard" && <><div className="panel-header"><div><h2>Full scorecard</h2><p>Batting and bowling figures</p></div><span className="innings-chip">INNINGS 2</span></div><div className="scorecard-title">{teamA} batting <span>{scoreA ? scoreText(scoreA) : "—"}</span></div><div className="score-table"><div className="score-table-head"><span>BATTER</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span></div>{["R Sharma","S Gill","V Kohli","S Iyer","KL Rahul"].map((n,i)=><div className="score-table-row" key={n}><span><b>{n}</b><small>{["c Smith b Starc","lbw b Hazlewood","not out","c Carey b Zampa","not out"][i]}</small></span><strong>{[72,38,64,21,42][i]}</strong><span>{[81,44,71,25,38][i]}</span><span>{[6,4,5,2,3][i]}</span><span>{[1,0,2,0,1][i]}</span><span>{[88.89,86.36,90.14,84,110.52][i]}</span></div>)}</div><div className="scorecard-title bowling-title">Australia bowling</div><div className="score-table"><div className="score-table-head"><span>BOWLER</span><span>O</span><span>M</span><span>R</span><span>W</span><span>ECON</span></div>{["M Starc","P Cummins","J Hazlewood"].map((n,i)=><div className="score-table-row" key={n}><span><b>{n}</b><small>Left arm fast</small></span><span>{[9,8,9][i]}</span><span>0</span><span>{[52,41,48][i]}</span><strong>{[2,1,1][i]}</strong><span>{[5.77,5.12,5.33][i]}</span></div>)}</div><div className="demo-footnote">Illustrative scorecard preview. Provider scorecard integration can be added when the API plan supports innings detail.</div></>}
            {tab==="wickets" && <><div className="panel-header"><div><h2>Fall of wickets</h2><p>Key moments in the innings</p></div><span className="innings-chip">2ND INNINGS</span></div><div className="wicket-list">{[{w:1,r:34,o:"5.2",p:"R Sharma",t:"c Smith b Starc"},{w:2,r:91,o:"14.4",p:"S Gill",t:"lbw b Hazlewood"},{w:3,r:142,o:"25.1",p:"S Iyer",t:"c Carey b Zampa"},{w:4,r:201,o:"35.3",p:"H Pandya",t:"b Cummins"},{w:5,r:229,o:"40.2",p:"R Jadeja",t:"c Labuschagne b Starc"}].map(x=><div className="wicket-row" key={x.w}><div className="wicket-number">{x.w}</div><div className="wicket-info"><strong>{x.p}</strong><span>{x.t}</span></div><div className="wicket-score"><strong>{x.r}</strong><span>{x.o} ov</span></div></div>)}</div><div className="demo-footnote">Illustrative wicket timeline for the match-centre preview.</div></>}
          </div>
        </section>

        <aside className="side-column">
          <section className="side-card glass"><div className="side-heading"><div><span className="side-kicker">THE NUMBERS</span><h3>Match insights</h3></div><span className="side-icon"><Gauge size={17}/></span></div><div className="insight-feature"><div className="insight-icon mint"><TrendingIcon/></div><div><strong>Chase is on track</strong><p>Required rate is within reach with wickets in hand.</p></div></div><div className="insight-stats"><div><span>REQUIRED RATE</span><strong>7.00 <small>RPO</small></strong></div><div><span>PROJECTED SCORE</span><strong>300 <small>runs</small></strong></div></div><div className="insight-footer"><span><span className="tiny-green"/> Based on current run rate</span><span>Updated now</span></div></section>
          <section className="side-card glass pitch-card"><div className="side-heading"><div><span className="side-kicker">GROUND CONDITIONS</span><h3>Pitch report</h3></div><span className="side-icon"><Waves size={17}/></span></div><div className="pitch-content"><div className="donut"><div className="donut-inner"><strong>58%</strong><span>PACE</span></div></div><div className="pitch-legend"><div><span className="legend-dot pace"/>Pace friendly <strong>58%</strong></div><div><span className="legend-dot spin"/>Spin friendly <strong>42%</strong></div><p>Good carry early on, with some grip for spinners as the match progresses.</p></div></div><div className="weather-line"><CloudSun size={15}/><span>Ahmedabad</span><strong>29°C</strong><span>·</span><span>Clear skies</span></div></section>
          <section className="side-card glass fixtures-card"><div className="side-heading"><div><span className="side-kicker">WHAT'S NEXT</span><h3>Upcoming fixtures</h3></div><button className="text-link">View all <ArrowUpRight size={13}/></button></div><div className="fixtures-list">{fixtures.map((f,i)=><div className="fixture" key={f.teams}><div className="fixture-date"><strong>{f.date}</strong><span>{f.day}</span></div><div className="fixture-info"><strong>{f.teams}</strong><span>{f.format} <i>·</i> {f.time}</span></div><ChevronRight size={15}/></div>)}</div></section>
        </aside>
      </div>
      <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><Activity size={15}/></span><span>stump<span className="brand-light">stream</span></span></a><span>Made for the love of the game.</span><div><a href="https://cricketdata.org/" target="_blank" rel="noreferrer">Data provider <ExternalLink size={11}/></a><span>© 2026 StumpStream</span></div></footer>
    </main>
  </div>;
}
function TrendingIcon(){return <ArrowUpRight size={17}/>;}
createRoot(document.getElementById("root")).render(<App/>);