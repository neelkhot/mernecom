# Step 1: Build frontend
FROM node:18 AS frontend

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ .
RUN npm run build


# Step 2: Setup backend and serve built frontend
FROM node:18 AS backend

WORKDIR /app

# Copy backend code
COPY server/package*.json ./server/
RUN cd server && npm install

COPY server ./server

# Copy built frontend from previous stage
COPY --from=frontend /app/client/dist ./server/public

# Set working directory to backend
WORKDIR /app/server

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
