const API_URL = "https://api.cricapi.com/v1/cricScore";

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function splitTeam(value) {
  const raw = asText(value);
  const open = raw.lastIndexOf("[");
  const close = raw.lastIndexOf("]");
  if (open >= 0 && close > open) {
    return {
      name: raw.slice(0, open).trim(),
      shortname: raw.slice(open + 1, close).trim()
    };
  }
  return { name: raw, shortname: "" };
}

function parseFormattedScore(value, teamName) {
  const text = asText(value);
  const match = text.match(/(\d+)\s*\/\s*(\d+)\s*\((\d+(?:\.\d+)?)\s*(?:ov(?:ers?)?)?\)/i);
  if (!match) return null;
  return {
    r: Number(match[1]),
    w: Number(match[2]),
    o: Number(match[3]),
    inning: teamName ? teamName + " Inning" : ""
  };
}

function normalizeMatch(item) {
  const first = splitTeam(item.t1);
  const second = splitTeam(item.t2);
  if (!first.name || !second.name) return null;

  const score = [
    parseFormattedScore(item.t1s, first.name),
    parseFormattedScore(item.t2s, second.name)
  ].filter(Boolean);

  const state = asText(item.ms).toLowerCase();
  const status = asText(item.status) || (state === "live" ? "Live" : "Match status unavailable");

  return {
    id: asText(item.id) || [first.name, second.name, asText(item.dateTimeGMT)].join("-"),
    name: first.name + " vs " + second.name,
    matchType: asText(item.matchType) || "match",
    status,
    venue: asText(item.venue),
    date: asText(item.dateTimeGMT || item.date),
    teams: [first.name, second.name],
    score,
    teamInfo: [
      { name: first.name, shortname: first.shortname, img: asText(item.t1img) },
      { name: second.name, shortname: second.shortname, img: asText(item.t2img) }
    ],
    series: asText(item.series),
    isLive: state === "live",
    matchStarted: state === "live",
    matchEnded: state === "result",
    source: "CricketData"
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=300");
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

    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });
    const payload = await upstream.json().catch(() => ({}));

    if (!upstream.ok || payload.status !== "success") {
      const info = asText(payload.reason || payload.message || payload.error);
      const providerStatus = upstream.status || 502;
      return res.status(providerStatus === 429 ? 429 : 502).json({
        error: info || "CricketData could not provide live scores.",
        providerStatus
      });
    }

    if (!Array.isArray(payload.data)) {
      return res.status(502).json({ error: "CricketData returned an unexpected live-score response." });
    }

    const matches = payload.data
      .filter((item) => asText(item.ms).toLowerCase() === "live")
      .map(normalizeMatch)
      .filter(Boolean);

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
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? "CricketData timed out. Please try again shortly."
        : "Could not reach CricketData. Please try again shortly."
    });
  }
}
