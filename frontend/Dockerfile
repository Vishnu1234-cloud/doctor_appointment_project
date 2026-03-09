# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies using yarn or npm properly mapped
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Define Build Arguments properly mapping REACT_APP dynamically
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Copy source and build
COPY . .
RUN yarn build

# Production stage - NGINX router mapping
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Configure SPA routing fallback inside alpine natively
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
