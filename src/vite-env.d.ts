/// <reference types="vite/client" />
// This file provides type definitions for Vite's client-side environment variables

// Interface defining the shape of environment variables available on import.meta.env
interface ImportMetaEnv {
  // Public key for Paystack integration, prefixed with VITE_ to be exposed to the client
  readonly VITE_PAYSTACK_PUBLIC_KEY: string;
}

// Interface extending the global ImportMeta interface to include the custom env properties
interface ImportMeta {
  // The env object containing the defined environment variables
  readonly env: ImportMetaEnv;
}
