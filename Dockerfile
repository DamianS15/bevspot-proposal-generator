FROM node:20-slim

WORKDIR /app

# Copy package metadata and install ALL dependencies
# (We need devDependencies too since Vite is used to build the frontend)
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the static frontend bundle (outputs to /dist)
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the API and Web port
EXPOSE 3001

# Start the Express server
CMD ["node", "server.cjs"]
