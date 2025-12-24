# Use official Azure Functions Node.js image
FROM mcr.microsoft.com/azure-functions/node:4-node18

# Set working directory
WORKDIR /home/site/wwwroot

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all function app files
COPY . .

# Expose port 80 (Azure Functions container default)
EXPOSE 80

# Default command (already defined in base image)
# CMD ["npm", "start"]  # Not needed because base image handles func host