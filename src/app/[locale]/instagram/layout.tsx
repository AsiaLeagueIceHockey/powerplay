import localFont from "next/font/local";
import type { CSSProperties, ReactNode } from "react";

// Ship the full Korean variable font with the app; CI must not depend on OS fonts
// or a third-party font CDN. Keep this download scoped to exported stories.
const storyFont = localFont({
  src: "../../../../public/fonts/pretendard/PretendardVariable.woff2",
  weight: "100 900",
  display: "block",
  preload: true,
  adjustFontFallback: false,
});

export default function InstagramLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-instagram-font={storyFont.style.fontFamily}
      className={storyFont.className}
      style={{
        // Existing story canvases use font-sans, which resolves this variable.
        "--font-pretendard": storyFont.style.fontFamily,
        fontSynthesis: "none",
      } as CSSProperties}
    >
      {children}
    </div>
  );
}
