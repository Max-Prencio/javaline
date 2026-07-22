# Guía de Deploy — Javaline

## Arquitectura
```
[Browser] → [Vercel (frontend React/Vite)] → [Railway (FastAPI backend)] → [Railway PostgreSQL]
```

---

## Paso 1 — Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) y crea una cuenta (gratis).
2. Haz clic en **New Project → Deploy from GitHub repo**.
3. Conecta tu cuenta de GitHub y selecciona el repo `javaline`.
4. Railway detectará el `Dockerfile` en `backend/`. Si no lo detecta automáticamente:
   - En la configuración del servicio, establece **Root Directory** = `backend`

---

## Paso 2 — Agregar PostgreSQL en Railway

1. Dentro del proyecto, haz clic en **+ Add Service → Database → PostgreSQL**.
2. Railway creará la base de datos y **automáticamente inyectará** `DATABASE_URL` como variable de entorno en el servicio de la API.
3. No necesitas configurar `DATABASE_URL` manualmente — Railway lo hace solo.

---

## Paso 3 — Configurar variables de entorno en Railway

En la pestaña **Variables** del servicio API, agrega:

| Variable | Valor |
|----------|-------|
| `SECRET_KEY` | (genera con: `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `CORS_ORIGINS` | `https://TU-APP.vercel.app` (la URL de tu app en Vercel) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `OPENAI_API_KEY` | (opcional, solo si usas el AI Assistant) |

> `DATABASE_URL` ya viene inyectada automáticamente por Railway — no la agregues manualmente.

---

## Paso 4 — Deploy del backend

Railway hace deploy automáticamente al conectar el repo. Para verificar:

1. Ve a la pestaña **Deployments** y espera que termine.
2. Verás en los logs:
   ```
   ▶ Running database seed...
   OK 3 usuarios creados
   OK 5 productos creados
   ...
   ▶ Starting Javaline API...
   ```
3. Copia la URL pública del servicio (algo como `https://javaline-api-production.up.railway.app`).
4. Prueba el health check: `https://TU-URL.railway.app/health` → debe responder `{"status":"ok","system":"javaline"}`

---

## Paso 5 — Configurar variable en Vercel

1. Ve a [vercel.com](https://vercel.com) → tu proyecto Javaline → **Settings → Environment Variables**.
2. Agrega:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://TU-URL.railway.app` (la URL del Paso 4, sin `/` al final) |

3. Haz **Redeploy** del proyecto en Vercel para que tome la nueva variable.

---

## Paso 6 — Git push final

Desde tu Terminal:

```bash
cd "/Users/maxwelalexanderprenciomartinez/Documents/web project/javaline-main"
git add -A
git commit -m "feat: backend deployment config — Railway + CORS + VITE_API_URL"
git push origin main
```

Vercel y Railway harán deploy automáticamente al detectar el push.

---

## Credenciales iniciales

El seed crea estos usuarios de prueba:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@javaline.com | admin123 | Admin |
| gerente@javaline.com | gerente123 | Manager |
| empleado@javaline.com | empleado123 | Employee |

> **Cambia las contraseñas inmediatamente** después del primer login.

---

## Solución de problemas

**"CORS error" en el browser**
→ Verifica que `CORS_ORIGINS` en Railway incluya exactamente tu URL de Vercel (sin `/` al final).

**"502 Bad Gateway" o timeout**
→ El plan gratuito de Railway puede tardar unos segundos en despertar. Espera y recarga.

**"Could not connect to database"**
→ Verifica que el servicio PostgreSQL esté corriendo en Railway y que `DATABASE_URL` esté inyectada.

**El frontend sigue usando localStorage en lugar del backend**
→ Verifica que `VITE_API_URL` esté configurada en Vercel y que hayas hecho Redeploy después de agregarla.

---

## Actualizar a producción

Cada `git push origin main` activa deploy automático en:
- **Vercel** (frontend)
- **Railway** (backend)

No se necesita hacer nada extra.
