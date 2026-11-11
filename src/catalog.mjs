export const PILLAR_IDS = ['model', 'agent-building', 'governance', 'observability', 'tools', 'evaluation'];

export function filterPosts(posts, { pillar = 'all', query = '', source = 'all', sort = 'newest' } = {}) {
  const search = query.trim().toLocaleLowerCase();
  const filtered = posts.filter((post) => {
    if (pillar !== 'all' && post.pillar !== pillar) return false;
    if (source !== 'all' && !post.sources.some((item) => item.platform === source)) return false;
    if (!search) return true;

    const text = [post.title, post.summary, ...(post.topics || [])].join(' ').toLocaleLowerCase();
    return text.includes(search);
  });

  return filtered.sort((a, b) => {
    const byDate = a.publishedAt.localeCompare(b.publishedAt);
    return (sort === 'oldest' ? byDate : -byDate) || a.title.localeCompare(b.title);
  });
}

export function countByPillar(posts) {
  const counts = Object.fromEntries(PILLAR_IDS.map((pillar) => [pillar, 0]));
  for (const post of posts) {
    if (Object.hasOwn(counts, post.pillar)) counts[post.pillar] += 1;
  }
  return counts;
}

export function parsePillar(search) {
  const candidate = new URLSearchParams(search).get('pillar');
  if (candidate === 'runtime') return 'agent-building';
  return PILLAR_IDS.includes(candidate) ? candidate : 'all';
}

export function validatePosts(posts) {
  const errors = [];
  const ids = new Set();
  const days = new Set();
  const inventoryIds = new Set();
  const urls = new Set();

  for (const [index, post] of posts.entries()) {
    const label = `post ${index + 1}`;
    if (!post || typeof post !== 'object') {
      errors.push(`${label}: invalid article`);
      continue;
    }
    if (!post.id || ids.has(post.id)) errors.push(`${label}: missing or duplicate id`);
    ids.add(post.id);
    if (!post.title?.trim()) errors.push(`${label}: missing title`);
    if (!PILLAR_IDS.includes(post.pillar)) errors.push(`${label}: unknown pillar`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.publishedAt || '') || Number.isNaN(Date.parse(post.publishedAt))) {
      errors.push(`${label}: publishedAt must be a public-source date in YYYY-MM-DD format`);
    }

    const hasInventoryId = post.inventoryId !== null && post.inventoryId !== undefined;
    const hasDay = post.dayNumber !== null && post.dayNumber !== undefined;
    if (hasInventoryId !== hasDay) errors.push(`${label}: inventoryId and dayNumber must be paired`);
    if (hasInventoryId) {
      if (!Number.isInteger(post.inventoryId) || post.inventoryId < 1 || inventoryIds.has(post.inventoryId)) {
        errors.push(`${label}: invalid or duplicate inventoryId`);
      }
      inventoryIds.add(post.inventoryId);
    }
    if (hasDay) {
      if (!Number.isInteger(post.dayNumber) || post.dayNumber < 1 || days.has(post.dayNumber)) {
        errors.push(`${label}: invalid or duplicate dayNumber`);
      }
      days.add(post.dayNumber);
    }

    if (!Array.isArray(post.sources) || post.sources.length === 0) {
      errors.push(`${label}: at least one verified public source is required`);
      continue;
    }
    for (const source of post.sources) {
      let parsed;
      try {
        parsed = new URL(source.url);
      } catch {
        errors.push(`${label}: invalid source URL`);
        continue;
      }
      const host = parsed.hostname.toLowerCase();
      const isMedium = source.platform === 'medium' && (host === 'medium.com' || host.endsWith('.medium.com'));
      const isDev = source.platform === 'dev' && (host === 'dev.to' || host === 'www.dev.to');
      if (parsed.protocol !== 'https:' || (!isMedium && !isDev)) errors.push(`${label}: unsupported public source ${source.url}`);
      if (/\/(dashboard|manage|new)(\/|$)/i.test(parsed.pathname) || /temp-slug/i.test(parsed.pathname)) {
        errors.push(`${label}: draft or private source ${source.url}`);
      }
      if (urls.has(parsed.href)) errors.push(`${label}: duplicate source URL`);
      urls.add(parsed.href);
    }
  }
  return errors;
}
