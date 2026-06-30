### Task 1: Project Scaffolding

**Files:**
- Create: (entire project via `npx create-next-app`)
- Create: `src/lib/prisma.ts`
- Create: `src/lib/utils.ts`
- Modify: `tailwind.config.ts`
- Modify: `tsconfig.json`
- Create: `.env`

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Choose: TypeScript Yes, ESLint Yes, Tailwind Yes, `src/` directory Yes, App Router Yes, import alias `@/*` Yes

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npm install -D @types/node
npx shadcn@latest init
```

When shadcn prompts: choose "New York" style, "Zinc" base color, CSS variables for theming.

- [ ] **Step 3: Install shadcn components needed**

```bash
npx shadcn@latest add button card input label select table dialog form toast separator avatar badge textarea
```

- [ ] **Step 4: Create Prisma client singleton**

`src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Create utility file**

`src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: Create .env**

`.env`:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 7: Verify project runs**

```bash
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000
