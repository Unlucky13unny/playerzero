/// <reference types="vite/client" />

// Environment variables are defined elsewhere in a secure manner

// SVG module declarations
declare module "*.svg" {
  const content: string;
  export default content;
}

