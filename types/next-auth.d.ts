// types/next-auth.d.ts
import type { UserRole, Locale } from "@/types/index";

// Auth.js v5 re-exports Session/User/JWT from @auth/core via `export
// type { ... }`, which does not participate in declaration merging.
// The augmentation has to target the original declaring module.
declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      locale: Locale;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: UserRole;
    locale?: Locale;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    role?: UserRole;
    locale?: Locale;
  }
}
