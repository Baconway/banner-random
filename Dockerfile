FROM node:slim

WORKDIR /random

COPY package*.json .

RUN npm install

COPY . .

CMD [ "npm", "start" ]