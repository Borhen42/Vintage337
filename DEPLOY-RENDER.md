# Deploy Vintage337 Backend on Render

Step-by-step guide to deploy the Spring Boot API on [Render](https://render.com) with Supabase Postgres.

---

## 1. Create a Web Service on Render

1. Render dashboard → **New** → **Web Service**
2. Connect your GitHub repository (`Borhen42/Vintage337`)
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `vintage337` (or your choice) |
| **Root Directory** | `backend` |
| **Runtime** | `Docker` |
| **Region** | Closest to your users |

Render will find `backend/Dockerfile` automatically once Root Directory is set.

---

## 2. Set Environment Variables

Render → your service → **Environment** tab → **Add Environment Variable** (or **Add from .env**).

Add every variable in the table below. **Do not leave any variable empty.**

| Variable | Value / Notes |
|----------|---------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres` — see §3 |
| `SPRING_DATASOURCE_USERNAME` | `postgres` — use the plain username, **not** `postgres.<project-ref>` |
| `SPRING_DATASOURCE_PASSWORD` | Your Supabase DB password (no brackets) |
| `JWT_SECRET` | Random string, **32+ characters** |
| `APP_PUBLIC_URL` | `https://vintage337.onrender.com` (your Render service URL) |
| `APP_FRONTEND_URL` | `https://your-app.vercel.app` |
| `APP_CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app,http://localhost:4200` |

> **Important — no duplicate variables.** If `SPRING_DATASOURCE_URL` appears twice (e.g. from a previous paste), delete the duplicate using the trash icon. Duplicates cause the app to use the wrong value.

---

## 3. Get the Supabase Direct Connection URL

Use the **Direct connection**, not the Session or Transaction pooler. The pooler (PgBouncer) causes Flyway to crash on startup with:

```
ERROR: prepared statement "S_1" does not exist
```

### Steps in Supabase

1. Supabase dashboard → your project → **Connect** (green button)
2. Select **Direct connection** (not "Session pooler" or "Transaction pooler")
3. Note the host — it looks like `db.zxkoqplilmlkdsstacao.supabase.co`, port `5432`
4. Build the JDBC URL:
   ```
   jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres
   ```
   Replace `<project-ref>` with your real project reference (visible in the host).
5. Set `SPRING_DATASOURCE_URL` to that value in Render.
6. Set `SPRING_DATASOURCE_USERNAME` = `postgres`
7. Set `SPRING_DATASOURCE_PASSWORD` = your Supabase DB password

> **Do NOT put the password inside the URL.** Keep it in `SPRING_DATASOURCE_PASSWORD` only.

---

## 4. Port Binding

Render expects the service to listen on the port announced in the container. The Dockerfile exposes port `8080` and `application.properties` sets `server.port=8080` — no extra configuration is needed. Render will detect port 8080 automatically.

If you ever see `No open ports detected` in Render logs, verify `server.port=8080` is not overridden and that no `PORT` env var is set to a different value.

---

## 5. Deploy

After saving all environment variables, trigger a deploy:

- Render → your service → **Manual Deploy** → **Deploy latest commit**

Render may also redeploy automatically after env var changes, depending on your service settings.

---

## 6. Verify the Deployment

### Check build logs
Render → **Logs** (select "Build" filter). Look for:
```
BUILD SUCCESS
```

### Check runtime logs
Render → **Logs** (select "Deploy" / runtime filter). A successful start looks like:
```
HikariPool-1 - Start completed.
Successfully validated N migrations
Started Vintage337Application in XX seconds
```

If you see DB errors, check:
- `password authentication failed` → wrong `SPRING_DATASOURCE_PASSWORD`
- `could not connect` / `unknown host` → wrong host in `SPRING_DATASOURCE_URL`
- `prepared statement "S_1" does not exist` → you are still pointing at the pooler; switch to direct connection (§3)
- `SSL required` → append `?sslmode=require` to the JDBC URL

### Smoke-test the API
```
https://vintage337.onrender.com/api/health
```

---

## 7. Deploy the Frontend on Vercel

In Vercel, add the environment variable:

| Variable | Value |
|----------|-------|
| `VINTAGE337_API_BASE_URL` | `https://vintage337.onrender.com` |

Then redeploy the Vercel project.

---

## Troubleshooting Reference

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `prepared statement "S_1" does not exist` | Using pooler (PgBouncer) | Switch `SPRING_DATASOURCE_URL` to direct connection (`db.*.supabase.co:5432`) |
| `failed to read dockerfile` | Wrong Root Directory | Set Root Directory = `backend` in Render settings |
| `No open ports detected` | App not listening on 8080 | Check `server.port` in `application.properties`; do not override with a different `PORT` env var |
| `password authentication failed` | Wrong password or username | Confirm `SPRING_DATASOURCE_PASSWORD` and `SPRING_DATASOURCE_USERNAME` match Supabase credentials |
| CORS errors in browser | `APP_CORS_ALLOWED_ORIGINS` missing your frontend origin | Add the Vercel URL to `APP_CORS_ALLOWED_ORIGINS` and redeploy |
