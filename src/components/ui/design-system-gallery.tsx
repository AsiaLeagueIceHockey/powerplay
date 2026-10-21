"use client";

import { useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Check, Heart, Loader2, X } from "lucide-react";
import { Badge, Button, Field, FilterChip, IconButton, Input, LinkButton, ModalSurface, SegmentedControl, SegmentedItem, Select, SheetSurface, Surface, Textarea } from "./index";
import { surfaceStyles, type ButtonVariant } from "./styles";

const themes = ["powerplay", "lounge", "youth"] as const;
const variants: ButtonVariant[] = ["primary", "navy", "secondary", "outline", "ghost", "danger", "success", "warning", "cheer", "points", "kakao", "naver"];
const copy = {
  ko: { title: "파워플레이 디자인 시스템", save: "저장하기", club: "아주 긴 이름을 가진 서울 아이스하키 동호회", label: "동호회 이름", help: "다른 하키 선수에게 표시되는 이름입니다.", error: "동호회 이름을 입력해주세요.", search: "동호회 검색", list: "목록", map: "지도", calendar: "캘린더", empty: "검색 결과가 없습니다.", close: "닫기", retry: "다시 시도", failed: "정보를 불러오지 못했습니다.", dialog: "참가 신청 확인", sheet: "지역 선택", selected: "선택됨", description: "이 페이지는 고정된 예시만 사용합니다. 실제 신청이나 결제는 발생하지 않습니다." },
  en: { title: "PowerPlay design system", save: "Save changes", club: "Seoul International Ice Hockey Club with a very long team name", label: "Club name", help: "The name other hockey players will see.", error: "Please enter a club name.", search: "Search clubs", list: "List", map: "Map", calendar: "Calendar", empty: "No results found.", close: "Close", retry: "Try again", failed: "Could not load the information.", dialog: "Confirm your application", sheet: "Choose a region", selected: "Selected", description: "Fixed examples only. No real applications or payments are made." },
};

/** A deterministic, development-only playground; no auth, actions, chat or live data. */
export function DesignSystemGallery() {
  const [locale, setLocale] = useState<"ko" | "en">("ko");
  const [theme, setTheme] = useState<(typeof themes)[number]>("powerplay");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(false);
  const [dialog, setDialog] = useState<"modal" | "sheet" | null>(null);
  const [saved, setSaved] = useState(false);
  const t = copy[locale];
  const Dialog = dialog === "sheet" ? SheetSurface : ModalSurface;

  return <NextIntlClientProvider locale={locale} messages={{}}>
    <main className="pp-ui pp-gallery" data-ui-theme={theme} data-ui-mode={mode} lang={locale}>
      <div className="mx-auto max-w-5xl space-y-6 p-4 pb-24 sm:p-6 sm:pb-24">
        <header className="space-y-3">
          <h1 className="pp-text-title">{t.title}</h1>
          <p className="pp-text-body text-pp-muted">{t.description}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id="gallery-theme" label="Theme"><Select data-testid="theme" value={theme} onChange={e => setTheme(e.target.value as typeof theme)}>{themes.map(name => <option key={name}>{name}</option>)}</Select></Field>
            <Field id="gallery-locale" label="Language"><Select data-testid="locale" value={locale} onChange={e => setLocale(e.target.value as typeof locale)}><option value="ko">한국어</option><option value="en">English</option></Select></Field>
            <Field id="gallery-mode" label="Appearance"><Select data-testid="mode" value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="light">Light</option><option value="dark">Dark</option></Select></Field>
          </div>
        </header>
        <Surface className="space-y-4">
          <h2 className="pp-text-heading">Buttons</h2>
          <div className="flex flex-wrap gap-3">{variants.map(variant => <Button key={variant} variant={variant}>{variant}</Button>)}</div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="compact">36px</Button><Button>44px</Button><Button size="large">56px</Button>
            <Button size="club" variant="cheer"><Heart className="pp-club-action-icon" /><span className="pp-action-label">{locale === "ko" ? "응원하기" : "Cheer"}</span></Button>
            <IconButton label={t.close}><X className="pp-action-icon" /></IconButton>
            <Button loading><Loader2 className="pp-action-icon animate-spin" />Loading</Button><Button disabled>Disabled</Button>
            <LinkButton prefetch={false} href="/clubs" locale={locale} variant="outline">{locale === "ko" ? "동호회" : "Clubs"}</LinkButton>
          </div>
          <Button fullWidth><span className="pp-action-label">{t.club}</span></Button>
        </Surface>
        <Surface className="space-y-4">
          <h2 className="pp-text-heading">Fields</h2>
          <form onSubmit={event => { event.preventDefault(); setSaved(true); }} className="grid gap-4 sm:grid-cols-2">
            <Field id="club-name" label={t.label} help={t.help}><Input name="club" defaultValue={t.club} /></Field>
            <Field id="club-error" label={t.label} error={t.error}><Input name="invalid-club" /></Field>
            <Field id="club-disabled" label="Disabled"><Input disabled defaultValue={t.club} /></Field>
            <Field id="club-level" label={locale === "ko" ? "경험" : "Experience"}><Select><option>{locale === "ko" ? "입문" : "Beginner"}</option><option>Intermediate</option></Select></Field>
            <Field id="club-bio" label={locale === "ko" ? "소개" : "Description"}><Textarea defaultValue={t.club} /></Field>
            <div className="self-end"><Button type="submit" fullWidth>{saved ? <Check className="pp-action-icon" /> : null}{t.save}</Button></div>
          </form>
        </Surface>
        <Surface className="space-y-4">
          <h2 className="pp-text-heading">Filters and status</h2>
          <div className="flex flex-wrap gap-2"><FilterChip selected={selected} onClick={() => setSelected(!selected)}>{t.selected}</FilterChip><FilterChip disabled>Disabled</FilterChip></div>
          <SegmentedControl label="View">{["list", "map", "calendar"].map(item => <SegmentedItem key={item} selected={view === item} onClick={() => setView(item)}>{t[item as "list" | "map" | "calendar"]}</SegmentedItem>)}</SegmentedControl>
          <div className="flex flex-wrap gap-2">{(["neutral", "brand", "success", "warning", "danger", "info", "cheer"] as const).map(tone => <Badge key={tone} tone={tone}>{tone}</Badge>)}</div>
          <Field id="gallery-search" label={t.search}><Input type="search" placeholder={t.search} /></Field>
          <p className="pp-text-body text-pp-muted">{t.empty}</p>
          <div role="alert" className="pp-text-body text-pp-danger">{t.failed}</div><Button variant="outline">{t.retry}</Button>
        </Surface>
        <div className="grid gap-4 sm:grid-cols-2">
          <Surface tone="muted"><h2 className="pp-text-heading">{t.club}</h2><p className="pp-text-body text-pp-muted">Static panel</p></Surface>
          <Link prefetch={false} href="/clubs" locale={locale} data-testid="interactive-card" className={surfaceStyles({ interactive: true })}><h2 className="pp-text-heading">{locale === "ko" ? "동호회 둘러보기" : "Browse clubs"}</h2><p className="pp-text-body text-pp-muted">Hover / keyboard focus</p></Link>
        </div>
        <div className="flex flex-wrap gap-3"><Button onClick={() => setDialog("modal")}>Modal</Button><Button variant="outline" onClick={() => setDialog("sheet")}>Sheet</Button></div>
      </div>
      {dialog && <div className="pp-gallery-backdrop" onKeyDown={e => { if (e.key === "Escape") setDialog(null); }}>
        <Dialog titleId="gallery-dialog-title" density="roomy" className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-between gap-4"><h2 id="gallery-dialog-title" className="pp-text-heading">{dialog === "sheet" ? t.sheet : t.dialog}</h2><IconButton label={t.close} onClick={() => setDialog(null)}><X className="pp-action-icon" /></IconButton></div>
          <p className="pp-text-body">{t.club}</p><Button fullWidth onClick={() => setDialog(null)}>{t.close}</Button>
        </Dialog>
      </div>}
    </main>
  </NextIntlClientProvider>;
}
