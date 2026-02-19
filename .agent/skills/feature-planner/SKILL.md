---
name: feature-planner
description: Guide for analyzing requirements and planning the implementation of new features in the PowerPlay project.
---

# Feature Planner Skill

This skill helps you systematically plan and design new features for PowerPlay. Use this when the user asks for "implementation ideation" or when starting a complex task from the roadmap in `AGENTS.md`.

## 1. 🎯 Requirement Analysis & Checklist

Before writing any code, clarify the requirements using this checklist:

- [ ] **User Story**: Who is the user? What do they want to achieve? Why?
- [ ] **Impact Analysis**: Which existing components or pages will be affected?
- [ ] **Data Requirements**: Do we need new tables or columns? (See Section 2)
- [ ] **i18n**: Does this feature require new text? (Check `messages/ko.json`, `messages/en.json`)
- [ ] **Mobile/Desktop**: How should it look on mobile vs desktop? (PowerPlay is mobile-first)
- [ ] **Roadmap Alignment**: Is this in `AGENTS.md` roadmap? If so, what is the P-priority?

## 2. 🗄️ Database Schema Design

If the feature requires data storage changes, follow these steps:

1.  **Check Existing Schema**: Review `sql/` folder to understand current tables.
2.  **Versioning**: Create a new SQL file in `sql/` with following format:
    - `v{NextNumber}_{description}.sql` (e.g., `v24_add_waiting_list.sql`)
3.  **RLS Policies**: **CRITICAL**. Always define Row Level Security policies.
    - `user`: Can they read/write their own data?
    - `admin`: Can they manage their club/match?
    - `superuser`: Can they manage EVERYTHING? (See `v22_superuser_matches_fix.sql` for reference)
4.  **Performance**: Add indexes for frequently queried columns.

## 3. 🏗️ Implementation Strategy (The "Set" Approach)

PowerPlay features often require updates across 4 layers. Plan for each:

### A. User Side (`src/app/[locale]/(public)`)
- Where will the user access this feature?
- Do we need a new page or a modal?
- **Key Components**: Re-use existing UI components where possible (e.g., `MatchCard`, `RinkMap`).

### B. Admin Side (`src/app/[locale]/(admin)`)
- Does the admin need to manage this data?
- Add relevant CRUD pages or tabs in the admin dashboard.

### C. Server Actions (`src/app/actions`)
- Create/Update actions in `src/app/actions/{entity}.ts`.
- **Caching**: If updating data that is cached (e.g. match list), you MUST update `src/app/actions/cache.ts` or revalidate tags.

### D. i18n (`messages/*.json`)
- Plan the keys structure (e.g., `featureName.label`, `featureName.error`).
- Ensure both English and Korean are planned.

## 4. 📝 Output Template

When the user asks for an implementation plan, provide a markdown response with this structure:

```markdown
# 🏗️ Implementation Plan: [Feature Name]

## 1. Goal
(Brief description)

## 2. Schema Changes (if any)
- `sql/vXX_name.sql`:
    - Add table `...`
    - Add column `...` to `profiles`

## 3. UI/UX
- **User**: Add button on `MatchDetail` component...
- **Admin**: Add new tab in `AdminDashboard`...

## 4. Action Plan
1. [Schema] Create SQL migration
2. [i18n] Add translation keys
3. [Server] Implement `actionName` in `actions/file.ts`
4. [Client] Create UI components
5. [Verify] Test flow
```

## 5. ⚠️ Special Considerations for PowerPlay

- **Timezone**: dates must be handled in KST (Asia/Seoul).
- **Notifications**: If this feature triggers a notification, check `notification-pattern` skill.
- **Rules**: Always check `AGENTS.md` for "Critical Development Guidelines".
