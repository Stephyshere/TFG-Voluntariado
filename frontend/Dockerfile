# Etapa de compilación (Build)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# En este punto Dokploy pasará las variables de entorno (como VITE_API_URL)
RUN npm run build

# Etapa de producción (servir los estáticos con Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copiar configuración de Nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
