import { Suspense } from 'react';
import ExcelImportacionViewer from '@/components/ExcelImportacionViewer';

export default function ExcelImportacionViewPage({ params }: { params: { id: string } }) {
  const importacionId = parseInt(params.id);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      }
    >
      <ExcelImportacionViewer importacionId={importacionId} />
    </Suspense>
  );
}

