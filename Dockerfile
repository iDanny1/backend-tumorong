# Use official Node.js image as the base
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build and running with tsx)
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the frontend assets (Vite builds to dist/)
RUN npm run build

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the server using tsx
CMD ["npx", "tsx", "server.ts"]
