# ---------- FRONTEND BUILD ----------
    FROM node:18 AS frontend

    WORKDIR /app/client
    COPY client/ .
    
    RUN npm install
    RUN npm run build
    
    # ---------- BACKEND ----------
    FROM node:18 AS backend
    
    WORKDIR /app
    
    # Copy backend code
    COPY server/ ./server
    
    # Copy built frontend into backend's public directory
    COPY --from=frontend /app/client/dist ./server/public
    
    WORKDIR /app/server
    COPY server/package*.json ./
    
    # Install backend dependencies
    RUN npm install
    
    # Expose port
    EXPOSE 5000
    
    # Set environment variables (or use a .env file in docker-compose)
    ENV NODE_ENV=production
    
    CMD ["node", "server.js"]
    