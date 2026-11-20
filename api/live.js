const API_BASE = "https://opencricketapi.com/v1";

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function teamName(team) {
  if (typeof team === "string") return team;
  if (!team || typeof team !== "object") return "";
  return firstString(team.name, team.team_name, team.full_name, team.short_name, team.shortname);
}

function normalizeScore(item) {
  if (!item || typeof item !== "object") return null;
  const runs = Number(item.runs ?? item.r ?? item.total_runs);
  const wickets = Number(item.wickets ?? item.w ?? item.total_wickets ?? 0);
  const oversValue = item.overs ?? item.o ?? item.overs_completed;
  const overs = typeof oversValue === "string" ? Number.parseFloat(oversValue) : Number(oversValue);
  if (!Number.isFinite(runs)) return null;
  return {
    r: runs,
    w: Number.isFinite(wickets) ? wickets : 0,
    o: Number.isFinite(overs) ? overs : null
  };
}

function normalizeMatch(match) {
  const rawTeams = Array.isArray(match.teams) ? match.teams : [];
  const teams = rawTeams.map(teamName).filter(Boolean);
  const innings = Array.isArray(match.innings) ? match.innings : [];
  const rawScores = Array.isArray(match.score) ? match.score : innings;
  const score = rawScores.map(normalizeScore).filter(Boolean);
  const competition = match.competition;
  const series = firstString(
    match.series,
    typeof competition === "string" ? competition : competition?.name,
    match.tournament?.name
  );
  const name = firstString(
    match.name,
    match.title,
    match.match_name,
    teams.length >= 2 ? `${teams[0]} vs ${teams[1]}` : ""
  ) || "Cricket match";
  const status = firstString(match.status, match.state, match.status_text, match.result);
  const statusText = status || "Match status unavailable";
  const teamInfo = rawTeams.map((team) => ({
    name: teamName(team),
    shortname: typeof team === "object" && team
      ? firstString(team.short_name, team.shortname, team.abbreviation)
      : ""
  }));
  const live = match.is_live === true || match.live === true ||
    /live|in progress|innings break|stumps|day\s+[1-5]/i.test(statusText);
  return {
    id: String(match.id ?? match.match_id ?? match.matchId ?? name),
    name,
    matchType: firstString(match.match_type, match.matchType, match.format, match.type) || "match",
    status: statusText,
    venue: firstString(match.venue, match.ground, match.venue_name),
    date: firstString(match.date, match.start_date, match.startTime, match.start_time),
    teams,
    score,
    teamInfo,
    series,
    isLive: live,
    source: firstString(match.source, match.data_source) || "OpenCricket"
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=15");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const key = process.env.OPENCRICKET_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: "OpenCricket is not configured. Add OPENCRICKET_API_KEY to the Vercel Production environment and redeploy."
    });
  }

  try {
    const upstream = await fetch(`${API_BASE}/matches?status=live`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(12000)
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const detail = firstString(payload.message, payload.error, payload.detail, payload.reason);
      const message = upstream.status === 401 || upstream.status === 403
        ? "OpenCricket rejected the key or this endpoint is not enabled for the current plan."
        : upstream.status === 429
          ? "OpenCricket request quota or rate limit reached."
          : detail || `OpenCricket returned HTTP ${upstream.status}.`;
      return res.status(upstream.status === 429 ? 429 : 502).json({
        error: message,
        providerStatus: upstream.status
      });
    }

    if (payload.error || payload.success === false) {
      return res.status(502).json({
        error: firstString(payload.message, payload.error, payload.detail) || "OpenCricket returned an API error."
      });
    }

    const records = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.matches)
        ? payload.matches
        : Array.isArray(payload.results)
          ? payload.results
          : null;

    if (!records) {
      return res.status(502).json({
        error: "OpenCricket responded, but its match-list format was not recognised."
      });
    }

    const matches = records.map(normalizeMatch).filter((match) =>
      match.teams.length >= 2 && match.score.length > 0
    );

    return res.status(200).json({
      source: "opencricket",
      matches,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return res.status(502).json({
      error: timedOut
        ? "OpenCricket took too long to respond. Please refresh shortly."
        : "Could not reach OpenCricket. Please try again shortly."
    });
  }
}
