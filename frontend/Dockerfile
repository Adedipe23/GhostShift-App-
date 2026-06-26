# ─── Build stage: compile React app ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build args to bake env vars into the Vite bundle at build time
ARG VITE_API_URL=http://localhost:8000/api

ENV VITE_API_URL=$VITE_API_URL

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

# ─── Runtime stage: serve via Nginx ──────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/ghostshift.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
