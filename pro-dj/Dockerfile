# Use a base image that includes both Node.js and PostgreSQL
FROM postgres:15-alpine

# Install Node.js and npm
RUN apk add --no-cache \
    nodejs \
    npm \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 5432

# Set environment variables for PostgreSQL
ENV POSTGRES_DB=pro_dj
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pro_dj

# Set Node.js options for better memory management
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Start the application
CMD ["/app/start.sh"]
