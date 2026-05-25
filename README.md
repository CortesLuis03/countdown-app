# Cuenta Regresiva

Single page app con contador regresivo configurable, tema oscuro y celebraciones progresivas.

## Captura

![Preview](/public/preview.png)

## Características

- Configuración de fecha límite con selector de hora y minutos
- Contador en vivo: días, horas, minutos y segundos
- Tema oscuro y sombrío
- 3 niveles de celebración progresiva:
  - **≤10 días**: confeti dorado, números en dorado
  - **≤7 días**: confeti multicolor, pulso suave en el contador
  - **≤3 días**: confeti máximo, animación flotante de emojis, pulso fuerte, glow rosa, suena *The Final Countdown* en loop
- Persistencia en localStorage
- Responsive (móvil, tablet, desktop)
- Inyección de variables de entorno en Docker (arranque automático sin pantalla de configuración)

## Tecnologías

- React 18
- Vite 6
- canvas-confetti
- Docker + Nginx

## Desarrollo

```bash
npm install
npm run dev
```

## Docker

```bash
docker compose up -d
# Abrir http://localhost:9001
```

> `docker-compose.override.yml` está incluido para desarrollo local (crea la red `proxy` automáticamente). En producción, la red debe existir previamente (`docker network create proxy`).

### Variables de entorno

Editar `.env`:

```env
TARGET_DATE=2026-12-31
TARGET_TIME=23:59
COUNTDOWN_REASON=Fin de año 2026
```

Si las tres están presentes y la fecha es futura, la app arranca directo con el countdown. Si falta alguna, muestra la pantalla de configuración con los campos prellenados.

## Estructura

```
├── public/
│   ├── favicon.png       # Icono de pestaña
│   ├── shared_image.png  # Imagen para Open Graph
│   ├── preview.png       # Screenshot para README
│   ├── The Final Countdown.mp3  # Suena al llegar a ≤3 días
│   └── env-config.js     # Config para desarrollo local (gitignored)
├── src/
│   ├── App.jsx           # Componente principal
│   ├── index.css         # Estilos
│   └── main.jsx          # Entry point
├── env-inject.sh         # Inyección de env vars en Docker
├── start.sh              # Entrypoint del contenedor
├── Dockerfile
├── docker-compose.yml
├── docker-compose.override.yml  # Red proxy para desarrollo local
└── .env                  # Variables de entorno
```
