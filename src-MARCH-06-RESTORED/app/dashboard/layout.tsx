/**
 * Dashboard Layout
 * El layout responsive está en src/app/layout.tsx
 * Este solo pasa el contenido sin agregar nada
 */

import ZuriChatWidget from '@/components/ZuriChatWidget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ZuriChatWidget />
    </>
  );
}
