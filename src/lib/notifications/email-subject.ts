/**
 * 이메일 제목 변환기 — 푸시용 짧은 제목을 이메일 inbox에 어울리는 정중한 제목으로 변환한다.
 * - 본문 h2 (renderEmailHtml 의 title) 은 푸시 스타일 그대로 유지
 * - Resend subject 필드에만 이 변환을 적용
 * - 매핑에 없는 제목은 이모지를 제거하고 `[PowerPlay] ` 접두사만 붙임
 */

const SUBJECT_MAP: Record<string, string> = {
  // 매칭 참가
  "새 게스트": "[PowerPlay] 새로운 게스트가 참가했어요",
  "새 참가자": "[PowerPlay] 새로운 참가자가 합류했어요",
  "상대팀 매칭 신청": "[PowerPlay] 상대팀 매칭 신청이 도착했어요",
  "팀 매칭 확정": "[PowerPlay] 팀 매칭이 확정되었어요",
  "게스트 참가 확정": "[PowerPlay] 게스트 참가가 확정되었어요",
  "경기 참가 확정": "[PowerPlay] 경기 참가가 확정되었어요",

  // 취소
  "팀 매칭 취소": "[PowerPlay] 팀 매칭이 취소되었어요",
  "신청 취소 완료": "[PowerPlay] 경기 신청이 취소되었어요",
  "취소 완료": "[PowerPlay] 경기 참가가 취소되었어요",
  "대기 취소 완료": "[PowerPlay] 대기 신청이 취소되었어요",
  "취소 완료 (환불 불가)": "[PowerPlay] 경기 참가가 취소되었어요 (환불 불가)",
  "참가자 취소 알림": "[PowerPlay] 참가자가 경기를 취소했어요",

  // 대기
  "대기 전환 및 참가 확정": "[PowerPlay] 대기에서 참가로 전환되었어요",
  "대기 전환 (입금 필요)": "[PowerPlay] 대기 전환 – 결제가 필요해요",
  "대기명단 등록 완료": "[PowerPlay] 대기명단에 등록되었어요",
  "새 대기자": "[PowerPlay] 새로운 대기자가 등록되었어요",

  // 관리자/경기 관리
  "경기 취소 알림": "[PowerPlay] 경기가 취소되었어요",
  "경기 정보 변경 안내": "[PowerPlay] 경기 정보가 변경되었어요",
  "링크장 승인 완료": "[PowerPlay] 링크장 승인이 완료되었어요",

  // 라운지
  "파워플레이 라운지 멤버십 변경 안내": "[PowerPlay] 라운지 멤버십이 변경되었어요",
  "파워플레이 라운지 멤버십 활성화": "[PowerPlay] 라운지 멤버십이 활성화되었어요",

  // 포인트/결제
  "환불 완료": "[PowerPlay] 환불이 완료되었어요",
  "충전 완료": "[PowerPlay] 충전이 완료되었어요",
  "충전 완료 + 경기 확정": "[PowerPlay] 충전 완료 및 경기 확정되었어요",
  "충전 요청 거부": "[PowerPlay] 충전 요청이 거부되었어요",
  "충전 신청 완료": "[PowerPlay] 충전 신청이 접수되었어요",
  "충전 금액 변동 알림": "[PowerPlay] 충전 금액이 변경되었어요",

  // 채팅
  "확인하지 않은 채팅이 있어요": "[PowerPlay] 확인하지 않은 채팅이 있어요",
};

// 이모지, 기호, 트레일링 공백 제거 — 매핑 키 정규화
function stripDecorations(title: string): string {
  return title
    .replace(/[\p{Extended_Pictographic}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[↩️⚡️⏳⏰✅❌📢🚫🏟️🏆💰💬📝🎉🤝🏒📌⭐🔔📧📮🚀🎯⚠️]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toEmailSubject(pushTitle: string): string {
  const stripped = stripDecorations(pushTitle);
  const mapped = SUBJECT_MAP[stripped];
  if (mapped) return mapped;
  // Fallback: 이모지 제거 + [PowerPlay] 접두사
  return `[PowerPlay] ${stripped || pushTitle.trim()}`;
}
