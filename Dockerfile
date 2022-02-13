# Install image of the nodejs version
FROM node:14

# Path of the working directory
WORKDIR /cs-help-pbp

#Copy package.json to the docker working directory
COPY package.json .

# Install node modules
RUN npm install

# Copy source code to docker
COPY . .

# Run backend
CMD npm run serve