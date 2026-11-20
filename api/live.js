const API_URL = "https://api.cricapi.com/v1/currentMatches";

function textValue(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function normalizeMatch(match) {
  const teams = Array.isArray(match.teams) ? match.teams.filter((team) => typeof team === "string") : [];
  const scores = Array.isArray(match.score) ? match.score : [];
  const score = scores.map((item) => {
    const runs = Number(item?.r);
    const wickets = Number(item?.w ?? 0);
    const overs = Number(item?.o);
    if (!Number.isFinite(runs)) return null;
    return {
      r: runs,
      w: Number.isFinite(wickets) ? wickets : 0,
      o: Number.isFinite(overs) ? overs : null,
      inning: textValue(item?.inning)
    };
  }).filter(Boolean);

  const status = textValue(match.status, match.state) || "Match status unavailable";
  const completed = /\b(won|draw|no result|abandoned|cancelled|completed|complete|match over)\b/i.test(status);

  return {
    id: String(match.id || match.name || ""),
    name: textValue(match.name) || (teams.length >= 2 ? `${teams[0]} vs ${teams[1]}` : "Cricket match"),
    matchType: textValue(match.matchType, match.match_type) || "match",
    status,
    venue: textValue(match.venue) || "Venue unavailable",
    date: textValue(match.dateTimeGMT, match.date),
    teams,
    score,
    teamInfo: Array.isArray(match.teamInfo) ? match.teamInfo : [],
    series: textValue(match.series),
    isLive: !completed && score.length > 0
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=20");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const key = process.env.CRICKET_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: "CricketData is not configured. Add CRICKET_API_KEY to the Vercel Production environment and redeploy."
    });
  }

  try {
    const url = new URL(API_URL);
    url.searchParams.set("apikey", key);
    url.searchParams.set("offset", "0");

    const upstream = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000)
    });
    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const status = Number(upstream.status);
      return res.status(502).json({
        error: status === 429
          ? "CricketData daily request limit has been reached."
          : status === 401 || status === 403
            ? "CricketData rejected the configured API key or account access."
            : `CricketData returned HTTP ${status}.`,
        providerStatus: status
      });
    }

    if (payload.status !== "success" || !Array.isArray(payload.data)) {
      const reason = textValue(payload.reason, payload.message, payload.info?.status);
      return res.status(502).json({
        error: reason || "CricketData returned an unexpected response."
      });
    }

    const matches = payload.data
      .map(normalizeMatch)
      .filter((match) => match.teams.length >= 2 && match.score.length > 0 && match.isLive);

    return res.status(200).json({
      source: "cricketdata",
      matches,
      fetchedAt: new Date().toISOString(),
      usage: payload.info ? {
        hitsToday: payload.info.hitsToday,
        hitsLimit: payload.info.hitsLimit
      } : undefined
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return res.status(502).json({
      error: timedOut
        ? "CricketData took too long to respond. Please try again shortly."
        : "Could not reach CricketData. Please try again shortly."
    });
  }
}
