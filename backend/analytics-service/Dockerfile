FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force

COPY dist/ ./dist/

EXPOSE 3005

ENV NODE_ENV=production
ENV PORT=3005

CMD ["node", "dist/index.js"]
