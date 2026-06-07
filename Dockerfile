FROM node:alpine

WORKDIR /random

COPY package*.json .

RUN npm install

COPY . .

CMD [ "npm", "start" ]