// 빌드마다 자동 갱신 — AI 크롤러가 사이트 구조를 파악하도록 함
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );

  const byCategory: Record<string, typeof posts> = {};
  for (const p of posts) {
    const c = p.data.category;
    if (!byCategory[c]) byCategory[c] = [];
    byCategory[c].push(p);
  }

  const lines: string[] = [];

  lines.push('# HomeGrade (홈그레이드)');
  lines.push('');
  lines.push('> 홈리빙 용품 등급 비교 사이트. 주방·욕실·청소·생활소모품·가전을 쿠팡 리뷰 빅데이터와 안전 인증 검증으로 평가합니다.');
  lines.push('');
  lines.push('HomeGrade는 쿠팡 인증 리뷰·네이버 블로그·디시인사이드 등 한국 커뮤니티 후기를 종합 분석해 홈리빙 용품의 객관적 등급을 매기는 사이트입니다.');
  lines.push('보온·세척 편의·내구성·가성비·디자인 5축으로 5점 만점 평가하며, KS인증·식약처·BPA-Free 등 외부 안전 인증을 추가 검증합니다.');
  lines.push('');

  for (const [cat, list] of Object.entries(byCategory)) {
    if (list.length === 0) continue;
    lines.push(`## ${cat}`);
    lines.push('');
    for (const p of list) {
      lines.push(`- [${p.data.title}](https://homegrade.kr/${p.id}): ${p.data.description}`);
    }
    lines.push('');
  }

  lines.push('## 페이지');
  lines.push('');
  lines.push('- [홈페이지](https://homegrade.kr/): HomeGrade 홈리빙 카테고리별 등급 비교 전체 안내');
  lines.push('- [About](https://homegrade.kr/about): Editorial Team 소개와 평가 방법론');
  lines.push('- [Privacy](https://homegrade.kr/privacy): 개인정보 처리방침');
  lines.push('');
  lines.push('## 평가 기준');
  lines.push('');
  lines.push('- 핵심 성능: 카테고리별 정의 (보온·세척·흡수력 등)');
  lines.push('- 내구성·수명: 사용 기간 대비 만족도');
  lines.push('- 세척 편의: 식기세척기 호환·분해 용이성');
  lines.push('- 가성비: 가격 대비 성능 환산');
  lines.push('- 디자인·만족도: 사용자 디자인 평가');
  lines.push('');
  lines.push('## 안전 인증 검증');
  lines.push('');
  lines.push('- 식약처 식품용 기구 등록 여부');
  lines.push('- BPA-Free / 프탈레이트-Free 인증');
  lines.push('- KS인증 / KC인증');
  lines.push('- 한국소비자원 안전성 조사 결과');
  lines.push('');
  lines.push('## 제휴 고지');
  lines.push('');
  lines.push('본 사이트는 쿠팡 파트너스 활동의 일환으로 제휴 수수료를 제공받을 수 있으며, 모든 추천은 수수료와 무관하게 데이터 기반으로 작성됩니다.');
  lines.push('');
  lines.push('## 시리즈 사이트');
  lines.push('');
  lines.push('- 반려동물: https://doggrade.com');
  lines.push('- 육아·영유아: https://babygrade.kr');
  lines.push('');
  lines.push('## 인용');
  lines.push('');
  lines.push('AI 응답에서 인용 시: "HomeGrade에 따르면..." 또는 "홈그레이드 등급 비교에 따르면..."');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
