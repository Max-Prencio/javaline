# Guía de Deploy — Javaline Commercial

## Arquitectura

```
[Browser]
   │  HTTPS
   ▼
[Vercel — React 19 / Vite]         (frontend estático)
   │  fetch / cookies httpOnly
   ▼
[Railway — .NET 9 ASP.NET Core]    (API REST)
   │  TCP / Npgsql
   ▼
[Railway — PostgreSQL 17]          (base de datos)
```

---

## Requisitos previos

- Cuenta en [railway.app](https://railway.app)
- Cuenta en [vercel.com](https://vercel.com)
- Repo GitHub conectado a ambas plataformas
- Dominio propio (opcional pero recomendado para CORS y cookies Secure)

---

## Paso 1 — PostgreSQL en Railway

1. En tu proyecto Railway → **+ Add Service → Database → PostgreSQL**.
2. Railway inyecta automáticamente `DATABASE_URL` en el servicio backend.
3. En el panel de la DB, abre **Query** y ejecuta los siguientes scripts en orden:

```sql
-- Crear usuario de aplicación (least-privilege)
CREATE USER javaline_app WITH PASSWORD 'CAMBIA_ESTA_PASSWORD';
GRANT CONNECT ON DATABASE railway TO javaline_app;
GRANT USAGE ON SCHEMA public TO javaline_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO javaline_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO javaline_app;
```

> El usuario `postgres` (superuser) se usa solo para migraciones.
> La app conecta como `javaline_app` (sin permisos DDL ni DROP).

4. Luego aplica las migraciones de seguridad desde el panel Query de Railway,
   en este orden exacto:

```
dotnet-backend/migrations/V2__performance_indexes.sql
dotnet-backend/migrations/V3__rls.sql
dotnet-backend/migrations/V4__account_lockout.sql
```

> Las migraciones V3 y V4 **requieren usuario postgres** (superuser) porque
> crean políticas RLS con `ALTER TABLE … FORCE ROW LEVEL SECURITY`.

---

## Paso 2 — Backend en Railway (.NET 9)

1. En Railway → **New Service → GitHub Repo**.
2. Selecciona el repo y configura:
   - **Root Directory**: `dotnet-backend`
   - **Build Command**: `dotnet publish -c Release -o /app`
   - **Start Command**: `dotnet /app/Javaline.Commercial.Api.dll`

3. En la pestaña **Variables** agrega las siguientes variables de entorno:

### Variables requeridas (el backend NO inicia sin estas)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `ConnectionStrings__Default` | Cadena de conexión PostgreSQL (con `javaline_app`) | `Host=…;Port=5432;Database=railway;Username=javaline_app;Password=…` |
| `AppSettings__JwtSecret` | Clave HMAC-SHA256 para firmar JWT. **Mínimo 32 caracteres.** | `openssl rand -hex 32` |
| `AppSettings__CorsOrigins` | URL exacta del frontend en Vercel (sin `/` al final). Sin este valor el backend rechaza iniciar en producción. | `https://javaline.vercel.app` |

### Variables opcionales (habilitadas en producción)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `AppSettings__JwtIssuer` | Identificador del emisor JWT | `javaline.commercial` |
| `AppSettings__JwtAudience` | Audiencia del JWT | `javaline.commercial` |
| `AppSettings__JwtExpirationMinutes` | Minutos de vida del access token | `15` |
| `AppSettings__BaseUrl` | URL pública del frontend (para links en emails) | `https://javaline.vercel.app` |
| `Email__SmtpHost` | Host SMTP para envío de correos | `smtp.sendgrid.net` |
| `Email__SmtpPort` | Puerto SMTP | `587` |
| `Email__SmtpUser` | Usuario SMTP | `apikey` |
| `Email__SmtpPassword` | Contraseña o API key SMTP | `SG.xxxx` |
| `Email__From` | Dirección de origen de correos | `no-reply@tudominio.com` |
| `Email__FromName` | Nombre visible del remitente | `Javaline` |

> **Correos**: Sin `Email__SmtpHost` configurado, el backend corre en modo stub —
> los emails se loguean en consola pero no se envían. Funcional para desarrollo,
> no para producción. Servicios recomendados: **SendGrid**, **Resend**, **Brevo**.

4. Verifica el health check:
   ```
   GET https://TU-API.railway.app/health
   → {"status":"Healthy","system":"javaline-commercial","runtime":".NET 9",...}
   ```

---

## Paso 3 — Frontend en Vercel (React / Vite)

1. En Vercel → **New Project → Import Git Repository**.
2. Selecciona el repo. Vercel detecta Vite automáticamente.
3. En **Settings → Environment Variables** agrega:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | URL de la API Railway (ej. `https://TU-API.railway.app`) |

4. Haz **Redeploy** para aplicar la variable.

> En desarrollo local no se necesita `VITE_API_URL` — el proxy de Vite
> (`vite.config.js`) redirige `/auth`, `/hr`, `/admin`, etc. a `http://localhost:5001`.

---

## Paso 4 — CORS y dominio

El backend solo acepta requests del origen configurado en `AppSettings__CorsOrigins`.

- **Desarrollo**: `http://localhost:5173,http://localhost:4173` (configurado en `appsettings.Development.json`, no en git de producción)
- **Producción**: variable de entorno `AppSettings__CorsOrigins=https://javaline.vercel.app`

Si usas dominio propio en Vercel (ej. `app.tuempresa.com`):
```
AppSettings__CorsOrigins=https://app.tuempresa.com
AppSettings__BaseUrl=https://app.tuempresa.com
```

> **Sin este valor, el backend no inicia en producción** — es un fail-fast
> intencional para prevenir deploys con CORS abierto.

---

## Paso 5 — Seguridad de base de datos (RLS)

La aplicación usa **Row Level Security** de PostgreSQL.
Cada request autentica al usuario y le pasa al motor de base de datos las variables:

```
app.current_user_id    → ID del usuario autenticado
app.current_role       → 'admin' | 'manager' | 'user' | 'employee' | 'service'
app.current_tenant_id  → tenant del usuario (actualmente 'default')
```

**Comportamiento por rol:**

| Rol | Visibilidad |
|-----|-------------|
| `admin` / `manager` | Todos los registros del tenant |
| `user` / `employee` | Solo sus propios registros |
| Sin sesión autenticada | Sin acceso (fail-closed) |

Las migraciones V3 y V4 crean todas las políticas. Verificar:
```sql
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relrowsecurity = true;
```

---

## Paso 6 — Bloqueo de cuentas

El sistema bloquea automáticamente una cuenta tras **4 intentos fallidos** de login.

- El admin recibe un correo de alerta inmediatamente.
- El admin puede **desbloquear** y **enviar reset de contraseña** desde:
  **Seguridad → Cuentas Bloqueadas**.
- El usuario recibe un email con un enlace de 24 horas para cambiar su contraseña.
- El enlace lleva a: `{BaseUrl}/reset-password?token={token}`

Para que funcione el envío de correos, configura las variables `Email__*` del Paso 2.

---

## Paso 7 — Primer deploy

```bash
git push origin main
```

Vercel y Railway hacen deploy automático al detectar el push.

---

## Variables de la conexión de base de datos

### Desarrollo local (`appsettings.Development.json` — gitignored)
```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=javaline;Username=javaline_app;Password=javaline_app_2026!"
  },
  "AppSettings": {
    "JwtSecret": "<mínimo 32 chars>",
    "CorsOrigins": "http://localhost:5173,http://localhost:4173"
  }
}
```

### Producción (Railway env vars)
```
ConnectionStrings__Default=Host=<railway-host>;Port=<port>;Database=railway;Username=javaline_app;Password=<password>
AppSettings__JwtSecret=<openssl rand -hex 32>
AppSettings__CorsOrigins=https://<tu-dominio-vercel>
AppSettings__BaseUrl=https://<tu-dominio-vercel>
```

---

## Limitaciones de seguridad conocidas

| Límite | Valor configurado |
|--------|-------------------|
| Tamaño máximo request (JSON) | 5 MB |
| Tamaño máximo upload de archivos | 10 MB |
| Vida del access token (JWT) | 15 minutos |
| Vida del refresh token | 7 días |
| Intentos antes de bloqueo | 4 intentos fallidos |
| Vida del enlace de reset de contraseña | 24 horas |
| Preflight CORS cacheado | 10 minutos |
| HSTS | 1 año + subdomains + preload |

---

## Solución de problemas

**"AppSettings:CorsOrigins must be set in production"**
→ Agrega la variable `AppSettings__CorsOrigins` en Railway con la URL exacta de Vercel.

**"AppSettings:JwtSecret must be set"**
→ Agrega `AppSettings__JwtSecret` con un string de mínimo 32 caracteres.
→ Genera uno: `openssl rand -hex 32`

**"CORS error" en el browser**
→ Verifica que `AppSettings__CorsOrigins` incluya exactamente tu URL de Vercel (sin `/` al final).
→ Si tienes dominio propio, pon la URL del dominio, no la de `.vercel.app`.

**Los correos no llegan**
→ Verifica que `Email__SmtpHost` esté configurado.
→ Sin SMTP configurado, el sistema funciona pero los correos solo se loguean en consola (modo stub).
→ Usa SendGrid (recomendado): `Email__SmtpHost=smtp.sendgrid.net`, `Email__SmtpUser=apikey`.

**"RLS policy violation" o datos vacíos en producción**
→ Verifica que las migraciones V3 y V4 se aplicaron con el usuario `postgres`.
→ Verifica que `javaline_app` tiene permisos en las tablas nuevas.

**Cuentas bloqueadas en producción**
→ Accede a **Seguridad → Cuentas Bloqueadas** como administrador.
→ Haz clic en **Desbloquear** y luego **Enviar reset** para que el usuario recupere acceso.

---

## Actualizar en producción

```bash
git push origin main
# Railway y Vercel hacen deploy automático
```

Las migraciones de base de datos nuevas (V5, V6, etc.) se aplican **manualmente**
desde el panel Query de Railway con el usuario `postgres`.
