/// <reference types="vite/client" />

// Extend ImportMeta for environments without Vite types
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
