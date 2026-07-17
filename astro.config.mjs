import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://motodok.com',
  base: '/',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      entryLimit: 50000,
      changefreq: 'weekly',
      priority: 0.7,
      serialize: (item) => {
        if (item.url === 'https://motodok.com/') {
          item.priority = 1.0;
        } else if (item.url.includes('/Diagnosis/') || item.url.includes('/Measure/')) {
          item.priority = 0.9;
        }
        delete item.lastmod;
        return item;
      },
    }),
  ],
});
