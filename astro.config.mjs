// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// 빌드 시점에 콘텐츠 frontmatter를 읽어 URL→lastmod 맵을 만든다.
function buildLastmodMap() {
  const map = new Map();
  const dir = path.resolve('./src/content/posts');
  if (!fs.existsSync(dir)) return map;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const slug = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { data } = matter(raw);
    if (data?.draft) continue;
    const ts = data?.updatedAt || data?.publishedAt;
    if (!ts) continue;
    map.set(`/${slug}/`, new Date(ts).toISOString());
  }
  return map;
}

const postLastmod = buildLastmodMap();
const buildLastmod = new Date().toISOString();

export default defineConfig({
  site: 'https://homegrade.kr',
  integrations: [
    sitemap({
      serialize(item) {
        const url = new URL(item.url);
        const lm = postLastmod.get(url.pathname);
        item.lastmod = lm ?? buildLastmod;
        return item;
      },
    }),
  ],
  build: { format: 'directory' },
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
});
