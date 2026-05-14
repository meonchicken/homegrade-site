// HomeGrade RSS feed — 네이버 Search Advisor·구글 등 자동 색인 + RSS 구독용
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );

  return rss({
    title: 'HomeGrade - 홈리빙 용품 등급 비교',
    description:
      '주방·욕실·청소·생활소모품 쿠팡 리뷰 빅데이터 분석으로 객관적 등급을 매기는 한국 홈리빙 비교 사이트. KS·식약처·환경부 기준 안전 인증 검증 포함.',
    site: context.site,
    customData: '<language>ko</language><copyright>© 2026 HomeGrade Editorial Team</copyright>',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.description,
      link: `/${post.id}/`,
      categories: [post.data.category, ...(post.data.tags || [])].filter(Boolean),
    })),
  });
}
