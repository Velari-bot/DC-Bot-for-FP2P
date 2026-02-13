FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY public ./public

# Expose port
EXPOSE 3000

# Run in dev mode (for docker-compose)
CMD ["npm", "run", "dev"]
