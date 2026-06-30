# Task 1 Fix Report

## Issue 1: Missing `form` component

**What happened:** Ran `npx shadcn@latest add form` to install the missing form component. The component's registry entry for the `base-nova` style (used by this project) is an empty placeholder with no files or dependencies. The `new-york` and `default` styles have the full implementation (using `@radix-ui/react-label`, `@radix-ui/react-slot`, `react-hook-form`, `zod`), but `base-nova` (which uses `@base-ui/react`) does not.

**Commands run:**
- `npx shadcn@latest add form` — resolved but showed "No changes" in dry-run mode; empty registry entry
- `npx shadcn@latest add form --dry-run --diff` — confirmed "No changes"
- `npx shadcn@latest --version` — CLI is v4.12.0
- Checked registry at `https://ui.shadcn.com/r/styles/base-nova/form.json` — returns only `{"name":"form","type":"registry:ui"}` with no files

**Status:** BLOCKED — `form` not available in `base-nova` style registry. The component needs to be implemented manually or the project needs to switch to a style that supports it.

## Issue 2: `shadcn` in production dependencies

**What happened:** Moved `shadcn` (`^4.12.0`) from `dependencies` to `devDependencies`, since it is a build-time CLI tool.

**Commands run:**
- Edited `package.json` — removed line `"shadcn": "^4.12.0"` from dependencies, added it to devDependencies

**Files changed:**
- `package.json` — `shadcn` moved to devDependencies
