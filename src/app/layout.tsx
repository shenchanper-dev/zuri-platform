import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import "../styles/responsive.css";
export const metadata: Metadata = {
  title: 'Zuri Mobility Platform',
  description: 'Intelligent technology for non-emergency medical transportation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ResponsiveLayout>
          {children}
        </ResponsiveLayout>
        <Toaster />
      </body>
    </html>
  );
}
// Legacy functions import for backward compatibility
import { eliminarProgramacion } from '@/utils/legacyFunctions';

// Make functions globally available
if (typeof window !== 'undefined') {
  (window as any).eliminarProgramacion = eliminarProgramacion;
}
if (typeof global !== 'undefined') {
  (global as any).eliminarProgramacion = eliminarProgramacion;
}

