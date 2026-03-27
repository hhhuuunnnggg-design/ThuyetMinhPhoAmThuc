/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin công khai cho QR POI (vd. http://192.168.1.5:3000 khi test trên điện thoại). Mặc định: window.location.origin */
  readonly VITE_PUBLIC_QR_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
