// src/app/api/conductores/upload-foto/route.ts
// API UPLOAD FOTOS CONDUCTORES - Sistema ZURI NEMT

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Client } from 'pg';

const dbConfig = {
  connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
};

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'conductores');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Crear directorio si no existe
async function ensureUploadDir() {
  try {
    const fs = require('fs').promises;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creando directorio de upload:', error);
  }
}

// POST: Subir foto
export async function POST(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    console.log('📸 [API-Upload] Iniciando upload de foto...');
    
    // Obtener form data
    const formData = await request.formData();
    const file = formData.get('foto') as File;
    const conductorId = formData.get('conductorId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se encontró archivo', success: false },
        { status: 400 }
      );
    }

    if (!conductorId) {
      return NextResponse.json(
        { error: 'ID de conductor requerido', success: false },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use JPG, PNG o WEBP', success: false },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Archivo muy grande. Máximo 5MB', success: false },
        { status: 400 }
      );
    }

    // Conectar a BD para verificar que el conductor existe
    client = new Client(dbConfig);
    await client.connect();

    const conductorCheck = await client.query(
      'SELECT id, nombres, apellidos FROM conductores WHERE id = $1',
      [parseInt(conductorId)]
    );

    if (conductorCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conductor no encontrado', success: false },
        { status: 404 }
      );
    }

    const conductor = conductorCheck.rows[0];

    // Generar nombre único para el archivo
    const fileExtension = path.extname(file.name) || '.jpg';
    const timestamp = Date.now();
    const fileName = `conductor_${conductorId}_${timestamp}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const relativeUrl = `/uploads/conductores/${fileName}`;

    console.log(`📁 [API-Upload] Guardando archivo: ${fileName}`);

    // Asegurar que el directorio existe
    await ensureUploadDir();

    // Convertir File a Buffer y guardar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Actualizar BD con la URL de la foto
    await client.query(
      'UPDATE conductores SET foto_url = $1, updatedAt = NOW() WHERE id = $2',
      [relativeUrl, parseInt(conductorId)]
    );

    console.log(`✅ [API-Upload] Foto guardada para conductor: ${conductor.nombres} ${conductor.apellidos}`);

    return NextResponse.json({
      success: true,
      fotoUrl: relativeUrl,
      fileName,
      fileSize: file.size,
      message: 'Foto subida exitosamente'
    });

  } catch (error) {
    console.error('❌ [API-Upload] Error:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// DELETE: Eliminar foto
export async function DELETE(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const conductorId = searchParams.get('conductorId');

    if (!conductorId) {
      return NextResponse.json(
        { error: 'ID de conductor requerido', success: false },
        { status: 400 }
      );
    }

    console.log(`🗑️ [API-Upload] Eliminando foto conductor ID: ${conductorId}`);

    // Conectar a BD
    client = new Client(dbConfig);
    await client.connect();

    // Obtener la URL actual de la foto
    const conductorQuery = await client.query(
      'SELECT id, nombres, apellidos, foto_url FROM conductores WHERE id = $1',
      [parseInt(conductorId)]
    );

    if (conductorQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conductor no encontrado', success: false },
        { status: 404 }
      );
    }

    const conductor = conductorQuery.rows[0];
    const currentFotoUrl = conductor.foto_url;

    if (currentFotoUrl) {
      // Eliminar archivo físico
      const fileName = path.basename(currentFotoUrl);
      const filePath = path.join(UPLOAD_DIR, fileName);

      if (existsSync(filePath)) {
        await unlink(filePath);
        console.log(`🗂️ [API-Upload] Archivo eliminado: ${fileName}`);
      }
    }

    // Limpiar URL en BD
    await client.query(
      'UPDATE conductores SET foto_url = NULL, updatedAt = NOW() WHERE id = $1',
      [parseInt(conductorId)]
    );

    console.log(`✅ [API-Upload] Foto eliminada para conductor: ${conductor.nombres} ${conductor.apellidos}`);

    return NextResponse.json({
      success: true,
      message: 'Foto eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ [API-Upload] Error al eliminar:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// GET: Obtener info de foto
export async function GET(request: NextRequest) {
  let client: Client | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const conductorId = searchParams.get('conductorId');

    if (!conductorId) {
      return NextResponse.json(
        { error: 'ID de conductor requerido', success: false },
        { status: 400 }
      );
    }

    // Conectar a BD
    client = new Client(dbConfig);
    await client.connect();

    const result = await client.query(
      'SELECT id, nombres, apellidos, foto_url FROM conductores WHERE id = $1',
      [parseInt(conductorId)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Conductor no encontrado', success: false },
        { status: 404 }
      );
    }

    const conductor = result.rows[0];
    const fotoUrl = conductor.foto_url;
    let fotoExists = false;
    let fileSize = 0;

    if (fotoUrl) {
      const fileName = path.basename(fotoUrl);
      const filePath = path.join(UPLOAD_DIR, fileName);
      
      if (existsSync(filePath)) {
        fotoExists = true;
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
      }
    }

    return NextResponse.json({
      success: true,
      conductor: {
        id: conductor.id,
        nombres: conductor.nombres,
        apellidos: conductor.apellidos
      },
      foto: {
        url: fotoUrl,
        exists: fotoExists,
        size: fileSize
      }
    });

  } catch (error) {
    console.error('❌ [API-Upload] Error al obtener info:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}