# Stage 1: Build the React Frontend
FROM node:18-alpine AS build

# Set working directory for client
WORKDIR /app/client

# Copy client dependencies and install
COPY client/package*.json ./
RUN npm install

# Copy client source code and build
COPY client/ ./
RUN npm run build

# Stage 2: Setup the Express Backend
FROM node:18-alpine

# Set working directory for server
WORKDIR /app/server

# Copy server dependencies and install
COPY server/package*.json ./
RUN npm install --production

# Copy server source code
COPY server/ ./

# Copy built React files from the build stage into the container
# The server is already configured to serve from ../client/dist
COPY --from=build /app/client/dist /app/client/dist

# Expose the server port
EXPOSE 3000

# Start the Express server
CMD ["node", "server.js"]
