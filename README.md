# WealthPath Optimizer

Sistema de optimización de consumo financiero basado en el Modelo de Bellman y la Ecuación de Euler.

## Estructura del Proyecto

```
├── frontend/         # Next.js 14 (App Router)
├── backend/          # FastAPI Python
├── sql/              # Scripts de migración
└── docker-compose.yml
```

## Desarrollo Local

```bash
# Iniciar todos los servicios
docker-compose up --build

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## Variables de Entorno

Crear `.env` en la raíz:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## Despliegue

Push a `main` activa el despliegue automático via GitHub Actions + Dokploy.
