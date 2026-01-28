# Gestión Académica

Sistema de gestión académica para instituciones educativas desarrollado con Next.js y Node.js.

## Características

- **Frontend**: Next.js 15 con TypeScript
- **Backend**: Node.js con Express
- **Base de datos**: MySQL
- **Autenticación**: JWT con contexto React
- **UI**: Tailwind CSS con componentes personalizados

## Estructura del Proyecto

```
gestionacademica/
├── src/                    # Código fuente del frontend
│   ├── app/               # Páginas de Next.js
│   ├── components/        # Componentes reutilizables
│   ├── contexts/          # Contextos de React (AuthContext)
│   └── lib/              # Utilidades
├── backend/               # Código fuente del backend
│   ├── src/              # Código fuente principal
│   │   ├── app.js        # Servidor principal
│   │   ├── config/       # Configuraciones
│   │   ├── controllers/  # Controladores
│   │   ├── middlewares/  # Middlewares
│   │   ├── routes/       # Rutas
│   │   └── utils/        # Utilidades
│   └── package.json      # Dependencias del backend
└── public/               # Archivos estáticos
```

## Instalación

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Configuración

1. Configura la base de datos MySQL
2. Crea un archivo `.env` en la carpeta `backend/` con:
   ```
   DB_HOST=localhost
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_NAME=gestion_academica
   PORT=4000
   JWT_SECRET=tu_secreto_super_seguro
   JWT_EXPIRE=30d
   ```
3. Ejecuta las migraciones de la base de datos

## Uso

1. Inicia el servidor backend: `cd backend && npm run dev`
2. Inicia el servidor frontend: `npm run dev`
3. Accede a `http://localhost:3000`

## Correcciones Implementadas

### ✅ Inconsistencias Corregidas

1. **Duplicación de servidores**: Eliminado `backend/server.js` duplicado
2. **Rutas de API**: Estandarizadas todas las rutas a `/api/v1/`
3. **Sistema de autenticación**: Unificado usando AuthContext
4. **Estructura de respuestas**: Consistente entre frontend y backend
5. **Configuración de base de datos**: Unificada en `src/config/db.config.js`

### 🔧 Mejoras Implementadas

- AuthContext integrado con JWT real
- LoginCard usa AuthContext en lugar de llamadas directas
- Dashboard layout usa AuthContext para datos de usuario
- Sidebar usa AuthContext para información de usuario
- DashboardHeader usa AuthContext para logout
- Rutas de API estandarizadas

## Tecnologías

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MySQL, JWT
- **Herramientas**: ESLint, Prettier