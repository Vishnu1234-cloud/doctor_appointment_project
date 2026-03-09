FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies strictly
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose backend port
EXPOSE 8001

# Add explicit non-root user execution
USER node

# Start production server
CMD ["node", "src/server.js"]
