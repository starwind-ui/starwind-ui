# Tests

This directory contains tests for the Starwind UI components using [Vitest](https://vitest.dev/), following the [Astro testing guidelines](https://docs.astro.build/en/guides/testing/).

## Available Tests

### Alert Component Tests

- **`components/alerts/alert-tests.ts`** - Tests the Alert component's aria-labelledby functionality

## Running Tests

```bash
# Run all tests in watch mode
pnpm test

# Run all tests once
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run specific component tests
pnpm test:alerts
```

## Test Structure

Tests are written using Vitest with TypeScript. Each test file:

1. Uses `describe()` and `it()` blocks for organization
2. Uses `expect()` assertions for testing
3. Follows TypeScript best practices
4. Integrates with Astro's configuration via `getViteConfig()`

## Configuration

The project uses `vitest.config.ts` which extends Astro's Vite configuration:

```typescript
/// <reference types="vitest" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    globals: true,
    environment: "node",
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
  },
});
```

## Directory Structure

```
tests/
├── components/                 # Component tests directory
│   ├── alerts/
│   │   └── alert-tests.ts     # Alert component tests
│   ├── button/
│   │   └── button-tests.ts    # Button component tests (future)
│   └── card/
│       └── card-tests.ts      # Card component tests (future)
└── README.md
```

## Adding New Tests

When adding new component tests:

1. Create a new directory under `components/` for your component (e.g., `components/button/`)
2. Create a test file with the pattern `[component-name]-tests.ts`
3. Use TypeScript and Vitest syntax
4. Follow the existing test structure and naming conventions
5. Document the test in this README
6. Add a new script to `package.json` for running the specific test (e.g., `test:button`)

## Example Test Structure

```typescript
import { describe, it, expect } from "vitest";

describe("Component Name", function componentTestModule() {
  it("should handle specific case", function testSpecificCase() {
    const result = someFunction("input");
    expect(result).toBe("expected output");
  });
});
```

## Benefits of Vitest

- **Fast**: Built on Vite for speed
- **TypeScript**: Native TypeScript support
- **Astro Integration**: Works seamlessly with Astro projects
- **Modern**: ESM support and modern JavaScript features
- **Developer Experience**: Great error messages and debugging tools
