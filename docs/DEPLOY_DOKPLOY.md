# Guía de Despliegue en Dokploy

## Paso 1: Subir código a GitHub

Primero debes subir el proyecto a un repositorio Git.

```bash
cd "/Users/diegoeduardozuliani/VALERZA /Optimizacion de Consumo. AP"
git init
git add .
git commit -m "WealthPath Optimizer - Initial commit"
git remote add origin https://github.com/TU_USUARIO/wealthpath-optimizer.git
git push -u origin main
```

---

## Paso 2: Crear servicios en Dokploy

### 2.1 Backend (FastAPI)

1. En Dokploy → **Create** → **Application**
2. Configurar:
   - **Name**: `wealthpath-backend`
   - **Source**: Git (conectar repositorio)
   - **Build Path**: `./backend`
   - **Port**: `8000`

3. Variables de entorno:
   ```
   SUPABASE_URL=http://valerza1-supabase-ed62c7-92-112-177-87.traefik.me
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

### 2.2 Frontend (Next.js)

1. En Dokploy → **Create** → **Application**
2. Configurar:
   - **Name**: `wealthpath-frontend`
   - **Source**: Git (mismo repositorio)
   - **Build Path**: `./frontend`
   - **Port**: `3000`

3. Variables de entorno:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://valerza1-supabase-ed62c7-92-112-177-87.traefik.me
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   NEXT_PUBLIC_API_URL=https://wealthpath-backend.tu-dominio.com
   ```

---

## Paso 3: Configurar dominios

En cada servicio, configura el dominio en Dokploy:
- Backend: `wealthpath-api.traefik.me` (o tu dominio)
- Frontend: `wealthpath.traefik.me` (o tu dominio)

---

## Paso 4: Desplegar

Click en **Deploy** en cada servicio.
