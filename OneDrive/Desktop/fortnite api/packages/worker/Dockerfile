FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port (not needed for worker, but useful for health checks)
EXPOSE 3001

# Run the worker
CMD ["npm", "start"]
