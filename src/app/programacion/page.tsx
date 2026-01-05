"use client";
import { Suspense } from 'react';
import EditorProgramacionContent from '@/components/EditorProgramacionContent';

export default function ProgramacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando programación...</div>
      </div>
    }>
      <EditorProgramacionContent />
    </Suspense>
  );
}
