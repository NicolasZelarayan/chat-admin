# Base image
FROM node:23-slim

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build frontend
RUN npm run build

# Expose ports (backend and frontend)
EXPOSE 3000 5173

# Start the application
CMD ["npm", "run", "dev"]