import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Crear directorio si no existe
        const uploadDir = path.join(process.cwd(), 'public', 'conductores');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (error) {
            // El directorio ya existe
        }

        // Generar nombre único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.name.replace(/\.[^/.]+$/, "") + '-' + uniqueSuffix + path.extname(file.name);

        // Guardar en public/conductores
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const fileUrl = `/conductores/${filename}`;

        return NextResponse.json({ success: true, fileUrl });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
    }
}