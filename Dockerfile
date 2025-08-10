FROM node:24-alpine

WORKDIR /app

COPY nestjs-app/package*.json ./
RUN npm install

COPY nestjs-app/ .

RUN npm run build

CMD ["npm", "run", "start:dev"]
