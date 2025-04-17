# Stage 1: Backend (Express API)
FROM node:18-alpine AS backend
WORKDIR /backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
EXPOSE 5000
CMD ["npm", "start"]

# Stage 2: Client Build (Vite app)
FROM node:18-alpine AS client-build
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 3: Production Client (Nginx)
FROM nginx:alpine AS client
COPY --from=client-build /client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]