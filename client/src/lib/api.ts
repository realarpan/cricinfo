import type { Article, Match, SearchResult } from '../types';
const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
async function get<T>(path: string): Promise<T> { const r = await fetch(`${base}${path}`); if (!r.ok) throw new Error('Unable to load cricket data'); return r.json(); }
export const api = {
  matches: (status = 'all') => get<Match[]>(`/matches?status=${status}`),
  match: (id: string) => get<Match>(`/matches/${id}`),
  news: () => get<Article[]>('/news'),
  rankings: () => get<{ format: string; players: { name: string; team: string; rating: number }[] }[]>('/rankings'),
  search: (q: string) => get<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`),
  team: (slug: string) => get<Record<string, unknown>>(`/teams/${slug}`)
};
