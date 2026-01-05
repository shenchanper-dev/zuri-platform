/**
 * Leaflet TypeScript Declarations
 * Fix para MapaConductores.tsx
 */

declare module 'leaflet' {
  interface Icon {
    Default: {
      prototype: any;
      mergeOptions(options: any): void;
    };
  }
  
  namespace Icon {
    class Default {
      static prototype: any;
      static mergeOptions(options: any): void;
    }
  }
}
