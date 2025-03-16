FROM node:23

WORKDIR /app

# Copy package files first for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci --force

# Copy the entire application
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the production server
CMD ["npm", "start"]
