// Cloudflare Worker entry: 호스트 표준화 후 정적 자산으로 위임한다.
// - www.homegrade.kr → homegrade.kr (301)
// - 이외 경로/호스트는 ASSETS 바인딩으로 그대로 서빙
//
// HTTP→HTTPS 강제는 Cloudflare 대시보드의
// "SSL/TLS → Edge Certificates → Always Use HTTPS" 토글에서 처리한다.
// (Worker 단계에서는 이미 HTTPS 종단 후 도착하므로 코드에서 분기 불가.)

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === 'www.homegrade.kr') {
      url.hostname = 'homegrade.kr';
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
