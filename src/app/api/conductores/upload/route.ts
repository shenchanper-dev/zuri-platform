// API: Upload y Delete de Fotos de Conductores
// Archivo: src/app/api/conductores/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'zuri',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'zuri_db',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Directorio donde se guardarán las fotos (dentro de /public)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'conductores');
const PUBLIC_BASE_URL = '/uploads/conductores'; // URL pública para acceder a las fotos

/**
 * POST /api/conductores/upload
 * Sube foto de perfil del conductor, la guarda físicamente y actualiza la base de datos (URL y nombre de archivo).
 */
export async function POST(request: NextRequest) {
  let client;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conductorId = formData.get('conductorId') as string;

    // 1. Validaciones iniciales
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No se subió ningún archivo.' }, { status: 400 });
    }
    if (!conductorId || isNaN(parseInt(conductorId))) {
      return NextResponse.json({ error: 'ID del conductor es requerido y debe ser un número válido.' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten archivos JPG, PNG o GIF.' }, { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo es demasiado grande (máximo 5MB).' }, { status: 400 });
    }

    // 2. Preparación de nombres y ruta
    const extension = path.extname(file.name).toLowerCase();
    const filename = `${conductorId}-${Date.now()}${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const publicUrl = `${PUBLIC_BASE_URL}/${filename}`;

    // 3. Asegurar que el directorio de subida exista
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // 4. Leer el archivo y guardarlo físicamente
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 5. Conectar a la BD y actualizar el registro (Usando la tabla de Info Adicional)
    client = await pool.connect();

    // Eliminar foto anterior si existe
    const deleteOldPhoto = await client.query(
      `SELECT foto_perfil_filename FROM conductor_info_adicional WHERE conductor_id = $1`,
      [parseInt(conductorId)]
    );

    if (deleteOldPhoto.rows.length > 0 && deleteOldPhoto.rows[0].foto_perfil_filename) {
      const oldFilename = deleteOldPhoto.rows[0].foto_perfil_filename;
      const oldFilepath = path.join(UPLOAD_DIR, oldFilename);
      try {
        await (await import('fs/promises')).unlink(oldFilepath);
      } catch (fileError) {
        console.warn(`[WARNING] No se pudo eliminar archivo físico anterior: ${oldFilename}`);
      }
    }


    // El UPSERT lógico a la tabla conductor_info_adicional se debe manejar aquí.
    // Usaremos ON CONFLICT para asegurar que exista o se cree el registro.
    const upsertQuery = `
      INSERT INTO conductor_info_adicional (
        conductor_id, foto_perfil, foto_perfil_filename, fecha_actualizacion_foto
      ) VALUES ($1, $2, $3, NOW())
      ON CONFLICT (conductor_id)
      DO UPDATE SET 
        foto_perfil = EXCLUDED.foto_perfil,
        foto_perfil_filename = EXCLUDED.foto_perfil_filename,
        fecha_actualizacion_foto = EXCLUDED.fecha_actualizacion_foto,
        updated_at = NOW()
      RETURNING foto_perfil;
    `;

    const result = await client.query(upsertQuery, [
      parseInt(conductorId),
      publicUrl,
      filename
    ]);

    // Opcional: También podrías querer actualizar el campo foto_url de la tabla conductores por conveniencia:
    await client.query(
      `UPDATE conductores SET foto_url = $1 WHERE id = $2`,
      [publicUrl, parseInt(conductorId)]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Foto de perfil subida y actualizada correctamente.',
      fotoUrl: result.rows[0].foto_perfil
    });

  } catch (error) {
    console.error('Error al subir la foto de perfil:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar la subida.' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}


/**
 * DELETE /api/conductores/upload (Requiere conductorId en el body)
 * Elimina la foto de perfil del conductor (física y de la base de datos).
 */
export async function DELETE(request: NextRequest) {
    let client;
    try {
        const { conductorId } = await request.json();

        if (!conductorId || isNaN(parseInt(conductorId))) {
            return NextResponse.json({ error: 'ID del conductor es requerido y debe ser válido.' }, { status: 400 });
        }
        
        client = await pool.connect();

        // 1. Obtener información de la foto actual (desde conductor_info_adicional)
        const getPhotoQuery = `
            SELECT foto_perfil, foto_perfil_filename
            FROM conductor_info_adicional
            WHERE conductor_id = $1
        `;
        const photoResult = await client.query(getPhotoQuery, [parseInt(conductorId)]);

        if (photoResult.rows.length === 0 || !photoResult.rows[0].foto_perfil) {
            return NextResponse.json({ success: true, message: 'No hay foto de perfil registrada para este conductor.' });
        }
        
        const { foto_perfil_filename: filename } = photoResult.rows[0];

        // 2. Eliminar archivo físico si existe el nombre de archivo
        if (filename) {
            try {
                const filepath = path.join(UPLOAD_DIR, filename);
                const fs = await import('fs/promises');
                await fs.unlink(filepath);
            } catch (fileError) {
                // Advertencia si no se puede eliminar el archivo físico, pero se continúa con la BD
                console.warn(`[WARNING] No se pudo eliminar archivo físico: ${filename}`, fileError);
            }
        }

        // 3. Limpiar campos en base de datos (conductor_info_adicional y conductores)
        const updateInfoQuery = `
            UPDATE conductor_info_adicional
            SET foto_perfil = NULL, foto_perfil_filename = NULL, fecha_actualizacion_foto = NOW(), updated_at = NOW()
            WHERE conductor_id = $1
        `;
        await client.query(updateInfoQuery, [parseInt(conductorId)]);

        await client.query(
            `UPDATE conductores SET foto_url = NULL WHERE id = $1`,
            [parseInt(conductorId)]
        );

        return NextResponse.json({
            success: true,
            message: 'Foto de perfil eliminada correctamente y campos limpiados.'
        });

    } catch (error) {
        console.error('Error al eliminar la foto de perfil:', error);
        return NextResponse.json({ error: 'Error interno del servidor al eliminar foto.' }, { status: 500 });
    } finally {
        if (client) {
            client.release();
        }
    }
}