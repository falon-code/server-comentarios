# --- Builder stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias (incluye dev para compilar)
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runner
WORKDIR /app

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar la build
COPY --from=builder /app/build ./build

# Copiar recursos necesarios
COPY database ./database

# Build-time args to bake defaults (can be overridden at runtime with -e)
ARG PORT=1802
ARG MONGODB_URI
ARG MONGODB_URI_INVENTORY
ARG MONGODB_URI_COMMENTS
ARG MONGODB_DB_COMMENTS
ARG INVENTORY_DB_NAME
ARG INVENTORY_ITEMS_COLLECTION
ARG INVENTORY_ARMORS_COLLECTION
ARG INVENTORY_WEAPONS_COLLECTION

# Map ARGs to ENV so the app sees them
ENV PORT=${PORT}
ENV MONGODB_URI=${MONGODB_URI}
ENV MONGODB_URI_INVENTORY=${MONGODB_URI_INVENTORY}
ENV MONGODB_URI_COMMENTS=${MONGODB_URI_COMMENTS}
ENV MONGODB_DB_COMMENTS=${MONGODB_DB_COMMENTS}
ENV INVENTORY_DB_NAME=${INVENTORY_DB_NAME}
ENV INVENTORY_ITEMS_COLLECTION=${INVENTORY_ITEMS_COLLECTION}
ENV INVENTORY_ARMORS_COLLECTION=${INVENTORY_ARMORS_COLLECTION}
ENV INVENTORY_WEAPONS_COLLECTION=${INVENTORY_WEAPONS_COLLECTION}

# Puerto (debe coincidir con process.env.PORT o default en server.ts)
EXPOSE ${PORT}

ENV NODE_ENV=production

# Copiar carpeta env para que dotenv pueda leer ./env/.env en runtime
COPY env ./env

# 🚀 Ejecutar directamente Node, no npm
CMD ["node", "build/src/index.js"]
