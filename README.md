# Portafolio Full-Stack & 3D — Edwar Granados (`@SirEdward97`)

Documentación técnica y funcional del portafolio interactivo de **Edwar Granados (`@SirEdward97`)**, diseñado bajo una arquitectura web modular con renderizado tridimensional en tiempo real (**Three.js / WebGL 2.0**), motor atmosférico en **Canvas 2D** y servidor HTTP nativo en **Node.js**.

---

## 1. Arquitectura General del Proyecto

```
/home/maverick/Escritorio/port/
├── index.html          # Estructura editorial, Header Grid, Hero Onyx y secciones Paper/Fog
├── styles.css          # Sistema de diseño (tokens hi.md, cuadrícula ill.md, reglas tipográficas skil.md)
├── app.js              # Controlador principal de eventos, filtros 3D, cámara, atmósfera y formulario
├── scene3d.js          # Motor WebGL Three.js unificado (Japanese Temple + 10 logos .glb en el fondo)
├── bg-logos.js         # Manifiesto y configuración espacial de los 10 modelos .glb de tecnologías
├── atmosphere.js       # Motor Canvas 2D de pliegues verticales de luz atmosférica (sk.md + hi.md)
├── server.js           # Servidor HTTP en Node.js con soporte MIME para glTF/GLB/BIN y streaming
├── package.json        # Configuración del proyecto Node.js (`npm start`)
├── scene.gltf          # Descriptor JSON del modelo 3D principal "Japanese Temple" (glTF 2.0)
├── scene.bin           # Buffer binario de geometría (33,629 vértices / 29,696 triángulos)
├── textures/           # Mapas PBR del modelo principal (BaseColor, MetallicRoughness, Normal)
├── dev/                # Carpeta organizada con los 10 modelos 3D (.glb) de conocimientos técnicos
├── logo/edward.png     # Logotipo oficial de Edwar Granados integrado en el Header Grid
└── vendor/             # Módulos locales de Three.js (three.module.js, OrbitControls, GLTFLoader)
```

---

## 2. Funcionalidades Principales

### 2.1. Escena 3D Unificada en el Fondo (`scene3d.js` + `bg-logos.js`)
- **Renderizado simultáneo en un solo contexto WebGL (`#temple-canvas`)**:
  - **Estructura Principal (`scene.gltf` + `scene.bin`)**: Carga asíncrona del modelo *Japanese Temple* con barra de progreso en tiempo real, cálculo automático de caja delimitadora (`THREE.Box3`) para normalizar su escala y centrado preciso sobre un pedestal arquitectónico con anillo luminoso.
  - **Constelación de 10 Logos 3D (`./dev/*.glb`)**: Carga y normalización automática de los 10 modelos `.glb` que representan el stack de Edwar Granados (`html-logo.glb`, `css-logo.glb`, `js-logo.glb`, `tailwindcss-logo.glb`, `three-js-logo.glb`, `python-logo.glb`, `node-js-logo.glb`, `mongodb-logo.glb`, `docker-logo.glb`, `kubernetes-logo.glb`).
- **Paralaje y Reactividad**:
  - Los modelos responden suavemente al movimiento del cursor y al desplazamiento vertical (`scroll`) de la página.
  - Al pasar el cursor sobre las filas de **Capacidades Técnicas** o pulsar la tira de categorías (`.tech-logo-strip`), los logos 3D correspondientes en el fondo escalan y aumentan su presencia visual.
- **Modos de Inspección y Cámara en Tiempo Real**:
  - **4 Presets de Cámara con interpolación cúbica**: *General*, *Cúpula*, *Pórtico* y *Cenital*.
  - **3 Modos de Superficie/Shader**: *PBR Realista* (mapas originales con filtrado anisotrópico), *Wireframe* (estructura alámbrica técnica sincronizada con el color de acento) y *Relieve* (arcilla de estudio conservando el `normalMap` y `roughnessMap`).
  - **Conmutador de Iluminación**: Alterna entre *Luz Estudio* y *Luz Nocturna*, usando mapeo de tonos cinematográfico `ACESFilmicToneMapping`.
  - **Modo `ORBITAR FONDO 3D`**: Botón en la cabecera que atenúa la interfaz editorial al 8% de opacidad y habilita `OrbitControls` directamente sobre el fondo para rotar y hacer zoom libremente alrededor del templo y los logos 3D.

### 2.2. Motor de Atmósfera con Pliegues de Luz (`atmosphere.js` — `sk.md`)
- Renderiza en `#atmosphere-canvas` un fondo oscuro Onyx (`#161616`) con múltiples cortinas o pliegues verticales de luz que se desplazan con una deriva sinusoidal lenta y meditativa.
- Emplea composición aditiva (`globalCompositeOperation = 'screen'`) para que los cruces entre pliegues se iluminen de forma natural, desvaneciéndose en la parte superior y concentrando un brillo radial focal en la esquina inferior derecha.
- Incluye un panel desplegable (**`+ ATMÓSFERA`**) con perillas en vivo para ajustar:
  1. **Tono de luz**: *Ember (`#ff6436`)*, *Silver (`#c9c7cc`)* o *Cian (`#22d3ee`)* — sincronizado en tiempo real con la luz de contra (*Rim Light*) de la escena 3D en Three.js.
  2. **Número de pliegues verticales** (5 a 18).
  3. **Velocidad/amplitud de deriva sinusoidal**.
  4. **Suavidad y difusión aditiva**.

### 2.3. Sistema de Diseño Editorial y Tipográfico (`styles.css` — `hi.md` + `ill.md` + `skil.md`)
- **Header Grid de 12 Columnas**:
  - Integra el logotipo `./logo/edward.png` enmarcado con esquinas rectas (`0px`), nombre, punto de estado vivo en **Ember Orange (`#ff6436`)**, handle `@SIREDWARD97`, celda de estado `FULL-STACK & 3D // AVAILABLE` y navegación con botones tipo cápsula (`9999px`) en `IBM Plex Mono` mayúsculas.
- **Ritmo Oscuro a Claro (*Dark-to-Light Rhythm*)**:
  - **Hero Oscuro (`--color-onyx: #161616`)**: Titular monumental condensado con gradiente de desvanecimiento vertical (`--gradient-display-fade`) y etiquetas `Ghost Glass Tag`.
  - **Secciones Claras (`--color-paper: #f8f8f8` y `--color-fog: #f1f1f1`)**: Superficies semi-translúcidas con desenfoque sutil para mantener visible el fondo 3D durante todo el recorrido, acompañadas de títulos fantasma de gran escala (`Ghosted Section Titles`), divisores de `1px` en **Silver Mist (`#c9c7cc`)** y etiquetas rectangulares en **Onyx (`#161616`)**.

### 2.4. Inspector de Mapas PBR y Generador de Encargos (`app.js`)
- **Inspector Modal de Texturas PBR**: Permite abrir y examinar en alta resolución los 3 mapas reales del modelo (`BaseColor`, `MetallicRoughness` y `Normal Map`) desde `./textures/`.
- **Formulario de Contacto Directo**: Estructura el nombre, área técnica del proyecto y objetivo en un resumen limpio que se copia automáticamente al portapapeles para contactar a `@SirEdward97`.

### 2.5. Servidor Nativo en Node.js (`server.js`)
- Servidor HTTP sin dependencias externas pesadas que sirve todo el portafolio por streaming (`fs.createReadStream`), con cabeceras MIME exactas para activos 3D (`model/gltf+json`, `model/gltf-binary`, `application/octet-stream`) y protección contra *directory traversal*.
- Ejecución:
  ```bash
  npm start
  # o directamente:
  node server.js
  ```
