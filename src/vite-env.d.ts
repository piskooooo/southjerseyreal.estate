/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_LEAD_API_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
