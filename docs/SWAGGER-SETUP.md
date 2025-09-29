# Documentación Swagger - API Comentarios

## 🚀 Configuración de Swagger

Se ha agregado Swagger UI a tu API para proporcionar documentación interactiva de todos los endpoints.

## 📖 Acceso a la Documentación

Una vez que el servidor esté ejecutándose, puedes acceder a la documentación de Swagger en:

- **UI Interactivo**: `http://localhost:1802/api-docs`
- **Especificación JSON**: `http://localhost:1802/api-docs.json`

## 🔧 Dependencias Agregadas

```json
{
  "dependencies": {
    "swagger-ui-express": "^4.x.x",
    "swagger-jsdoc": "^6.x.x"
  },
  "devDependencies": {
    "@types/swagger-ui-express": "^4.x.x",
    "@types/swagger-jsdoc": "^1.x.x"
  }
}
```

## 📋 Endpoints Documentados

### 🛡️ Armors
- `GET /api/armors` - Obtener lista de armaduras
- `GET /api/armors/{id}` - Obtener armadura por ID

### 🎒 Items  
- `GET /api/items` - Obtener lista de items
- `GET /api/items/{id}` - Obtener item por ID

### ⚔️ Weapons
- `GET /api/weapons` - Obtener lista de armas
- `GET /api/weapons/{id}` - Obtener arma por ID

### 💬 Comments
- `GET /{tipo}/{idOrOid}/comments` - Obtener comentarios de un recurso
- `GET /comments/{tipo}/{idOrOid}` - Obtener resumen completo del recurso
- `POST /{tipo}/{idOrOid}/comments` - Crear comentario (requiere auth)
- `PUT /{tipo}/{idOrOid}/comments/{commentId}` - Editar comentario (requiere auth)
- `DELETE /{tipo}/{idOrOid}/comments/{commentId}` - Eliminar comentario (requiere auth)
- `POST /{tipo}/{idOrOid}/comments/{commentId}/replies` - Responder comentario (requiere auth)
- `POST /comments` - Crear comentario directo (requiere auth)

### 🔐 Authentication
- `POST /api/login` - Iniciar sesión

## 🔐 Autenticación en Swagger

La API utiliza múltiples métodos de autenticación:

1. **Bearer Token**: Usa el token JWT obtenido del login
2. **User Auth**: Header `x-auth-user` 
3. **Basic Auth**: Autenticación HTTP básica

### Cómo autenticarse en Swagger UI:

1. Haz clic en el botón **"Authorize"** en la parte superior derecha
2. Ingresa tus credenciales según el método elegido:
   - Para Bearer: `Bearer {tu-token-jwt}`
   - Para User Auth: Solo el nombre de usuario
   - Para Basic: Usuario y contraseña

## 🎨 Características de la Documentación

- **Interfaz interactiva** para probar endpoints
- **Esquemas de datos** definidos para todos los modelos
- **Ejemplos de respuesta** para cada endpoint
- **Códigos de estado HTTP** documentados
- **Parámetros de entrada** con validaciones
- **Autenticación integrada** para probar endpoints protegidos

## 🚀 Ejecutar el Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 📝 Personalización

La configuración de Swagger se encuentra en:
- `src/swagger/swaggerConfig.ts` - Configuración principal
- Documentación inline en archivos `*View.ts` usando comentarios JSDoc

## 🔍 Esquemas Disponibles

- **Armor**: Modelo de armadura
- **Item**: Modelo de item
- **Weapon**: Modelo de arma
- **Comment**: Modelo de comentario
- **CommentInput**: Datos de entrada para comentarios
- **LoginCredentials**: Credenciales de login
- **AuthResponse**: Respuesta de autenticación
- **Error**: Modelo de error estándar

## 📊 Tipos de Respuesta

Todas las respuestas siguen el formato estándar:

```json
{
  "success": true,
  "data": { /* contenido */ },
  "message": "Mensaje descriptivo"
}
```

Para errores:
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos"
}
```