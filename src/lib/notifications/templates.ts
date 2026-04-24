/**
 * 이메일 HTML 템플릿 렌더러
 * - 헤더에 PowerPlay 로고 이미지 사용 (powerplay.kr 호스팅)
 * - 본문 CTA 버튼 + 푸터에 powerplay.kr 바로가기 링크
 * - 인라인 CSS 기반 모바일 반응형
 */

const SITE_URL = "https://powerplay.kr";
const LOGO_URL = `${SITE_URL}/email-logo.png`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderEmailHtml(
  title: string,
  body: string,
  ctaUrl?: string
): string {
  const safeTitle = escapeHtml(title);
  // 본문은 escape 후 \n → <br />
  const safeBody = escapeHtml(body).replace(/\n/g, "<br />");

  const ctaButton = ctaUrl
    ? `
      <div style="text-align:center;margin:32px 0 8px;">
        <a href="${escapeHtml(ctaUrl)}"
           style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;
                  font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;
                  letter-spacing:0.01em;">
          바로가기
        </a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="max-width:520px;background:#ffffff;border-radius:12px;
                      box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden;">
          <!-- 헤더: 흰 배경 + 네이비 하단 라인, 네이비 PowerPlay 로고 -->
          <tr>
            <td align="center"
                style="background:#ffffff;padding:28px 32px 24px;
                       border-bottom:3px solid #1e3a5f;">
              <a href="${SITE_URL}" style="display:inline-block;text-decoration:none;border:0;outline:none;">
                <img src="${LOGO_URL}"
                     alt="PowerPlay"
                     width="180"
                     style="display:block;width:180px;height:auto;border:0;outline:none;text-decoration:none;" />
              </a>
            </td>
          </tr>
          <!-- 본문 -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;
                         line-height:1.4;">
                ${safeTitle}
              </h2>
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
                ${safeBody}
              </p>
              ${ctaButton}
            </td>
          </tr>
          <!-- 푸터 -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px;font-size:13px;color:#374151;line-height:1.6;">
                <a href="${SITE_URL}"
                   style="color:#2563EB;text-decoration:none;font-weight:600;">
                  powerplay.kr 바로가기 →
                </a>
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                PowerPlay | 아이스하키 동호회 운영 플랫폼<br />
                이 메일은 발신 전용입니다. 회신은 처리되지 않습니다.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
