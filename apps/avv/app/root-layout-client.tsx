"use client";

import { Providers } from "./providers";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
