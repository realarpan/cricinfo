export type Match = { id: string; name: string; matchType?: string; status: string; date?: string; venue?: string; teams: string[]; teamInfo?: { name: string; shortname?: string; img?: string }[]; score?: { r: number; w: number; o: number; inning: string }[] };
export type Article = { id: string; title: string; summary?: string; category: string; image_url?: string; published_at: string };
export type SearchResult = { id: string; name: string; kind: 'team' | 'player' | 'match' | 'series' };
