# limengting1001.com

Personal site of Mengting Li — bio, publications and blog.
Built with [Astro](https://astro.build), deployed to GitHub Pages by `.github/workflows/deploy.yml`
on every push to `main`.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

## Add a blog post

Create `src/content/blog/<slug>.md`. The file name becomes the URL (`/blog/<slug>/`).

```markdown
---
title: "Post title"
summary: "One or two sentences for the list page."
date: 2026-01-31
tags: ["NGS"]
minutes: 5
cover: /blog/<slug>/cover.jpg      # optional thumbnail, ~480px wide
coverAlt: "What the image shows"
---
```

Images go in `public/blog/<slug>/` and are referenced from the post as `/blog/<slug>/name.jpg`.
Resize before committing — `sips -Z 1200 -s format jpeg -s formatOptions 72 in.png --out out.jpg`.

A blockquote whose first line is bold renders as a callout box:

```markdown
> **Common error · PackagesNotFoundError**
>
> What to do about it.
```

## Add a publication

Add an entry at the top of `src/data/publications.js` (newest first). Any author matching `ME`
is bolded automatically. PDFs live in `public/publications/<slug>/paper.pdf`.

## Bio, links, education

All in `src/data/site.js`.

## CV

Source in `cv/` (LaTeX, Awesome-CV). Rebuild and publish:

```bash
cd cv && xelatex resume.tex && xelatex resume.tex   # twice, for the "n of m" footer
cp resume.pdf ../public/uploads/resume.pdf
```

`cv/awesome-cv.cls` and `cv/fontawesome.sty` are local copies, patched to add a pronouns field,
set the e-mail in a monospace face, and load the bundled FontAwesome font from `cv/fonts/`.
