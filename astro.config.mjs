import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://adityag1.com',
  output: 'static',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
