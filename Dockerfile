# Base image
FROM node:20-slim

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

# Modificar server.js para servir archivos estáticos (sin redeclarar path)
RUN echo '\n// Servir archivos estáticos de React\napp.use(express.static("dist"));\n\n// Para cualquier otra ruta que no sea API, servir index.html\napp.get("*", (req, res) => {\n  if (!req.path.startsWith("/api")) {\n    res.sendFile(path.resolve(__dirname, "dist", "index.html"));\n  }\n});' >> server.js

# Configurar servidor para escuchar en todas las interfaces
RUN sed -i 's/app.listen(PORT)/app.listen(PORT, "0.0.0.0")/' server.js

# Expose only one port
EXPOSE 3000

# Start only the backend server, which will also serve the frontend
CMD ["node", "server.js"]