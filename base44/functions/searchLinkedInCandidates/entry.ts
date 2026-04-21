import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { query, start } = await req.json();
  if (!query) return Response.json({ error: 'query is required' }, { status: 400 });

  const apiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
  if (!apiKey) return Response.json({ error: 'GOOGLE_SEARCH_API_KEY not set' }, { status: 500 });

  const cx = Deno.env.get('GOOGLE_SEARCH_CX');
  if (!cx) return Response.json({ error: 'GOOGLE_SEARCH_CX not set' }, { status: 500 });

  const startIndex = start || 1;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&start=${startIndex}&num=10`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    console.error('Google API Error:', { status: res.status, error: data.error });
    const errorMsg = data.error?.message || 'Google API error';
    return Response.json({ error: errorMsg }, { status: res.status });
  }

  const items = (data.items || []).map(item => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    displayLink: item.displayLink,
  }));

  return Response.json({
    total: data.searchInformation?.totalResults || '0',
    items,
    query_used: query,
  });
});