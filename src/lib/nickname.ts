/**
 * Generates a random anonymous hockey-themed nickname for parents
 */
export function generateRandomNickname(): string {
  const adjectives = [
    "신나는", "행복한", "용감한", "멋진", "빠른", "날쌘", "튼튼한", "명랑한", "빛나는", "달리는",
    "즐거운", "열정적인", "똑똑한", "든든한", "따뜻한", "꿈꾸는", "푸른", "새로운", "강한", "온화한"
  ];
  const nouns = [
    "하키맘", "하키대디", "하키가족", "아이스맘", "아이스대디", "스케이트", "하키러브", "링크러너",
    "퍽헌터", "슬랩샷", "어시스트", "디펜더", "포워드", "골리맘", "골리대디", "빙상히어로"
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900); // 3 digit number 100-999
  return `${adj}${noun}${num}`;
}
