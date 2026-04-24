/**
 * 이메일 HTML 템플릿 렌더러
 * 인라인 CSS 기반 모바일 반응형 단일 함수
 */
export function renderEmailHtml(
  title: string,
  body: string,
  ctaUrl?: string
): string {
  const ctaButton = ctaUrl
    ? `
      <div style="text-align:center;margin:32px 0 8px;">
        <a href="${ctaUrl}"
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
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="max-width:520px;background:#ffffff;border-radius:12px;
                      box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden;">
          <!-- 헤더 -->
          <tr>
            <td style="background:#1e3a5f;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;
                        letter-spacing:-0.02em;">
                ⚡ PowerPlay
              </p>
            </td>
          </tr>
          <!-- 본문 -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;
                         line-height:1.4;">
                ${title}
              </h2>
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">
                ${body.replace(/\n/g, "<br />")}
              </p>
              ${ctaButton}
            </td>
          </tr>
          <!-- 푸터 -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                PowerPlay | 아이스하키 동호회 운영 플랫폼<br />
                이 메일은 발신 전용입니다. 문의: support@powerplay.kr
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
