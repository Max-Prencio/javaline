# Guía de Deploy — Javaline Commercial
**Stack:** React 19 / Vite → .NET 9 ASP.NET Core → PostgreSQL 17  
**Plataformas:** Vercel (frontend) + Railway (backend + DB)

---

## Arquitectura

```
[Browser]
   │  HTTPS
   ▼
[Vercel]  ← React 19 / Vite (estático, CDN global)
   │  fetch + cookies httpOnly
   ▼
[Railway]  ← .NET 9 API (Docker, puerto 8080)
   │  Npgsql / TCP
   ▼
[Railway PostgreSQL 17]
```

---

## Checklist pre-deploy

Antes de empezar, confirma que tienes:

- [ ] Cuenta en [railway.app](https://railway.app) (plan Hobby mínimo, ~$5/mes)
- [ ] Cuenta en [vercel.com](https://vercel.com) (plan gratuito suficiente)
- [ ] Cuenta en [sendgrid.com](https://sendgrid.com) (gratuito hasta 100 emails/día)
- [ ] Repo en GitHub (`github.com/Max-Prencio/javaline` o el tuyo)
- [ ] `openssl` disponible en tu terminal (para generar el JWT secret)

---

## PARTE 1 — BASE DE DATOS (Railway PostgreSQL)

### Paso 1.1 — Crear el proyecto en Railway

1. Ve a [railway.app](https://railway.app) → **New Project**
2. Selecciona **Empty Project**
3. Ponle nombre: `javaline-production`

### Paso 1.2 — Agregar PostgreSQL

1. Dentro del proyecto → **+ Add Service → Database → PostgreSQL**
2. Espera 30 segundos a que provisione
3. Haz clic en el servicio PostgreSQL → pestaña **Connect**
4. Copia la variable `PGPASSWORD` (la necesitarás en el paso 1.4)

### Paso 1.3 — Crear usuario de aplicación (least-privilege)

1. En el servicio PostgreSQL → pestaña **Query**
2. Ejecuta este bloque completo (cambia `TU_PASSWORD_AQUI` por una contraseña segura):

```sql
-- Usuario de la app (sin permisos DDL — no puede DROP ni ALTER)
CREATE USER javaline_app WITH PASSWORD 'TU_PASSWORD_AQUI';
GRANT CONNECT ON DATABASE railway TO javaline_app;
GRANT USAGE ON SCHEMA public TO javaline_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO javaline_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO javaline_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO javaline_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO javaline_app;
```

3. Guarda la password en un lugar seguro — la necesitarás en el Paso 2.3

### Paso 1.4 — Aplicar migraciones de seguridad

Las migraciones deben ejecutarse con el usuario `postgres` (superuser) porque
V3 y V4 requieren permisos para activar RLS y crear políticas.

En la pestaña **Query** del servicio PostgreSQL, abre cada archivo en el repo
y copia-pega su contenido en este orden:

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `dotnet-backend/migrations/V2__performance_indexes.sql` | 36 índices en tablas de alto tráfico |
| 2 | `dotnet-backend/migrations/V3__rls.sql` | Row Level Security — usuarios ven solo sus datos |
| 3 | `dotnet-backend/migrations/V4__account_lockout.sql` | Bloqueo de cuenta tras 4 intentos fallidos |

> Ejecuta uno por uno y verifica que cada uno devuelva `... applied successfully`.

### Paso 1.5 — Verificar RLS activo

En **Query**, ejecuta:

```sql
SELECT c.relname AS tabla,
       c.relrowsecurity AS rls_activo,
       c.relforcerowsecurity AS rls_forzado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relrowsecurity = true
ORDER BY c.relname;
```

Debes ver al menos 20 tablas con `rls_activo = true` y `rls_forzado = true`.

---

## PARTE 2 — BACKEND (.NET 9 en Railway)

### Paso 2.1 — Crear servicio backend

1. En tu proyecto Railway → **+ Add Service → GitHub Repo**
2. Selecciona `Max-Prencio/javaline` (o tu fork)
3. En la configuración del servicio:
   - **Root Directory**: `dotnet-backend`
   - Railway detectará el `Dockerfile` automáticamente

### Paso 2.2 — Generar el JWT Secret

En tu terminal local, ejecuta:

```bash
openssl rand -hex 32
```

Copia el resultado (64 caracteres hex). Lo usarás en el siguiente paso.

### Paso 2.3 — Configurar variables de entorno

En el servicio backend → pestaña **Variables** → **Add Variable**:

#### Variables REQUERIDAS (el backend NO inicia sin estas)

| Variable | Valor |
|----------|-------|
| `ConnectionStrings__Default` | `Host=<railway-pg-host>;Port=<puerto>;Database=railway;Username=javaline_app;Password=<password-del-paso-1.3>` |
| `AppSettings__JwtSecret` | El string de 64 chars generado en el paso 2.2 |
| `AppSettings__CorsOrigins` | URL de tu app en Vercel, ej. `https://javaline.vercel.app` (la agregas después del Paso 3) |

> Para obtener `Host` y `Port` de PostgreSQL: servicio PG → **Connect** → sección **Variables** → busca `PGHOST` y `PGPORT`.

#### Variables opcionales recomendadas

| Variable | Valor recomendado |
|----------|-------------------|
| `AppSettings__JwtExpirationMinutes` | `15` |
| `AppSettings__BaseUrl` | URL de tu Vercel (para links en emails) |
| `ASPNETCORE_ENVIRONMENT` | `Production` (ya viene en el Dockerfile) |
| `Email__SmtpHost` | `smtp.sendgrid.net` |
| `Email__SmtpPort` | `587` |
| `Email__SmtpUser` | `apikey` |
| `Email__SmtpPassword` | Tu API Key de SendGrid (ver Parte 4) |
| `Email__From` | `no-reply@tudominio.com` |
| `Email__FromName` | `Javaline` |

### Paso 2.4 — Hacer deploy del backend

1. Railway hace deploy automático al guardar las variables
2. Ve a **Deployments** → espera que el build termine (~3-5 min la primera vez)
3. En **Logs** debes ver:
   ```
   [INF] Background worker started.
   [INF] Now listening on: http://[::]:8080
   ```
4. Ve a **Settings → Networking → Generate Domain**
5. Copia la URL pública (algo como `https://javaline-production.up.railway.app`)

### Paso 2.5 — Verificar backend

```bash
curl https://TU-API.railway.app/health
```

Respuesta esperada:
```json
{
  "status": "Healthy",
  "system": "javaline-commercial",
  "runtime": ".NET 9",
  "checks": [{ "name": "postgresql", "status": "Healthy" }]
}
```

Si ves `Unhealthy` en postgresql → revisa la variable `ConnectionStrings__Default`.

---

## PARTE 3 — FRONTEND (Vercel)

### Paso 3.1 — Importar el proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Selecciona el repo `Max-Prencio/javaline`
3. Vercel detecta Vite automáticamente — no cambies nada en la configuración de build
4. En **Environment Variables** (antes de hacer deploy):

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | URL del backend Railway del paso 2.4, ej. `https://javaline-production.up.railway.app` |

5. Haz clic en **Deploy**
6. Copia la URL de Vercel cuando termine (ej. `https://javaline.vercel.app`)

### Paso 3.2 — Actualizar CORS en Railway

Ahora que tienes la URL de Vercel, vuelve al servicio backend en Railway:

1. **Variables** → edita `AppSettings__CorsOrigins`
2. Pon la URL exacta de Vercel: `https://javaline.vercel.app`
   - Sin `/` al final
   - Si tienes dominio propio: `https://app.tuempresa.com`
3. Railway hace redeploy automático al guardar

### Paso 3.3 — Verificar frontend

1. Abre la URL de Vercel en el navegador
2. Debes ver la pantalla de login de Javaline
3. Abre DevTools → Network → verifica que los requests van a tu Railway URL

---

## PARTE 4 — CORREOS (SendGrid)

Sin configurar correos el sistema funciona, pero las notificaciones de bloqueo
de cuenta, invitaciones y resets de contraseña solo se loguean en consola.

### Paso 4.1 — Crear cuenta SendGrid

1. Ve a [sendgrid.com](https://sendgrid.com) → **Start for Free**
2. Completa el registro y verifica tu email

### Paso 4.2 — Autenticar tu dominio remitente

1. En SendGrid → **Settings → Sender Authentication → Domain Authentication**
2. Ingresa tu dominio (ej. `tuempresa.com`)
3. SendGrid te dará registros DNS (CNAME). Agrégalos en tu proveedor de dominio
4. Haz clic en **Verify** cuando los DNS estén propagados (~10-30 min)

> Sin dominio propio puedes usar **Single Sender Verification** con tu email personal
> para pruebas, pero no es recomendado para producción.

### Paso 4.3 — Crear API Key

1. **Settings → API Keys → Create API Key**
2. Nombre: `javaline-production`
3. Permisos: **Restricted Access → Mail Send → Full Access**
4. Copia la API Key (empieza con `SG.`) — solo se muestra una vez

### Paso 4.4 — Configurar en Railway

En el servicio backend → **Variables**:

```
Email__SmtpHost     = smtp.sendgrid.net
Email__SmtpPort     = 587
Email__SmtpUser     = apikey
Email__SmtpPassword = SG.xxxxxxxxxxxxxxxxxxxxxxxxx
Email__From         = no-reply@tudominio.com
Email__FromName     = Javaline
```

---

## PARTE 5 — PRIMER USUARIO ADMINISTRADOR

### Paso 5.1 — Crear el admin inicial

En el panel **Query** de Railway PostgreSQL:

```sql
-- Reemplaza los valores entre < >
INSERT INTO users (
  id, tenant_id, name, email, password_hash, role, status, created_at,
  failed_login_attempts
) VALUES (
  gen_random_uuid()::text,
  'default',
  'Administrador',
  'admin@tuempresa.com',
  -- Hash de 'CambiaEsta2026!' — CAMBIA LA CONTRASEÑA INMEDIATAMENTE
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TghogAXH4A7O0w3WxWLjwLfzFBJy',
  'admin',
  'active',
  NOW(),
  0
);
```

> Este hash corresponde a la contraseña `CambiaEsta2026!`.
> **Cámbiala en el primer login** desde Perfil → Cambiar contraseña.

### Paso 5.2 — Invitar usuarios adicionales

Desde la app (ya logueado como admin):
1. Ve a **Seguridad → Acceso → Roles y Permisos** (próximamente desde el módulo de usuarios)
2. O usa la API: `POST /auth/invite` con `{ "email": "usuario@empresa.com" }`
3. El usuario recibirá un email de invitación con un enlace para activar su cuenta

---

## PARTE 6 — DOMINIO PROPIO (opcional)

### En Vercel

1. **Settings → Domains → Add Domain**
2. Agrega `app.tuempresa.com`
3. En tu proveedor de dominio, agrega el registro CNAME que Vercel indica

### En Railway

1. Servicio backend → **Settings → Networking → Custom Domain**
2. Agrega `api.tuempresa.com`
3. Agrega el registro CNAME en tu DNS

### Actualizar variables

```
# En Railway — servicio backend
AppSettings__CorsOrigins = https://app.tuempresa.com
AppSettings__BaseUrl     = https://app.tuempresa.com

# En Vercel
VITE_API_URL = https://api.tuempresa.com
```

---

## Checklist de verificación post-deploy

Ejecuta esto antes de entregar a producción:

- [ ] `GET /health` responde `{"status":"Healthy"}` con postgresql Healthy
- [ ] Login funciona desde la URL de Vercel
- [ ] Las cookies `javaline_token` y `javaline_refresh_token` aparecen en DevTools → Application → Cookies con `HttpOnly = true` y `Secure = true`
- [ ] Abrir Swagger en `/swagger` desde el backend devuelve la documentación
- [ ] Crear una factura de prueba y verificar que aparece en la lista
- [ ] Invitar un usuario de prueba y verificar que llega el email
- [ ] Hacer 4 intentos de login fallidos → la cuenta se bloquea → admin recibe email
- [ ] Desbloquear la cuenta desde **Seguridad → Cuentas Bloqueadas**
- [ ] Enviar reset de contraseña y verificar que llega el email con el enlace
- [ ] El enlace de reset lleva a `/reset-password?token=...` y permite cambiar la contraseña

---

## Variables de referencia completa

### Railway — Backend

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `ConnectionStrings__Default` | ✅ | Cadena Npgsql con usuario `javaline_app` |
| `AppSettings__JwtSecret` | ✅ | Min 32 chars. Genera: `openssl rand -hex 32` |
| `AppSettings__CorsOrigins` | ✅ | URL del frontend (sin `/` al final) |
| `AppSettings__JwtIssuer` | — | Default: `javaline.commercial` |
| `AppSettings__JwtAudience` | — | Default: `javaline.commercial` |
| `AppSettings__JwtExpirationMinutes` | — | Default: `15` |
| `AppSettings__BaseUrl` | — | Para links en emails. Default: `http://localhost:5173` |
| `Email__SmtpHost` | — | Sin valor: modo stub (logs, no envía) |
| `Email__SmtpPort` | — | Default: `587` |
| `Email__SmtpUser` | — | SendGrid: `apikey` |
| `Email__SmtpPassword` | — | API Key de SendGrid |
| `Email__From` | — | Email remitente |
| `Email__FromName` | — | Nombre visible. Default: `Javaline` |

### Vercel — Frontend

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `VITE_API_URL` | ✅ | URL base del backend Railway |

---

## Límites de seguridad configurados

| Límite | Valor |
|--------|-------|
| Tamaño máximo request JSON | 5 MB |
| Tamaño máximo upload de archivos | 10 MB |
| Vida del access token (JWT) | 15 minutos |
| Vida del refresh token | 7 días |
| Intentos antes de bloqueo de cuenta | 4 intentos fallidos |
| Vida del enlace de reset de contraseña | 24 horas |
| Preflight CORS cacheado | 10 minutos |
| HSTS | 1 año + subdomains + preload |

---

## Solución de problemas

**El backend no inicia — "CorsOrigins must be set"**
→ Agrega `AppSettings__CorsOrigins` en Railway. Es obligatorio en producción.

**El backend no inicia — "JwtSecret must be set"**
→ Agrega `AppSettings__JwtSecret`. Genera uno: `openssl rand -hex 32`

**"CORS error" en el browser**
→ Verifica que `AppSettings__CorsOrigins` tenga exactamente la URL de Vercel, sin `/` al final.

**Login funciona pero datos vacíos**
→ Las políticas RLS están activas. Verifica que las migraciones V3 y V4 se aplicaron.
→ Verifica que `javaline_app` tiene permisos: `GRANT SELECT... ON ALL TABLES...`

**Los correos no llegan**
→ Verifica que `Email__SmtpHost = smtp.sendgrid.net` esté en Railway.
→ En SendGrid, verifica que el dominio remitente esté autenticado.
→ Revisa los logs del backend en Railway para ver si hay errores SMTP.

**"502 Bad Gateway" en Railway**
→ El contenedor tardó más de lo esperado en iniciar. Revisa los logs de deploy.
→ Verifica que el health check pasa: `GET /health`

**Cuentas bloqueadas — usuarios no pueden entrar**
→ Admin: **Seguridad → Cuentas Bloqueadas → Desbloquear**
→ Si el admin también está bloqueado, usa el panel Query de Railway:
```sql
UPDATE users SET status = 'active', failed_login_attempts = 0, locked_at = NULL
WHERE email = 'admin@tuempresa.com';
```

---

## Actualizaciones en producción

```bash
# Solo hacer push — Railway y Vercel despliegan automáticamente
git push origin main
```

**Migraciones de base de datos nuevas** (V5, V6, etc.) se aplican manualmente
en el panel **Query** de Railway con el usuario `postgres` antes o después del deploy,
dependiendo de si son backwards-compatible.
