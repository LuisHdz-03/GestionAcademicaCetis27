#  Sistema de Gestión Académica - CETIS 27

La plataforma web administrativa del ecosistema digital del CETIS 27, diseñada para optimizar procesos escolares, control de usuarios y visualización de datos institucionales. Este repositorio contiene exclusivamente la aplicación cliente, desarrollada con un enfoque modular, tipado estricto y componentes de alto rendimiento para garantizar una experiencia de usuario (UX) fluida y responsiva.

---

##  Características del Cliente Web

*   **Panel Administrativo de Alto Impacto (Dashboard):** Interfaz centralizada y responsiva para la visualización en tiempo real de métricas escolares, gestión de alumnos, personal docente y control de grupos.
*   **Gestión de Sesiones y Estado Global:** Implementación de un contexto centralizado (`AuthContext`) que distribuye de forma segura los datos del usuario autenticado a lo largo de toda la aplicación.
*   **Enrutamiento Inteligente y Seguro:** Sistema de protección de rutas basado en el estado de autenticación, restringiendo paneles específicos según el rol del usuario (Administrador, Prefecto, Docente).
*   **Consumo Eficiente de APIs:** Arquitectura cliente estructurada para comunicarse de manera limpia con endpoints RESTful estandarizados (`/api/v1/`).

---

##  Stack Tecnológico

*   **Framework:** Next.js 15 (React)
*   **Lenguaje:** TypeScript (Tipado estricto para asegurar la mantenibilidad del código)
*   **Estilos y UI:** Tailwind CSS (Diseño responsivo, maquetación ágil y componentes personalizados)
*   **Gestión de Estado:** React Context API (`AuthContext`)
*   **Herramientas:** ESLint, Prettier, Vite/Next Compiler

---

##  Estructura de Módulos

El diseño de la aplicación sigue una separación clara de responsabilidades en el lado del cliente:

```text
gestionacademica/
└── src/                    # Código fuente principal
    ├── app/               # Enrutamiento basado en archivos (App Router) y páginas
    ├── components/        # Componentes UI atómicos y reutilizables (LoginCard, Sidebar, etc.)
    ├── contexts/          # Gestión de estado global y lógica de autenticación
    └── lib/              # Clientes de API, utilidades y helpers de configuración
