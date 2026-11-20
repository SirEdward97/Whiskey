# Portafolio Full-Stack & 3D — Edwar Granados (`@SirEdward97`)

Portafolio interactivo de **Edwar Granados (`@SirEdward97`)**, construido con **Next.js (App Router)**, **React.js** y **Three.js / WebGL 2.0**, conservando intacto el diseño *Deep Space Glassmorphism* y todas las escenas tridimensionales en tiempo real.

---

## 1. Arquitectura del Proyecto

```text
port/
├── package.json                        # Scripts: `npm run dev`, `npm run build`, `npm start`
├── next.config.mjs                     # Configuración Next.js + cabeceras MIME para .gltf/.glb/.bin
├── jsconfig.json                       # Alias `@/*` -> `./src/*`
├── public/                             # Activos 3D y gráficos originales intactos
│   ├── scene.gltf & scene.bin          # Modelo 3D "Japanese Temple" (glTF 2.0)
│   ├── textures/                       # Mapas PBR (BaseColor, MetallicRoughness, Normal)
│   ├── galaxy/                         # Modelo 3D "Our Milky Way galaxy" (160K estrellas)
│   ├── dev/                            # 10 modelos 3D (.glb) de tecnologías en órbita
│   └── logo/edward.png                 # Logotipo oficial
└── src/
    ├── app/
    │   ├── layout.jsx                  # Root Layout + fuentes optimizadas con next/font/google
    │   ├── page.jsx                    # Server Component principal
    │   └── api/
    │       ├── health/route.js         # GET /api/health
    │       ├── portfolio/route.js      # GET /api/portfolio (soporta ?domain= y ?featured=)
    │       └── contact/route.js        # POST /api/contact y GET /api/contact (data/inquiries.json)
    ├── data/portfolioData.js           # Fuente estructurada del portafolio y manifiesto 3D
    ├── services/api.js                 # Cliente HTTP para los Route Handlers de Next.js
    ├── styles/styles.css               # Sistema visual Deep Space Glassmorphism intacto
    ├── three/
    │   ├── GalaxyBackground3D.js       # Galaxia 3D + 10 Logos .GLB + cámara Catmull-Rom con scroll
    │   ├── JapaneseTempleShowcase.js   # Visor 3D interactivo de Japanese Shrine
    │   └── logosManifest.js
    └── components/                     # Componentes React modulares (PortfolioClient, Header, Hero, etc.)
```

---

## 2. Cómo correrlo en Visual Studio Code

1. Abre la carpeta del proyecto en VS Code (`Archivo → Abrir carpeta…`).
2. Abre la terminal integrada (``Ctrl + ` ``).
3. Ejecuta:

```bash
npm install
npm run dev
```


- **Portafolio (Next.js + React + Three.js):** `http://localhost:3000`
- **API Route Handlers integrados:**
  - `GET http://localhost:3000/api/health`
  - `GET http://localhost:3000/api/portfolio`
  - `POST / GET http://localhost:3000/api/contact`

### Modo producción
```bash
npm run build
npm start
```
