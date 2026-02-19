---
name: testing-guide
description: Guide for writing and running tests in PowerPlay using Vitest.
---

# Testing Guide Skill

This skill guides you through the testing process in PowerPlay. While there is no strict "Test Driven Development" mandate, writing tests for complex logic (especially parsers and utilities) is highly recommended.

## 1. 🧪 Test Stack

- **Framework**: Vitest (Compatible with Jest API)
- **Environment**: jsdom (for React components), node (for logic)
- **Testing Library**: `@testing-library/react`
- **Location**: `tests/` directory (or co-located `__tests__` folders)

## 2. 🏃 Running Tests

Since there is no default `test` script in `package.json`, use:

```bash
npx vitest
```

Or for a specific file:
```bash
npx vitest tests/my-test.test.ts
```

## 3. 📂 Structure & Strategy

### A. Unit Tests (Recommended)
- **Target**: Utility functions, Parsers, Helpers.
- **Path**: `tests/unit/` or next to the file e.g., `src/utils/__tests__/parser.test.ts`
- **Example**: Testing `parseMatchText` function.

```typescript
import { describe, it, expect } from 'vitest';
import { parseMatchText } from '@/utils/parser';

describe('parseMatchText', () => {
  it('should extract date correctly', () => {
    const result = parseMatchText('10/10 22:00 ...');
    expect(result.date).toBe('2024-10-10');
  });
});
```

### B. Server Action Tests (Advanced)
- **Target**: `src/app/actions/*.ts`
- **Challenge**: Requires mocking Supabase.
- **Strategy**: 
    1. Mock `createClient` from `@/lib/supabase/server`.
    2. Use `vi.mock` to intercept DB calls.

```typescript
import { vi, describe, it, expect } from 'vitest';
import { getMatches } from '@/app/actions/match';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: () => ({ data: [], error: null })
    })
  }))
}));
```

## 4. 🤖 Dealing with AI Non-Determinism in Tests

When testing AI-generated content or parsers:
- **Loose Assertions**: Use `expect.stringContaining()`, `expect.any(String)`.
- **avoid**: Strict equality check on long generated strings.

## 5. ⚠️ Key Rules

1.  **Don't test the framework**: Don't test if Next.js routiing works. Test YOUR logic.
2.  **Mock External APIs**: Never call real Naver Maps or OpenAI API in tests.
3.  **Clean up**: Where possible, use `beforeEach` / `afterEach` to reset mocks.
