FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 19000 19001

CMD ["npx", "expo", "start", "--web"]