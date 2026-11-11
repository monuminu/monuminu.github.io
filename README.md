# Foundry Agents · Field Guide

A static GitHub Pages reading hub for [Manoranjan Rajguru's](https://medium.com/@manoranjan.rajguru/) Microsoft Foundry agent articles. The collection is organized into six pillars: **Model**, **Agent Building**, **Governance**, **Observability**, **Tools**, and **Evaluation**.

## Run locally

```bash
npm test
npm run serve
```

Open <http://localhost:8000>. The site has no install step or runtime database connection.

## Add a published article

Edit [`data/posts.json`](data/posts.json). Add one card per distinct article, with at least one publicly accessible Medium or DEV.to URL. Open each new URL and confirm that it displays a live article heading before publishing a change; `npm test` checks catalog structure but cannot prove that a remote article is still live. If the article is published on both platforms, put both URLs in the same card's `sources` array. Use the date shown by a public source for `publishedAt`; when there are two versions, use the earliest public publication date.

For posts in the private `public.foundry_100_blogs` inventory, copy `inventoryId` and `dayNumber` from the **same row**. They are separate values: for example, day 38 has inventory ID 39. For other public Foundry agent posts, set both values to `null`. Run `npm test` after editing.

The inventory's `published_date` and `published_status` are source inventory metadata. They are not Medium or DEV.to progress fields and do not determine what appears on this site. Only independently verified live links belong in the public catalog. This repository contains no database credentials or unpublished inventory export.

## Publish on GitHub Pages

This repository is designed to be published from the root of the `main` branch. In the repository's **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, then save. GitHub Pages serves `index.html` directly; `.nojekyll` keeps the static files intact.

The site is independent and is not an official Microsoft website.
