// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://limengting1001.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
  // Pages that existed on the old Hugo site and no longer have an equivalent.
  redirects: {
    '/publications': '/#publications',
    '/publications/bcar4': '/#publications',
    '/publications/gejac': '/#publications',
    '/publications/gse41439': '/#publications',
    '/publications/usp30-as1': '/#publications',
    '/publication': '/#publications',
    '/authors/admin': '/',
    '/experience': '/',
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
