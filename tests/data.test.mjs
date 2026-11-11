import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validatePosts } from '../src/catalog.mjs';

const raw = await readFile(new URL('../data/posts.json', import.meta.url), 'utf8');
const { posts } = JSON.parse(raw);

test('public catalog contains only valid published article links', () => {
  assert.ok(posts.length > 0);
  assert.deepEqual(validatePosts(posts), []);
  assert.ok(posts.some((post) => post.sources.some((source) => source.platform === 'medium')));
  assert.ok(posts.some((post) => post.sources.some((source) => source.platform === 'dev')));
});

test('inventory identity is copied from actual rows, including day 38', () => {
  const day38 = posts.find((post) => post.dayNumber === 38);
  assert.equal(day38.inventoryId, 39);
  assert.ok(posts.every((post) => !('publishedStatus' in post) && !('inventoryPublishedDate' in post)));
});

test('catalog never contains draft placeholders or connection details', () => {
  assert.ok(!/temp-slug|POSTGRES_CONNECTION_STRING|PGPASSWORD|postgresql:\/\//i.test(raw));
});

test('evaluation articles have their own pillar while tracing stays in observability', () => {
  assert.equal(posts.find((post) => post.dayNumber === 5).pillar, 'evaluation');
  assert.equal(posts.find((post) => post.dayNumber === 30).pillar, 'evaluation');
  assert.equal(posts.find((post) => post.dayNumber === 10).pillar, 'observability');
  assert.equal(posts.find((post) => post.title.startsWith('Azure AI Foundry Evaluations')).pillar, 'evaluation');
});

test('agent building uses its named pillar in the public catalog', () => {
  assert.equal(posts.filter((post) => post.pillar === 'agent-building').length, 11);
  assert.ok(posts.every((post) => post.pillar !== 'runtime'));
});
