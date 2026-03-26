import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'conductores';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (error) {
            // El directorio ya existe o error controlado
        }

        // Generar nombre limpio y único
        const timestamp = Date.now();
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/gi, '');
        const extension = path.extname(file.name).toLowerCase() || '.jpg';
        const filename = `${timestamp}-${cleanName}${extension}`;

        // Guardar físicamente
        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const publicUrl = `/api/uploads/${safeFolder}/${filename}`;

        console.log(`✅ Archivo guardado en: ${filepath}`);
        console.log(`🔗 URL pública: ${publicUrl}`);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileUrl: publicUrl // Mantenemos fileUrl por compatibilidad temporal
        });
    } catch (error) {
        console.error('❌ Error en upload:', error);
        return NextResponse.json({ error: 'Error al procesar la subida' }, { status: 500 });
    }
}