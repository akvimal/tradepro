# Base image
FROM node:20.17.0-alpine
#FROM node:18.19.1

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# RUN npm install -g npm@10.2.4

# Install app dependencies
RUN npm install --force

# Bundle app source
COPY . .


# Copy the .env and .env.development files
#COPY .env .env.development ./

# Creates a "dist" folder with the production build
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3000

# Start the server using the production build
CMD ["npm", "run", "start:prod"]