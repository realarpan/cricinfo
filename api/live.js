const DEMO = {
  source: "demo",
  matches: [{
    id: "demo-ind-aus",
    name: "India vs Australia, 2nd ODI",
    matchType: "odi",
    status: "India need 42 runs from 36 balls",
    venue: "Narendra Modi Stadium, Ahmedabad",
    date: new Date().toISOString(),
    teams: ["India", "Australia"],
    score: [
      { r: 258, w: 5, o: 44 },
      { r: 301, w: 8, o: 50 }
    ],
    teamInfo: [
      { name: "India", shortname: "IND", img: "" },
      { name: "Australia", shortname: "AUS", img: "" }
    ],
    series: "Australia tour of India",
    isLive: true
  }]
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();

  const key = process.env.CRICKET_API_KEY;
  if (!key) return res.status(200).json(DEMO);

  try {
    const upstream = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${encodeURIComponent(key)}&offset=0`);
    if (!upstream.ok) throw new Error(`Cricket provider returned ${upstream.status}`);
    const payload = await upstream.json();
    if (payload.status !== "success" || !Array.isArray(payload.data)) {
      throw new Error(payload.reason || "Unexpected cricket provider response");
    }
    const matches = payload.data.map((m) => ({
      id: String(m.id || m.name),
      name: m.name || "Live cricket match",
      matchType: m.matchType || "match",
      status: m.status || "Match in progress",
      venue: m.venue || "Venue unavailable",
      date: m.date || new Date().toISOString(),
      teams: Array.isArray(m.teams) ? m.teams : [],
      score: Array.isArray(m.score) ? m.score.map((s) => ({
        r: Number(s.r || 0), w: Number(s.w || 0), o: Number(s.o || 0)
      })) : [],
      teamInfo: Array.isArray(m.teamInfo) ? m.teamInfo : [],
      series: m.series || "",
      isLive: !/won|draw|no result|stumps|complete/i.test(m.status || "")
    }));
    return res.status(200).json({ source: "cricketdata", matches });
  } catch (error) {
    return res.status(502).json({ error: "Live score provider is temporarily unavailable.", detail: error.message });
  }
}