# ==========================================
# Practical 11: Frontend React Dockerfile (Multi-Stage Build)
# Student: Jay Ladva (24CS045) | Course: ITUE301
# ==========================================

# Stage 1: Build Stage (Compiles JSX into optimized production bundle)
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency manifests for layer caching
COPY package*.json ./

# Install all dependencies including Vite and React build tooling
RUN npm install

# Copy source code and build client bundle
COPY . .
RUN npm run build

# Stage 2: Runtime Stage (Supplementary Problem: Multi-stage build to reduce image size)
FROM node:18-alpine AS runner

WORKDIR /app

# Copy only production essentials and built artifacts from the build stage
COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/vite.config.js ./

# Expose Vite preview port
EXPOSE 5173

# Launch preview server bound to 0.0.0.0 so host browser can connect
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
