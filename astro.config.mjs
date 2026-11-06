// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://limengting1001.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
