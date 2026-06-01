// Cloudflare Worker entry: 호스트 표준화 + robots.txt 강제 서빙 + 이미지 프록시 후 정적 자산 위임.
// - www.homegrade.kr → homegrade.kr (301)
// - /robots.txt 는 Worker가 직접 응답 (Cloudflare Content Signals prepend 우회 시도)
// - /img/<base64url-coupang-url>(.ext) → 쿠팡 이미지를 자체 도메인으로 프록시 + 1년 캐시
// - 그 외 모든 요청은 ASSETS 바인딩으로 정적 자산 서빙
//
// HTTP→HTTPS 강제는 Cloudflare 대시보드의
// "SSL/TLS → Edge Certificates → Always Use HTTPS" 토글에서 처리한다.

interface Env {
  ASSETS: Fetcher;
}

// ⚠️ src/utils/image-proxy.ts 의 ALLOWED_HOSTS 와 동기화 유지
const ALLOWED_IMAGE_HOSTS = new Set([
  'ads-partners.coupang.com',
  'image1.coupangcdn.com',
  'image2.coupangcdn.com',
  'image3.coupangcdn.com',
  'image4.coupangcdn.com',
  'image5.coupangcdn.com',
  'image6.coupangcdn.com',
  'image7.coupangcdn.com',
  'image8.coupangcdn.com',
  'image9.coupangcdn.com',
  'image10.coupangcdn.com',
  'static.coupangcdn.com',
  'thumbnail6.coupangcdn.com',
  'thumbnail7.coupangcdn.com',
  'thumbnail8.coupangcdn.com',
  'thumbnail9.coupangcdn.com',
  'thumbnail10.coupangcdn.com',
]);

function decodeUrl(encoded: string): string | null {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    return atob(b64 + pad);
  } catch {
    return null;
  }
}

async function handleImageProxy(request: Request, encoded: string): Promise<Response> {
  const src = decodeUrl(encoded);
  if (!src) return new Response('bad request', { status: 400 });

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return new Response('bad url', { status: 400 });
  }
  if (target.protocol !== 'https:') return new Response('https only', { status: 400 });
  if (!ALLOWED_IMAGE_HOSTS.has(target.hostname)) {
    return new Response('host not allowed', { status: 400 });
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(request.url, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(target.toString(), {
    cf: { cacheTtl: 31536000, cacheEverything: true },
    headers: { 'User-Agent': 'homegrade-image-proxy/1.0' },
  });

  if (!upstream.ok) {
    return new Response('upstream error', { status: upstream.status });
  }

  const ct = upstream.headers.get('content-type') || 'image/jpeg';
  const headers = new Headers({
    'content-type': ct,
    'cache-control': 'public, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
    'access-control-allow-origin': '*',
  });

  const response = new Response(upstream.body, { status: 200, headers });
  await cache.put(cacheKey, response.clone());
  return response;
}

const ROBOTS_TXT = `User-agent: *
Allow: /

# AI 크롤러 전체 허용
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Anthropic
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: https://homegrade.kr/sitemap-index.xml
`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host.startsWith('www.')) {
      url.hostname = host.replace(/^www\./, '');
      return Response.redirect(url.toString(), 301);
    }

    // 구 한글 카테고리 슬러그 → 영문 (301 영구) — src/utils/categories.ts 와 동기화
    const CATEGORY_SLUG: Record<string, string> = {
      '주방': 'kitchen', '욕실': 'bathroom', '청소': 'cleaning',
      '소모품': 'consumables', '가전': 'appliance', '기타': 'etc',
    };
    const catMatch = url.pathname.match(/^\/category\/([^/]+)\/?$/);
    if (catMatch) {
      const seg = decodeURIComponent(catMatch[1]);
      if (CATEGORY_SLUG[seg]) {
        url.pathname = `/category/${CATEGORY_SLUG[seg]}/`;
        return Response.redirect(url.toString(), 301);
      }
    }

    if (url.pathname === '/robots.txt') {
      return new Response(ROBOTS_TXT, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=300, must-revalidate',
        },
      });
    }

    // /img/<base64url>(.ext) → 쿠팡 이미지 프록시
    const imgMatch = url.pathname.match(/^\/img\/([A-Za-z0-9_-]+)(?:\.[a-z]{2,4})?$/);
    if (imgMatch) return handleImageProxy(request, imgMatch[1]);

    return env.ASSETS.fetch(request);
  },
};
