import { countByPillar, filterPosts, parsePillar, validatePosts } from './catalog.mjs';

const pillarNames = {
  all: 'All pillars',
  model: 'Model',
  'agent-building': 'Agent Building',
  governance: 'Governance',
  observability: 'Observability',
  tools: 'Tools',
  evaluation: 'Evaluation',
};

const sourceNames = { medium: 'Medium', dev: 'DEV.to' };
const searchInput = document.querySelector('#search-input');
const sourceFilter = document.querySelector('#source-filter');
const sortSelect = document.querySelector('#sort-select');
const grid = document.querySelector('#article-grid');
const emptyState = document.querySelector('#empty-state');
const resultCount = document.querySelector('#results-count');
const activePillarLabel = document.querySelector('#active-pillar-label');

let posts = [];
let activePillar = parsePillar(window.location.search);

function formatDate(value) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function appendText(parent, tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  parent.append(element);
  return element;
}

function createArticleCard(post) {
  const card = document.createElement('article');
  card.className = `article-card pillar-${post.pillar}`;
  card.setAttribute('role', 'listitem');

  const meta = appendText(card, 'div', 'article-meta', '');
  appendText(meta, 'span', 'article-pillar', pillarNames[post.pillar]);
  appendText(meta, 'span', 'article-number', post.dayNumber ? `DAY ${String(post.dayNumber).padStart(2, '0')}` : 'FIELD NOTE');
  appendText(card, 'h3', '', post.title);
  if (post.summary) appendText(card, 'p', 'article-summary', post.summary);

  if (post.topics?.length) {
    const topics = appendText(card, 'div', 'article-topics', '');
    for (const topic of post.topics.slice(0, 3)) appendText(topics, 'span', '', topic);
  }

  appendText(card, 'div', 'article-spacer', '');
  const date = appendText(card, 'time', 'article-date', `Published ${formatDate(post.publishedAt)}`);
  date.dateTime = post.publishedAt;
  const links = appendText(card, 'div', 'article-links', '');
  for (const source of [...post.sources].sort((a, b) => (a.platform === 'medium' ? -1 : 1) - (b.platform === 'medium' ? -1 : 1))) {
    const link = appendText(links, 'a', '', `Read on ${sourceNames[source.platform]} ↗`);
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Read ${post.title} on ${sourceNames[source.platform]} (opens in a new tab)`);
  }
  return card;
}

function render() {
  const visible = filterPosts(posts, {
    pillar: activePillar,
    query: searchInput.value,
    source: sourceFilter.value,
    sort: sortSelect.value,
  });

  grid.replaceChildren(...visible.map(createArticleCard));
  emptyState.hidden = visible.length > 0;
  resultCount.textContent = `Showing ${visible.length} ${visible.length === 1 ? 'article' : 'articles'}`;
  activePillarLabel.textContent = pillarNames[activePillar];

  for (const chip of document.querySelectorAll('.filter-chip')) {
    const selected = chip.dataset.pillarLink === activePillar;
    chip.classList.toggle('is-active', selected);
    if (selected) chip.setAttribute('aria-current', 'true');
    else chip.removeAttribute('aria-current');
  }
}

function selectPillar(pillar, pushHistory = true) {
  activePillar = pillarNames[pillar] ? pillar : 'all';
  if (pushHistory) {
    const url = new URL(window.location.href);
    if (activePillar === 'all') url.searchParams.delete('pillar');
    else url.searchParams.set('pillar', activePillar);
    url.hash = 'library';
    window.history.pushState({ pillar: activePillar }, '', url);
  }
  render();
}

function showCounts() {
  const counts = countByPillar(posts);
  for (const element of document.querySelectorAll('[data-total-posts]')) element.textContent = posts.length;
  for (const element of document.querySelectorAll('[data-pillar-count]')) {
    element.textContent = counts[element.dataset.pillarCount] ?? 0;
  }
  for (const element of document.querySelectorAll('[data-pillar-unit]')) {
    element.textContent = counts[element.dataset.pillarUnit] === 1 ? 'article' : 'articles';
  }
}

async function loadCatalog() {
  try {
    const response = await fetch('./data/posts.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.posts)) throw new Error('Catalog format is invalid');
    const errors = validatePosts(data.posts);
    if (errors.length) throw new Error(`Catalog validation failed: ${errors.join('; ')}`);
    posts = data.posts;
    showCounts();
    render();
  } catch (error) {
    console.error(error);
    resultCount.textContent = 'The article library could not be loaded.';
    activePillarLabel.textContent = '';
    emptyState.hidden = true;
  }
}

for (const link of document.querySelectorAll('[data-pillar-link]')) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    selectPillar(link.dataset.pillarLink);
    document.querySelector('#library').scrollIntoView({ behavior: 'smooth' });
  });
}

searchInput.addEventListener('input', render);
sourceFilter.addEventListener('change', render);
sortSelect.addEventListener('change', render);
window.addEventListener('popstate', () => selectPillar(parsePillar(window.location.search), false));
document.querySelector('#clear-filters').addEventListener('click', () => {
  searchInput.value = '';
  sourceFilter.value = 'all';
  sortSelect.value = 'newest';
  selectPillar('all');
});

loadCatalog();
