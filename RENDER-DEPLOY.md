# Deploy Vintage337 Backend to Render

## 1. Service settings

| Setting | Value |
|---------|-------|
| **Runtime** | Docker |
| **Root Directory** | `backend` |
| **Dockerfile Path** | *(leave blank — Render finds `backend/Dockerfile` automatically)* |
| **Port** | `8080` |

## 2. Environment variables

Set these under **Environment → Environment Variables** in your Render service.

| Key | Example value | Notes |
|-----|---------------|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:6543/postgres?user=postgres.xxxx&prepareThreshold=0` | See §3 for Supabase pooler vs direct. **`prepareThreshold=0` is required when using the Transaction Pooler.** |
| `SPRING_DATASOURCE_USERNAME` | `postgres.zxkoqplilmlkdsstacao` | For Supabase pooler this is `postgres.<project-ref>`, **not** just `postgres`. For a direct connection (port 5432) use `postgres`. |
| `SPRING_DATASOURCE_PASSWORD` | *(your Supabase DB password)* | No brackets, no extra text — just the password. |
| `JWT_SECRET` | *(random string, ≥ 32 chars)* | Generate with e.g. `openssl rand -hex 32`. Do **not** leave the placeholder. |
| `APP_PUBLIC_URL` | `https://vintage337.onrender.com` | No trailing slash. |
| `APP_FRONTEND_URL` | `https://your-app.vercel.app` | Angular SPA URL. |
| `APP_CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app,http://localhost:4200` | Comma-separated; must include every origin the browser uses. |

## 3. Supabase connection: pooler vs direct

### Transaction Pooler (port 6543) — keep if you prefer
Append `&prepareThreshold=0` to disable server-side prepared statements (required for Flyway + Hibernate):

```
jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:6543/postgres?user=postgres.xxxx&prepareThreshold=0
```

Set `SPRING_DATASOURCE_PASSWORD` as a separate environment variable (see the table above).

Username must be `postgres.<project-ref>` (e.g. `postgres.zxkoqplilmlkdsstacao`).

### Direct connection (port 5432) — recommended for long-running servers
No `prepareThreshold` needed:

```
jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```

Username is just `postgres`.

Get the host from **Supabase → Connect → Direct connection**.

## 4. Common misconfigurations (what the validation error means)

### ❌ Invalid key — URL pasted into the key field
Render shows: *"Environment variable keys must consist of alphabetic characters, digits, '_', '-', or '.', and must not start with a digit."*

This happens when a JDBC URL or `https://…` URL is accidentally pasted into the **key (left) field** instead of the **value (right) field**.

**Fix:** delete that row, add a new row with the correct key name (e.g. `SPRING_DATASOURCE_URL`) in the left field and the JDBC URL in the right field.

### ❌ Wrong `SPRING_DATASOURCE_USERNAME` for the pooler
If you use the Transaction Pooler (port 6543), the username must include the project reference:

```
postgres.zxkoqplilmlkdsstacao   ✅  (pooler)
postgres                         ✅  (direct connection, port 5432)
```

Using just `postgres` with the pooler URL will cause authentication failures.

### ❌ JWT_SECRET left as a placeholder
The app ships with a default placeholder value.  
**Replace it** with a securely generated secret of at least 32 characters before deploying:

```bash
openssl rand -hex 32
```

### ❌ Password visible in the JDBC URL
Avoid embedding the password inside `SPRING_DATASOURCE_URL` (e.g. `&password=abc123`).  
Instead, set `SPRING_DATASOURCE_PASSWORD` as a separate environment variable and keep the URL free of credentials. Render marks secret variables and hides them in the UI.

## 5. After saving env vars

1. **Trigger a redeploy**: Render → *Manual Deploy* → *Deploy latest commit*.
2. **Watch the logs**: Render → *Logs*. Look for `Started Vintage337Application` and no DB errors.
3. **Smoke test**: `https://vintage337.onrender.com/api/health`
