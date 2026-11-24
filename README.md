# Portafolio Web & 3D Interactivo — Edwar Granados (`@SirEdward97`)

![Next.js](https://img.shields.io/badge/Next.js-16.4-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.3-61DAFB?style=flat-square&logo=react&logoColor=0b1020)
![Three.js](https://img.shields.io/badge/Three.js-0.160-000000?style=flat-square&logo=threedotjs&logoColor=white)
![WebGL](https://img.shields.io/badge/WebGL-2.0-990000?style=flat-square&logo=webgl&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-fffde0?style=flat-square&labelColor=000000)

Portafolio profesional interactivo desarrollado con **Next.js 16 (App Router)**, **React 19** y **Three.js / WebGL 2.0**. Combina una estética sobria de ingeniería sobre **fondo negro espacial (`#000000`)** —con tipografía Swiss grotesk única (`SuisseIntl` / `Inter`), paleta de alto contraste *Warm Cream* (`#fffde0`) + *Graphite* (`#72726b`) y transiciones precisas de `0.2s ease-in-out`— junto a una galaxia tridimensional reactiva al scroll, dos visores 3D en tiempo real (*Japanese Shrine* y *Oracle Red Bull Racing RB22*), la tarjeta del sistema colaborativo **SIGIF** y un formulario de contacto con envío real vía **Gmail (Nodemailer)**.

---

## Tabla de contenidos

- [Características principales](#características-principales)
- [Secciones y proyectos destacados](#secciones-y-proyectos-destacados)
- [Sistema visual y tipográfico](#sistema-visual-y-tipográfico)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Ejecución en local](#ejecución-en-local)
- [Endpoints API](#endpoints-api)
- [Despliegue automático (GitHub Actions + Vercel)](#despliegue-automático-github-actions--vercel)
- [Licencia y atribuciones](#licencia-y-atribuciones)

---

## Características principales

- **Galaxia 3D persistente con shaders GLSL y acercamiento por scroll (`Three.js` / `WebGL 2.0`)**
  Fondo interactivo basado en **160,000 estrellas** (`/galaxy/stars.glb`) renderizado en un único *draw call* mediante shaders GLSL analíticos (PSF óptico, anti-aliasing subpíxel, difracción sutil en estrellas brillantes y atenuación cerca de la lente), acompañado de **10 modelos `.glb` en órbita** del stack tecnológico. Al hacer scroll con el mouse, la cámara recorre una curva `Catmull-Rom` de 5 capítulos que se acerca y sumerge entre las estrellas; además incluye modo libre **Explorar 3D** (`OrbitControls` con zoom profundo + tecla `Esc`).
- **Dos visores 3D interactivos en tiempo real**
  - **Japanese Shrine (`glTF 2.0`)**: normalización automática con `Box3`, filtrado anisotrópico PBR, `ACESFilmicToneMapping`, 4 vistas de cámara (*General*, *Cúpula*, *Pórtico*, *Cenital*), modos *PBR / Wireframe / Relieve*, iluminación *Estudio / Nocturna* y telemetría de vértices, triángulos y FPS.
  - **Oracle Red Bull Racing RB22 (`GLB`)**: banco de homologación normativa **FIA 2026** a escala real (`5400 × 1900 mm`), plataforma de metrología, simulación de túnel de viento 3D con aerodinámica activa (**Modo Z · 248 km/h** / **Modo X · 346 km/h**), 6 estaciones calibradas de cámara (*General*, *Morro*, *Habitáculo*, *Pontones*, *Motor*, *Zaga*) y modos de inspección técnica.
- **Proyecto colaborativo integrado — SIGIF**
  Tarjeta dedicada para el *Sistema Integral de Gestión de Inventario y Facturación* con rol específico, stack tecnológico completo y accesos directos a la **Demo en vivo** en Vercel y al **Código en GitHub**.
- **Navegación inmersiva y rendimiento optimizado**
  Header flotante minimalista con cápsula central (*Menu* popover + porcentaje de lectura en vivo), barra superior de progreso, rail lateral de capítulos, revelado progresivo continuo con `IntersectionObserver` y auto-pausa inteligente en los visores WebGL fuera de pantalla.
- **Backend integrado para contacto real con Gmail**
  Endpoint `POST /api/contact` en runtime Node.js con validación de campos, plantilla HTML y texto plano vía **Nodemailer**, cabecera `replyTo` dirigida al remitente y respaldo local en JSON.
- **CI/CD automatizado hacia Vercel**
  Workflow en GitHub Actions que valida el build en cada PR/push, publica entornos *Preview* en Pull Requests y despliega automáticamente a *Producción* al actualizar `main`.

---

## Secciones y proyectos destacados

El portafolio se organiza en **4 capítulos**:

1. **Inicio (`#inicio`)**: presentación principal, estado de disponibilidad, accesos rápidos y telemetría en tiempo real de la galaxia 3D.
2. **Perfil profesional (`#perfil`)**: resumen técnico, métricas clave y los tres pilares de especialidad:
   - `01` **Diseño Web & Desarrollo Frontend**
   - `02` **Gráficos 3D Interactivos & Modelado Web**
   - `03` **Integración Backend, Bases de Datos & IA**
3. **Proyectos destacados (`#proyectos`)**:

| # | Proyecto | Tipo | Tecnologías principales | Enlaces |
| --- | --- | --- | --- | --- |
| **01** | **Japanese Shrine** — Visor Arquitectónico 3D Interactivo | Visor 3D en vivo (`glTF 2.0`) | Next.js, React, Three.js, WebGL 2.0, PBR Shaders, OrbitControls | Demo integrada en página |
| **02** | **Oracle Red Bull Racing RB22** — Banco de Homologación 3D | Visor 3D en vivo (`GLB`) | Next.js, React, Three.js, WebGL 2.0, Túnel de Viento 3D, FIA 2026 | Demo integrada en página |
| **03** | **SIGIF** — Sistema Integral de Gestión de Inventario y Facturación | Plataforma Web Colaborativa | HTML5, CSS3, Bootstrap, JavaScript, Python (Django), Node.js, MongoDB, Vercel | [Demo en vivo](https://sigif-final.vercel.app) · [GitHub](https://github.com/Machadodev1/sigif-final) |

4. **Contacto (`#contacto`)**: información del desarrollador y formulario conectado a `POST /api/contact`.

---

## Sistema visual y tipográfico

El estilo de interfaz combina la guía de [`tip.md`](./tip.md) (tipografía, color y transiciones) con un lienzo negro espacial pensado para fundirse con la galaxia 3D:

- **Fondo espacial**: negro puro (`#000000`) sin degradados distractores sobre `body`.
- **Paleta cromática**: *Warm Cream* (`#fffde0`) para titulares, texto principal, bordes y controles activos; *Warm Graphite* (`#72726b`) para metadatos y etiquetas secundarias; *Graphite Wash* (`rgba(192, 192, 192, 0.1)`) y líneas divisorias sutiles (`rgba(255, 253, 224, 0.11)`).
- **Tipografía grotesk única**: `"SuisseIntl", "Inter", Arial, sans-serif` (pesos `300`, `400`, `500`, `600`, sin fuente monospace):
  - **Display** (`.hero-title`, `.section-title`): peso `500`, `line-height: 0.906`, `letter-spacing: -0.03em`, `uppercase`.
  - **Navigation & controles**: peso `500`, `12px`, `line-height: 1`, `letter-spacing: -0.03em`, `uppercase`.
  - **Caption / utilidad**: peso `500`, `14px`/`12px`, `line-height: 1.1667`, `uppercase`.
  - **Prosa explicativa**: *sentence case*, `16px / 23px` (`line-height: 1.4375`).
- **Transiciones**: `0.2s ease-in-out` uniforme en controles, enlaces y superficies interactivas, con revelado continuo entre secciones (`[data-reveal]`).

---

## Stack tecnológico

| Capa | Tecnologías |
| --- | --- |
| **Framework & UI** | Next.js `16.4.6` (App Router + Turbopack), React `19.3.1`, CSS3 personalizado (`SuisseIntl` / `Inter`) |
| **Gráficos 3D** | Three.js `0.160.0`, WebGL 2.0, `ShaderMaterial` (GLSL), `GLTFLoader`, `OrbitControls`, glTF 2.0 / GLB, materiales PBR |
| **Backend & Correo** | Next.js Route Handlers (Node.js runtime), Nodemailer `10.6.1` (SMTP Gmail) |
| **CI/CD & Hosting** | GitHub Actions, Vercel |

---

## Estructura del proyecto

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml                   # CI/CD: verificación + deploy preview/producción en Vercel
├── public/
│   ├── dev/                             # 10 logos 3D (.glb) del stack tecnológico en órbita
│   ├── f1/
│   │   └── rb22.glb                     # Modelo 3D binario Oracle Red Bull Racing RB22
│   ├── galaxy/
│   │   └── stars.glb                    # Galaxia 3D Vía Láctea (160,000 estrellas en GLB)
│   ├── logo/
│   │   ├── edward-mark.png              # Monograma geométrico del header
│   │   └── edward.png                   # Marca personal
│   ├── textures/                        # Texturas PBR del santuario japonés
│   ├── scene.gltf / scene.bin           # Modelo 3D Japanese Shrine
│   └── license.txt                      # Atribución CC-BY-4.0 del modelo Japanese Temple
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── contact/route.js         # POST y GET /api/contact (Nodemailer + Gmail)
│   │   │   ├── health/route.js          # GET /api/health (estado y uptime)
│   │   │   └── portfolio/route.js       # GET /api/portfolio (?domain=, ?featured=)
│   │   ├── layout.jsx                   # Fuente Inter (grotesk única) y metadatos SEO
│   │   └── page.jsx                     # Entrada principal SSR
│   ├── components/
│   │   ├── ChapterRail.jsx              # Indicador lateral de capítulos
│   │   ├── ContactSection.jsx           # Sección y formulario de contacto
│   │   ├── F1CarViewer.jsx              # Interfaz y HUD del visor 3D RB22
│   │   ├── FloatingOrbitDock.jsx        # Dock flotante para salir de Explorar 3D
│   │   ├── GalaxyBackgroundCanvas.jsx   # Contenedor React del fondo 3D
│   │   ├── Header.jsx                   # Header flotante con menú popover y progreso %
│   │   ├── HeroSection.jsx              # Sección Hero y telemetría de la galaxia
│   │   ├── JapaneseTempleViewer.jsx     # Interfaz y HUD del visor 3D Japanese Shrine
│   │   ├── PortfolioClient.jsx          # Orquestador de estado cliente
│   │   ├── ProfileSection.jsx           # Narrativa y los 3 pilares profesionales
│   │   ├── ProjectsSection.jsx          # Proyectos destacados 3D y tarjeta SIGIF
│   │   ├── Reveal.jsx                   # Revelado progresivo con IntersectionObserver
│   │   ├── ScrollProgressBar.jsx        # Barra superior de progreso de lectura
│   │   └── StageLoader.jsx              # Indicador flotante de carga de escena 3D
│   ├── data/
│   │   └── portfolioData.js             # Fuente única de datos (perfil, proyectos, logos, contacto)
│   ├── lib/
│   │   └── mailer.js                    # Transporte SMTP Gmail y plantilla HTML/texto
│   ├── services/
│   │   └── api.js                       # Cliente HTTP hacia /api/contact
│   ├── styles/
│   │   └── styles.css                   # Sistema visual negro espacial, paleta cream, grotesk y transiciones
│   └── three/
│       ├── F1CarShowcase.js             # Motor Three.js del monoplaza RB22 + túnel de viento
│       ├── GalaxyBackground3D.js        # Motor Three.js de stars.glb (shaders GLSL + zoom por scroll) + 10 logos
│       ├── JapaneseTempleShowcase.js    # Motor Three.js del templo japonés PBR
│       └── logosManifest.js             # Manifiesto por defecto de logos 3D
├── .env.example                         # Plantilla de variables de entorno
├── next.config.mjs                      # Cabeceras MIME para .gltf, .glb y .bin
├── package.json                         # Scripts y dependencias
├── tip.md                               # Guía de referencia visual (tipografía, color y transiciones)
└── README.md
```

---

## Ejecución en local

### Requisitos previos

- **Node.js 20.9+** (recomendado **Node.js 22 LTS**)
- **npm 10+**
- *(Para probar el envío real de correos)* Cuenta de Gmail con **Verificación en 2 pasos** activada y una **Contraseña de Aplicación** creada desde [Google Account App Passwords](https://myaccount.google.com/apppasswords).

### Instalación y arranque

1. **Clonar el repositorio e instalar dependencias**

   ```bash
   git clone https://github.com/SirEdward97/Whiskey.git
   cd Whiskey
   npm install
   ```

2. **Configurar variables de entorno**

   Copia la plantilla `.env.example` a `.env.local` y completa tus credenciales:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   GUSER=tu-correo@gmail.com
   GPASS=xxxx xxxx xxxx xxxx
   # Opcional: correo destino si es distinto a GUSER
   # GMAIL_TO=otro-correo@gmail.com
   ```

3. **Ejecutar en modo desarrollo**

   ```bash
   npm run dev
   ```

   Abre [http://localhost:9797](http://localhost:9797) en tu navegador.

4. **Compilar y ejecutar versión de producción**

   ```bash
   npm run build
   npm run start
   ```

---

## Endpoints API

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/contact` | Valida `name`, `email`, `stack` y `message`; envía correo HTML + texto vía Gmail (`Nodemailer`) y guarda respaldo local. |
| `GET` | `/api/contact` | Lista los mensajes respaldados localmente (`data/inquiries.json`). |
| `GET` | `/api/portfolio` | Devuelve los datos completos del portafolio. Admite `?domain=<id>` y `?featured=true\|false`. |
| `GET` | `/api/health` | Verifica estado del servicio, stack principal y tiempo activo (`uptimeSeconds`). |

---

## Despliegue automático (GitHub Actions + Vercel)

El pipeline está definido en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

- **En cada `pull_request` hacia `main`**: ejecuta `verify` (`npm ci` + `npm run build`) y despliega un entorno **Preview** en Vercel.
- **En cada `push` a `main`** (o disparo manual con `workflow_dispatch`): valida el build y despliega a **Producción** en Vercel, publicando la URL resultante en el resumen de la ejecución.

### Configuración inicial

1. **Vincular el proyecto en Vercel** (una sola vez desde la raíz):

   ```bash
   npx vercel login
   npx vercel link
   ```

   Esto genera `.vercel/project.json` (ignorado por Git) con `orgId` y `projectId`.

2. **Crear token en Vercel**: genera un token en [Vercel Account Tokens](https://vercel.com/account/tokens).

3. **Registrar secretos en GitHub** (*Settings → Secrets and variables → Actions*):

   | Secret | Descripción |
   | --- | --- |
   | `VERCEL_TOKEN` | Token personal/de despliegue creado en Vercel |
   | `VERCEL_ORG_ID` | Valor `orgId` de `.vercel/project.json` |
   | `VERCEL_PROJECT_ID` | Valor `projectId` de `.vercel/project.json` |

4. **Configurar variables de entorno en Vercel** (*Project Settings → Environment Variables*):

   | Variable | Entornos | Descripción |
   | --- | --- | --- |
   | `GUSER` | Production, Preview | Correo Gmail remitente |
   | `GPASS` | Production, Preview | Contraseña de Aplicación de Google (16 caracteres) |
   | `GMAIL_TO` *(opcional)* | Production, Preview | Correo receptor si difiere de `GUSER` |

> **Nota:** Si además tienes activada la integración directa de Git desde el panel de Vercel, puedes desconectarla en **Vercel → Settings → Git** para evitar despliegues duplicados y dejar el control exclusivo a GitHub Actions.

---

## Licencia y atribuciones

- **Código fuente**: distribuido bajo licencia **MIT** — Autor: **Edwar Granados (`@SirEdward97`)**.
- **Atribuciones de modelos 3D (`CC-BY-4.0`)**:
  - *"Japanese Temple"* por [Jainesh Pathak](https://sketchfab.com/spectraut2) — ver [`public/license.txt`](public/license.txt).
  - *"Our Milky Way galaxy"* (`public/galaxy/stars.glb`) por [aditya299792](https://sketchfab.com/aditya299792) — licencia [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
