/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MAX_VIOLATIONS: string;
  readonly VITE_MIN_RECOVERY_TIME_MS: string;
  readonly VITE_AUTO_SAVE_INTERVAL_MS: string;
  readonly VITE_ENABLE_FULLSCREEN: string;
  readonly VITE_ENABLE_COPY_PASTE_BLOCK: string;
  readonly VITE_ENABLE_TAB_SWITCH_DETECTION: string;
  readonly VITE_ENABLE_DEVTOOLS_DETECTION: string;
  readonly VITE_ENABLE_RIGHT_CLICK_BLOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
