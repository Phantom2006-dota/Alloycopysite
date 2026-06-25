FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server
COPY shared ./shared
COPY drizzle.config.ts ./
COPY tsconfig.json ./
COPY html-blog-pages ./html-blog-pages

RUN npm install tsx drizzle-kit --save-dev

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080
ENV BACKEND_MODE=standalone

CMD ["npx", "tsx", "server/index.ts"]
