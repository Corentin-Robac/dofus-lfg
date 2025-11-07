// src/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // You can pass a `session` prop here if you fetch it on the server,
  // but it's fine to omit — the provider will hydrate client-side.
  return <SessionProvider>{children}</SessionProvider>;
}
