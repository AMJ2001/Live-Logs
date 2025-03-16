FROM node:23

WORKDIR /app

# Install necessary global dependencies
RUN npm install -g ts-node

# Copy package files first
COPY package*.json ./

# Install project dependencies
RUN npm ci --force

# Copy the application source code
COPY . .

EXPOSE 5000

# Start Redis and the backend server
CMD ["sh", "-c", "redis-server & ts-node src/server.ts"]
