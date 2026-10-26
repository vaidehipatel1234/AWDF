# ==========================================
# Practical 11: Backend Node.js Express Dockerfile
# Student: Jay Ladva (24CS045) | Course: ITUE301
# ==========================================

FROM node:18-alpine

WORKDIR /app

# Copy package files first for optimal Docker layer caching
COPY package*.json ./

# Install production and development dependencies
RUN npm install

# Copy application source code (excluding files in .dockerignore)
COPY . .

# Expose backend service port
EXPOSE 5000

# Start Express API server
CMD ["node", "server.js"]
