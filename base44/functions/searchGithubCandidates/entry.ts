// GITHUB_TOKEN is optional — without it GitHub allows 60 req/hr (unauthenticated)
// With it: 5000 req/hr. Get one at https://github.com/settings/tokens (read:user scope)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { language, location, keywords, minFollowers, sort, page } = await req.json();

  const githubToken = Deno.env.get("GITHUB_TOKEN");
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (githubToken) headers['Authorization'] = `Bearer ${githubToken}`;

  // Location expansion — GitHub users write their location in many ways
  const locationExpansions = {
    'Israel': 'Israel OR "Tel Aviv" OR "TLV" OR "Haifa" OR "Jerusalem" OR "Herzliya" OR "Beer Sheva" OR "Ramat Gan" OR "Petah Tikva" OR "Netanya"',
    'Tel Aviv': '"Tel Aviv" OR "TLV" OR "Tel-Aviv"',
    'Haifa': 'Haifa OR חיפה',
    'Jerusalem': 'Jerusalem OR "ירושלים"',
  };

  // Build query
  let q = '';
  if (keywords) q += keywords + ' ';
  if (language) q += `language:${language} `;
  if (location) {
    const expanded = locationExpansions[location] || location;
    q += `location:${expanded} `;
  }
  if (minFollowers) q += `followers:>=${minFollowers} `;
  q = q.trim() || 'type:user';

  const sortParam = sort || 'followers';
  const pageParam = page || 1;

  const searchUrl = `https://api.github.com/search/users?q=${encodeURIComponent(q)}&sort=${sortParam}&order=desc&per_page=12&page=${pageParam}`;
  const searchRes = await fetch(searchUrl, { headers });
  const searchData = await searchRes.json();

  if (!searchRes.ok) {
    return Response.json({ error: searchData.message || 'GitHub API error', details: searchData }, { status: 400 });
  }

  // Enrich top results with user detail
  const enriched = await Promise.all(
    (searchData.items || []).map(async (item) => {
      const detailRes = await fetch(`https://api.github.com/users/${item.login}`, { headers });
      const detail = await detailRes.json();

      // Get top repos
      const reposRes = await fetch(`https://api.github.com/users/${item.login}/repos?sort=stars&per_page=5&type=owner`, { headers });
      const repos = await reposRes.json();

      return {
        login: detail.login,
        name: detail.name || detail.login,
        avatar_url: detail.avatar_url,
        html_url: detail.html_url,
        bio: detail.bio || '',
        company: detail.company || '',
        location: detail.location || '',
        email: detail.email || '',
        blog: detail.blog || '',
        twitter_username: detail.twitter_username || '',
        public_repos: detail.public_repos || 0,
        followers: detail.followers || 0,
        following: detail.following || 0,
        top_repos: Array.isArray(repos) ? repos.slice(0, 5).map(r => ({
          name: r.name,
          description: r.description || '',
          language: r.language || '',
          stars: r.stargazers_count || 0,
          url: r.html_url,
        })) : [],
        created_at: detail.created_at,
      };
    })
  );

  return Response.json({
    total_count: searchData.total_count || 0,
    items: enriched,
    query_used: q,
  });
});