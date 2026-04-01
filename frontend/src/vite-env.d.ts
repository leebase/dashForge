/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DASHFORGE_ANTHROPIC_API_KEY?: string;
  readonly VITE_DASHFORGE_ANTHROPIC_API_URL?: string;
  readonly VITE_DASHFORGE_ANTHROPIC_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
