FROM node:20-alpine

WORKDIR /app

# Устанавливаем все зависимости (включая dev для сборки)
COPY package*.json ./
RUN npm ci

# Копируем исходники и собираем
COPY . .
RUN npm run build

# Удаляем dev зависимости
RUN npm prune --omit=dev

EXPOSE 4200

CMD ["node", "dist/main.js"]
