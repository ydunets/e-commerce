# Backend architecture diagrams

`backend-architecture.drawio` has three pages: **Request flow** (GET /api/v1/products/:id traced end to end), **Domains & entities** (the three vertical slices, their entities, owned tables, and cross-domain edges), and **Data model** (tables from `apps/server/db/migrations` with FK/CHECK/index annotations).

The `.drawio.png` files are per-page exports with the diagram XML embedded, so opening one in draw.io recovers the editable page.

Regenerate after adding a module, a route, or a schema migration: edit the `.drawio` in draw.io desktop, then re-export each page with `drawio -x -f png -e -s 2 --page-index <n> -o backend-architecture-p<n>.drawio.png backend-architecture.drawio`.
