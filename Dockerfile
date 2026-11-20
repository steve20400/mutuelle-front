# Preview web du front Expo (pas une vraie build mobile APK/IPA — pour ça, voir README.md)
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8081

CMD ["npx", "expo", "start", "--web", "--port", "8081"]
