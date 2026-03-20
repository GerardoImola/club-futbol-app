Galería — Momentos
==================

Cada tarjeta en `galeria.component.ts` usa el array `imagenes`:
  - Vacío → placeholder sin clic.
  - Una o más rutas → tapa con la primera foto; al tocar se abre el visor (flechas, miniaturas si hay más de una).

Rutas relativas a `public/` (sin / inicial), ej.:
  images/galeria/entrenamiento/01.png
  images/galeria/entrenamiento/02.jpg

Álbum Entrenamiento
-------------------
Poné los archivos en `public/images/galeria/entrenamiento/` (01.png, 02.png, …)
y sumá cada ruta al array `imagenes` de ese ítem en el componente.

Álbum Finalísima
----------------
Archivos en `public/images/galeria/finalisima/`. Las rutas están en el ítem
`Finalísima` de `galeria.component.ts`.
