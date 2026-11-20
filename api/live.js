const API_URL = "https://api.cricapi.com/v1/currentMatches";

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeScore(item) {
  if (!item || typeof item !== "object") return null;
  const runs = Number(item.r ?? item.runs);
  const wickets = Number(item.w ?? item.wickets ?? 0);
  const overs = Number(item.o ?? item.overs);
  if (!Number.isFinite(runs)) return null;
  return {
    r: runs,
    w: Number.isFinite(wickets) ? wickets : 0,
    o: Number.isFinite(overs) ? overs : null,
    inning: asText(item.inning || item.innings || item.team)
  };
}

function normalizeMatch(match) {
  const teams = Array.isArray(match.teams)
    ? match.teams.map((team) => typeof team === "string" ? team : asText(team?.name)).filter(Boolean)
    : [];
  const score = (Array.isArray(match.score) ? match.score : [])
    .map(normalizeScore)
    .filter(Boolean);
  const status = asText(match.status) || "Match status unavailable";
  const completed = /\b(won|draw|no result|abandoned|cancelled|canceled|completed|match over)\b/i.test(status);

  return {
    id: String(match.id || match.name || crypto.randomUUID()),
    name: asText(match.name) || (teams.length >= 2 ? teams.join(" vs ") : "Cricket match"),
    matchType: asText(match.matchType || match.match_type || match.type) || "match",
    status,
    venue: asText(match.venue),
    date: asText(match.dateTimeGMT || match.date),
    teams,
    score,
    teamInfo: Array.isArray(match.teamInfo) ? match.teamInfo : [],
    series: asText(match.series),
    isLive: match.matchStarted === true && match.matchEnded !== true && !completed,
    matchStarted: match.matchStarted === true,
    matchEnded: match.matchEnded === true,
    source: "CricketData"
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=20");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const key = process.env.CRICKET_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: "CricketData API is not configured. Add CRICKET_API_KEY to Vercel Production and redeploy."
    });
  }

  try {
    const url = new URL(API_URL);
    url.searchParams.set("apikey", key);
    url.searchParams.set("offset", "0");

    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000)
    });
    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok || payload.status !== "success") {
      const info = asText(payload.reason || payload.message || payload.error);
      const providerStatus = upstream.status || 502;
      return res.status(providerStatus === 429 ? 429 : 502).json({
        error: info || "CricketData could not provide current matches.",
        providerStatus
      });
    }

    if (!Array.isArray(payload.data)) {
      return res.status(502).json({ error: "CricketData returned an unexpected current-matches response." });
    }

    const matches = payload.data
      .map(normalizeMatch)
      .filter((match) => match.teams.length >= 2 && match.matchStarted && !match.matchEnded);

    return res.status(200).json({
      source: "cricketdata",
      matches,
      fetchedAt: new Date().toISOString(),
      quota: payload.info ? {
        hitsToday: payload.info.hitsToday,
        hitsLimit: payload.info.hitsLimit
      } : undefined
    });
  } catch (error) {
    return res.status(502).json({
      error: error?.name === "TimeoutError"
        ? "CricketData took too long to respond. Please try again shortly."
        : "Could not reach CricketData. Please try again shortly."
    });
  }
}
