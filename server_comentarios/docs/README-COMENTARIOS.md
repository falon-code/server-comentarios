
# Servicio Inventario + Comentarios (Armors, Items, Weapons, Comments)

API REST sobre MongoDB para consultar armors, items y weapons del juego THE NEXUS BATTLES IV y gestionar comentarios de usuarios. Patrón aplicado: Modelo – Controlador – Vista.

## Objetivo
Exponer endpoints simples y consistentes para que otros servicios (front-end, otros microservicios) consuman información de inventario sin lógica adicional.

## Estructura del proyecto (carpetas relevantes)

```
server_comentarios/
├── docs/
│   └── README.md               # Documentación principal (este archivo)
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                # Punto de arranque
    ├── express/
    │   └── Server.ts           # Configuración y montaje de vistas
    └── server_comentarios/
        ├── db/
        │   └── mongo.ts        # Singleton conexión MongoDB
        ├── types/
        │   ├── ArmorInterface.ts
        │   ├── ItemInterface.ts
        │   └── WeaponInterface.ts
        ├── model/
        │   ├── ArmorModel.ts
        │   ├── ItemModel.ts
        │   └── WeaponModel.ts
        ├── controller/
        │   ├── ArmorController.ts
        │   ├── ItemController.ts
        │   └── WeaponController.ts
        └── view/
            ├── ArmorView.ts
            ├── ItemView.ts
            └── WeaponView.ts
```

## Descripción por carpeta

| Carpeta / Archivo | Rol | Detalle |
|-------------------|-----|---------|
| docs/README.md | Documentación | Referencia central del servicio. |
| src/index.ts | Bootstrap | Crea instancia de Server y levanta el listener HTTP. |
| src/express/Server.ts | Infraestructura | Configura Express (JSON, rutas base, montaje de vistas). |
| db/mongo.ts | Infraestructura | Gestiona única instancia MongoClient y utilidades para obtener base/colección (incluye autodetección). |
| types/*.ts | Tipado | Interfaces de dominio (estructura de documentos en cada colección). |
| model/*.ts | Acceso datos | Consulta directa a MongoDB. Construye filtros, no conoce HTTP. |
| controller/*.ts | Orquestación | Interpreta parámetros de request (query/path), invoca modelos, maneja errores básicos y forma respuestas. |
| view/*.ts | Rutas | Declara endpoints Express y enlaza métodos del controller. Sin lógica. |

## Flujo de una petición

1. Cliente solicita GET /api/armors?heroType=SHAMAN.
2. ArmorView tiene la ruta y llama ArmorController.list.
3. ArmorController parsea query y llama ArmorModel.getAll(filters).
4. ArmorModel arma filtro Mongo y ejecuta find().
5. Resultado vuelve al controller y se responde JSON.

## Conexión a MongoDB

- Archivo: db/mongo.ts
- Usa variable de entorno MONGODB_URI.
- Si INVENTORY_DB_NAME no está definida: autodetecta entre ['comentarios','Inventario','NexusBattlesIV','test','local'] la primera que contenga la colección solicitada.
- Cada modelo pide primero la DB detectada y luego la colección (por variable INVENTORY_*_COLLECTION o default).

## Interfaces (tipos base)

ArmorInterface / ItemInterface / WeaponInterface comparten campos frecuentes:
- _id: ObjectId (Mongo)
- id: number (id lógico usado por API)
- name: string
- description: string
- status: boolean (true=activo)
- heroType: string
- image: string (data URL base64 u otra representación)
- effects: Array<{ effectType: string; value: number; durationTurns: number; dropRate: number; stock: number }>
- (Armor únicamente) armorType: string

## Modelos (responsabilidad)

Ejemplo (ArmorModel):
- detectDatabase(): ejecuta autodetección la primera vez (cache interno).
- getAll(filters): construye query combinando filtros heroType, armorType, effectType, status.
- getById(id): busca por campo numérico 'id'.

Items y Weapons replican el patrón (sin armorType).

## Controladores

Patrón repetido:
- list(req, res): construye objeto filters a partir de query params válidos. Invoca Model.getAll.
- getById(req, res): parsea req.params.id (number) y llama Model.getById.
- Respuestas:
  - 200 OK con array u objeto.
  - 404 si no se encuentra id.
  - 400 si parámetro id inválido (NaN).
  - 500 ante error inesperado (try/catch simple).

## Vistas

- Registran rutas:
  - /api/armors  (GET)
  - /api/armors/:id (GET)
  - /api/items
  - /api/items/:id
  - /api/weapons
  - /api/weapons/:id
- Exportan un Router listo para ser montado por Server.ts.

## Endpoints (Inventario)

Armors:
- GET /api/armors
  - Query soportada: heroType, armorType, effectType, status (true|false)
- GET /api/armors/:id

Items:
- GET /api/items
  - Query: heroType, effectType, status
- GET /api/items/:id

Weapons:
- GET /api/weapons
  - Query: heroType, effectType, status
- GET /api/weapons/:id

Ejemplo respuesta (array):
```
[
  {
    "_id": "68a7a52da2b8f07b5feec4ac",
    "id": 1,
    "name": "MIKUDAYO",
    "description": "KAJAJAJNKSDFKJ",
    "status": true,
    "heroType": "SHAMAN",
    "armorType": "CHEST",
    "image": "data:image/png;base64,...",
    "effects": [
      { "effectType": "BOOST_DEFENSE", "value": 15, "durationTurns": 3, "dropRate": 1, "stock": -1 }
    ]
  }
]
```

## Variables de entorno

| Variable | Ejemplo | Propósito |
|----------|---------|-----------|
| MONGODB_URI | mongodb://localhost:27017 | Conexión Mongo |
| INVENTORY_DB_NAME | comentarios | Forzar DB (omite autodetección) |
| INVENTORY_ARMORS_COLLECTION | armors | Nombre colección armors |
| INVENTORY_ITEMS_COLLECTION | items | Nombre colección items |
| INVENTORY_WEAPONS_COLLECTION | weapons | Nombre colección weapons |
| PORT | 1882 | Puerto HTTP |

## Errores comunes

| Situación | Síntoma | Acción |
|-----------|---------|--------|
| DB vacía | Arrays vacíos | Confirmar datos en Mongo shell |
| Colección diferente | 404 / arrays vacíos | Ajustar INVENTORY_*_COLLECTION |
| id no numérico | 400 | Enviar id válido (ej: /api/items/1) |
| Sin conexión Mongo | Error en log | Revisar MONGODB_URI / servicio Mongo |

## Extender con nuevo recurso (ej. Epics)

1. Crear types/EpicInterface.ts
2. Crear model/EpicModel.ts (copiar patrón de ItemModel)
3. Crear controller/EpicController.ts
4. Crear view/EpicView.ts
5. Montar en Server.ts (router.use('/api/epics', epicView.router))

## Buenas prácticas aplicadas

- Separación estricta Model/Controller/View.
- Conexión Mongo reutilizable.
- Tipos explícitos (interfaces).
- Código mínimo y legible.
- Posibilidad de crecimiento sin romper estructura.

## Mejoras sugeridas futuras

- Middleware de errores centralizado.
- Validación de query params (Zod / Joi).
- Paginación (limit + skip / cursor) para colecciones grandes.
- Cache (in-memory o Redis).
- Tests automatizados.
- Documentación OpenAPI (swagger.yaml).
- Métricas (Prometheus) y logging estructurado.
- Filtros avanzados (rangos de dropRate, text search).

## Script básico de prueba (PowerShell)

```
Invoke-RestMethod -Uri http://localhost:1882/api/armors
Invoke-RestMethod -Uri http://localhost:1882/api/items
Invoke-RestMethod -Uri http://localhost:1882/api/weapons/1
```

## Licencia

Uso académico / interno del proyecto THE NEXUS BATTLES IV.

---

## Comentarios (Comments)

Endpoints públicos para visualizar y privados para crear/eliminar comentarios asociados a un recurso del inventario (armor, item, weapon).

Estructura de un comentario:

```
{
  _id: ObjectId,
  usuario: string,
  comentario: string,
  valoracion: 1..5,
  fecha: Date,
  referencia: { tipo: 'armor'|'item'|'weapon', id_objeto: ObjectId },
  // campos de auditoría en caso de eliminación lógica:
  eliminado?: true,
  deletedAt?: Date,
  deletedBy?: { user: string, role: 'player'|'admin' }
}
```

Reglas:
- Los listados ocultan comentarios eliminados (eliminado=true).
- Para crear o eliminar, el usuario debe autenticarse (Bearer token recomendado).

### Autenticación

- Login: `POST /api/login`
  - Headers: `user: <username>`, `pass: <password>` (para desarrollo)
  - Respuesta: `{ token, user: { username, role } }`
  - Use el token en `Authorization: Bearer <token>` para llamadas autenticadas.

Usuarios de ejemplo (archivo `database/users.json`):
- admin / admin123 (role: admin)
- playerX / player123 (role: player)

### Crear comentario (auth requerido)

- `POST /api/comments`
- Headers: `Authorization: Bearer <token>`
- Body JSON:
  ```
  {
    "comentario": "Muy bueno",
    "valoracion": 5,
    "referencia": { "tipo": "armor", "id_objeto": "<ObjectId del recurso>" }
  }
  ```
  - El servidor completa `usuario` con el usuario autenticado.

### Listar comentarios por referencia (público)

- `GET /api/comments?tipo=armor&id_objeto=<ObjectId>&limit=50&skip=0`
- Alternativa por ruta (ID lógico o ObjectId):
  - Solo comentarios: `GET /api/:tipo/:idOrOid/comments`
  - Resumen (producto + comentarios + stats): `GET /api/comments/:tipo/:idOrOid`

Notas:
- `:idOrOid` acepta `id` lógico numérico (campo `id`) o un ObjectId de 24 hex.
- Las estadísticas incluyen `count`, `average` y `distribution` por valoración.

### Eliminar comentario (eliminación lógica, auth requerido)

- `DELETE /api/comments/:id?confirm=true`
- Requisitos:
  - Autenticado (Bearer token o headers `x-auth-user`/`x-auth-role` en desarrollo).
  - Si el rol es `player`, solo puede eliminar comentarios cuyo `usuario` sea el propio.
  - Rol `admin` puede eliminar cualquier comentario.
  - Debe incluir `?confirm=true` para confirmar la operación.
- Efecto:
  - Marca el comentario con `eliminado=true`, `deletedAt`, `deletedBy`.
  - El comentario deja de aparecer en listados públicos y en el resumen.

### Ejemplos rápidos (PowerShell)

```
# Login (dev)
$login = Invoke-RestMethod -Method Post -Uri http://localhost:1882/api/login -Headers @{ user='playerX'; pass='player123' }
$token = $login.token

# Crear
Invoke-RestMethod -Method Post -Uri http://localhost:1882/api/comments -Headers @{ Authorization = "Bearer $token" } -Body (@{
  comentario='Me encantó'; valoracion=5; referencia=@{ tipo='armor'; id_objeto='64c1f3b6a2c4d4b1a2c4d4b1' }
} | ConvertTo-Json) -ContentType 'application/json'

# Listar por ruta (solo comentarios)
Invoke-RestMethod -Uri http://localhost:1882/api/armor/1/comments

# Resumen por ruta (producto + comentarios + stats)
Invoke-RestMethod -Uri http://localhost:1882/api/comments/armor/1

# Eliminar lógicamente (requiere confirm)
Invoke-RestMethod -Method Delete -Uri "http://localhost:1882/api/comments/64c1f3b6a2c4d4b1a2c4d4b9?confirm=true" -Headers @{ Authorization = "Bearer $token" }
```

---

Changelog (comentarios):
- Soporte de creación y listado por referencia.
- Endpoint de resumen con estadísticas.
- Eliminación lógica con auditoría y confirmación.