# Runbook: 502 + Quirks Mode

## Qué significa realmente
- 502 Bad Gateway: el proxy (Nginx/Apache/Cloudflare) no pudo hablar con tu proceso Next.js (caído, reiniciando, timeout, o upstream equivocado).
- Quirks Mode: el navegador recibió un HTML sin `<!DOCTYPE html>`; típicamente no viene de Next.js, sino de páginas de error del proxy (502/404) o HTML intermedio.

## Diagnóstico rápido (producción)
1. Salud del backend:
   - `GET https://admin.zuri.pe/api/health`
   - Debe responder 200 y `checks.db.ok=true`.
2. Logs del proxy:
   - Busca `upstream prematurely closed connection`, `connect() failed`, `upstream timed out`, `no live upstreams`.
3. Logs del proceso Next:
   - Busca errores de DB (`ECONNREFUSED`, `too many clients`), OOM, o crash loops.

## Causas típicas de 502 en este proyecto
- Exceso de conexiones a Postgres por crear `new Client()` por request en múltiples rutas.
- Timeouts proxy por consultas lentas (o DB saturada).
- WebSocket server (3001) no corriendo o no expuesto; no causa 502 del dashboard, pero sí “real‑time” caído.

## Recomendación Nginx (mínimo)
### Next.js (3000)
```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_read_timeout 60s;
  proxy_connect_timeout 10s;
  proxy_send_timeout 60s;
}
```

### Socket.IO (3001)
```nginx
location /socket.io/ {
  proxy_pass http://127.0.0.1:3001;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 60s;
}
```

## Quirks Mode: cómo eliminarlo
- Si el error es por 502/404: al resolver el upstream/proxy y servir HTML real de Next, desaparece.
- Next App Router ya incluye `<!DOCTYPE html>`; el layout correcto está en `src/app/layout.tsx`.

## Validación final
- En navegador: Network no debe mostrar 502 para `/api/*`.
- En consola: no debe haber “Quirks Mode” al cargar páginas normales.
- `GET /api/health` debe ser estable.

