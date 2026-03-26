// src/app/api/uploads/[...path]/route.ts
// API para servir archivos subidos dinámicamente
// Solución definitiva para Next.js production + PM2

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

// MIME types comunes para imágenes
const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
};

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        // Construir ruta del archivo
        const relativePath = params.path.join('/');
        const uploadDirBase = process.env.UPLOAD_DIR || process.cwd();
        const filePath = path.join(uploadDirBase, 'public', 'uploads', relativePath);

        // Verificar que el archivo existe
        try {
            await stat(filePath);
        } catch {
            console.log(`❌ [Upload API] Archivo no encontrado: ${filePath}`);
            return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
        }

        // Leer el archivo
        const fileBuffer = await readFile(filePath);

        // Determinar MIME type
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        // Devolver archivo con headers apropiados
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Length': fileBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('❌ [Upload API] Error:', error.message);
        return NextResponse.json({ error: 'Error al servir archivo' }, { status: 500 });
    }
}
