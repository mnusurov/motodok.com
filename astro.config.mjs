import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://motodok.com',
  base: '/',
  output: 'static',
  adapter: cloudflare({
    mode: 'directory',
  }),
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize: (item) => {
        if (item.url === 'https://motodok.com/') {
          item.priority = 1.0;
        } else if (item.url.includes('/Diagnosis/') || item.url.includes('/Measure/')) {
          item.priority = 0.9;
        }
        return item;
      },
    }),
  ],
});
