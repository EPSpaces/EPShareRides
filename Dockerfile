# Use Node.js LTS version on alpine as base image
FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependecies
RUN npm install

# Copy the rest of the application's code
COPY . .

# Expose port 80
EXPOSE 80

ENV MONGO_URI=uri
ENV PORT=80
ENV EMAIL_ADDRESS=
ENV EMAIL_PASSWORD=
ENV TOKEN_SECRET=

# Command to run application
CMD ["npm", "run"]