import assert from 'node:assert/strict';
import test from 'node:test';
import { countByPillar, filterPosts, parsePillar, validatePosts } from '../src/catalog.mjs';

const posts = [
  {
    id: 'sample-governance',
    title: 'Example Identity',
    summary: 'Agent identity and access control',
    pillar: 'governance',
    topics: ['identity', 'RBAC'],
    publishedAt: '2026-10-05',
    sources: [
      { platform: 'medium', url: 'https://medium.com/@example/identity' },
      { platform: 'dev', url: 'https://dev.to/example/identity' },
    ],
  },
  {
    id: 'sample-model',
    title: 'Example Model Choice',
    summary: 'Select a model for each request',
    pillar: 'model',
    topics: ['routing'],
    publishedAt: '2026-09-25',
    sources: [{ platform: 'medium', url: 'https://medium.com/@example/router' }],
  },
  {
    id: 'sample-observability',
    title: 'Example Tracing',
    summary: 'OpenTelemetry in production',
    pillar: 'observability',
    topics: ['tracing'],
    publishedAt: '2026-10-15',
    sources: [{ platform: 'dev', url: 'https://dev.to/example/tracing' }],
  },
];

test('filters by pillar and searchable text without mutating the catalog', () => {
  const original = posts.map((post) => post.id);
  assert.deepEqual(
    filterPosts(posts, { pillar: 'governance', query: 'rbac' }).map((post) => post.id),
    ['sample-governance'],
  );
  assert.deepEqual(posts.map((post) => post.id), original);
});

test('source filter finds a syndicated article once', () => {
  assert.deepEqual(
    filterPosts(posts, { source: 'dev' }).map((post) => post.id),
    ['sample-observability', 'sample-governance'],
  );
});

test('sorts by verified public publication date', () => {
  assert.deepEqual(
    filterPosts(posts, { sort: 'oldest' }).map((post) => post.id),
    ['sample-model', 'sample-governance', 'sample-observability'],
  );
  assert.deepEqual(
    filterPosts(posts, {}).map((post) => post.id),
    ['sample-observability', 'sample-governance', 'sample-model'],
  );
});

test('counts one article per primary pillar', () => {
  assert.deepEqual(countByPillar(posts), {
    model: 1,
    'agent-building': 0,
    governance: 1,
    observability: 1,
    tools: 0,
    evaluation: 0,
  });
});

test('accepts only known pillar deep links', () => {
  assert.equal(parsePillar('?pillar=tools'), 'tools');
  assert.equal(parsePillar('?pillar=evaluation'), 'evaluation');
  assert.equal(parsePillar('?pillar=agent-building'), 'agent-building');
  assert.equal(parsePillar('?pillar=runtime'), 'agent-building');
  assert.equal(parsePillar('?pillar=anything'), 'all');
  assert.equal(parsePillar(''), 'all');
});

test('filters and counts evaluation articles independently from observability', () => {
  const evaluationPost = { ...posts[0], id: 'sample-evaluation', pillar: 'evaluation' };
  const catalog = [evaluationPost, posts[2]];
  assert.deepEqual(filterPosts(catalog, { pillar: 'evaluation' }).map((post) => post.id), ['sample-evaluation']);
  assert.equal(countByPillar(catalog).evaluation, 1);
  assert.equal(countByPillar(catalog).observability, 1);
});

test('rejects draft and private URLs before a catalog can be published', () => {
  const invalid = [
    { ...posts[0], sources: [{ platform: 'dev', url: 'https://dev.to/dashboard' }] },
    { ...posts[1], sources: [{ platform: 'dev', url: 'https://dev.to/example/temp-slug' }] },
  ];
  const errors = validatePosts(invalid);
  assert.ok(errors.some((error) => error.includes('dashboard')));
  assert.ok(errors.some((error) => error.includes('temp-slug')));
});

test('rejects duplicate inventory day numbers while allowing unmatched public posts', () => {
  const first = { ...posts[0], inventoryId: 39, dayNumber: 38 };
  const second = { ...posts[1], inventoryId: 40, dayNumber: 38 };
  assert.ok(validatePosts([first, second]).some((error) => error.includes('dayNumber')));
  assert.deepEqual(validatePosts([{ ...posts[2], inventoryId: null, dayNumber: null }]), []);
});
