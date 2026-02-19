---
name: ui-component-pattern
description: Guide for creating consistent UI components in PowerPlay, including styling rules and reusable patterns.
---

# UI Component Pattern Skill

This skill defines the visual language and component patterns for PowerPlay. Use this when creating new UI components or refactoring existing ones to ensure consistency.

## 1. 🎨 Core Design Principles (P7 Polish)

Follow these rules strictly to maintain the "Premium & Consistent" look defined in `AGENTS.md`:

- **Border Radius**: Always use `rounded-xl` for cards, inputs, and major containers. Avoid `rounded-lg` or mixed radii.
- **Interactivity**: Add hover effects to clickable elements.
    - Standard: `hover:border-blue-500 hover:shadow-md transition-all duration-200`
- **Shadows**: Use `shadow-sm` for subtle depth, `shadow-md` for meaningful elevation (hover or modals).
- **Colors**:
    - Primary: Blue (`text-blue-600`, `bg-blue-600`) for actions.
    - Neutral: Zinc (`text-zinc-500` for secondary text, `bg-zinc-100` for backgrounds).
    - Danger: Red (`text-red-600`) for destructive actions.

## 2. 📱 Responsive & Dark Mode

PowerPlay is **Mobile-First**.

- **Mobile First**: Write classes for mobile first (e.g., `flex-col`), then override for larger screens (e.g., `md:flex-row`).
- **Dark Mode**: Every component MUST support dark mode.
    - Backgrounds: `bg-white dark:bg-zinc-900`
    - Text: `text-zinc-900 dark:text-zinc-100`
    - Borders: `border-zinc-200 dark:border-zinc-800`

## 3. 🧩 Component Structure

Isolate UI logic into small, reusable components in `src/components/`.

```tsx
"use client"; // Only if interactive
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils"; // Use cn for conditional classes

interface Props {
  className?: string;
  title: string;
}

export function MyComponent({ className, title }: Props) {
  const t = useTranslations("MyComponent");
  
  return (
    <div className={cn(
      "p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
      "hover:shadow-md transition-shadow", // P7 Polish
      className
    )}>
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
  );
}
```

## 4. 🗺️ Common Patterns

- **Cards**: Used for Matches, Rinks, Clubs. `rounded-xl`, `border`, `bg-white`.
- **Lists**: Use `flex flex-col gap-4`.
- **Forms**: Use `Label` + `Input` pattern. Inputs are `rounded-xl`.
- **Modals**: Use existing `Dialog` or `Modal` primitives if available, or stick to `rounded-xl` panel centered on screen with backdrop blur.

## 5. ⚠️ Fonts & Icons

- **Font**: Pretendard (via `var(--font-pretendard)`).
- **Icons**: Lucide React. Import from `lucide-react`.
    - E.g., `import { Calendar, MapPin } from "lucide-react";`

Remember: **Consistency > Creativity** for basic UI elements.
