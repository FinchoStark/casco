# Casco

Mentor diario de estudio para la oposición a bombero. Es una web app (PWA) que funciona en el móvil y en el ordenador, y también sin conexión.

- **Hoy:** qué toca cada día (repasos pendientes, tema nuevo y páginas, cierre con folio y test), la cadena del hábito y los mensajes del mentor.
- **Pomodoro:** temporizador con los pasos guiados de cada tipo de sesión. Lleva la cuenta del tiempo neto.
- **Temario:** los 40 temas en orden de estudio, con su progreso y el repaso espaciado (+1, +3, +7, +15 y +30 días).
- **Técnicas:** se desbloquean por niveles (Chispa, Llama, Hoguera, Incendio, Flashover), con conversor fonético.
- **Progreso:** racha, horas por semana, mapa de calor y evolución de los tests frente al corte.
- **Ajustes:** alarma diaria en el calendario (.ics), duración del pomodoro, nivel y copia de seguridad.

Los tests y las clases se hacen en Formación Ninja: la app solo enlaza a su plataforma y no está vinculada a ella.

Los datos se guardan en `localStorage`, en el propio dispositivo. Para pasarlos de uno a otro se usa la copia de seguridad.

## Perfiles

- `/casco/nacho/`: el perfil de Nacho.
- `/casco/fincho/`: el perfil de admin. Es igual, pero en Ajustes tiene un **modo pruebas**: simular la fecha, avanzar un día, cargar datos de ejemplo, un pomodoro de 10 segundos y empezar de cero.
- `/casco/`: página de entrada. Pregunta quién entra y recuerda la elección; con `?elegir` vuelve a preguntar.

Cada perfil guarda sus datos aparte (`casco-v1-nacho`, `casco-v1-fincho`). No hay contraseña ni servidor: cada uno ve solo los datos de su propio dispositivo.

## Probar en local

```
python -m http.server 8790
```

Para probar otra fecha: `http://localhost:8790/?hoy=2026-12-01`.

## Publicar

En GitHub Pages: Settings → Pages → Deploy from branch → `main` / raíz.

Al cambiar los archivos, sube también `CACHE` en `sw.js` (`casco-v2`…) para que los móviles cojan la versión nueva.
