FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Copy schema.sql to dist for production
RUN cp src/schema.sql dist/schema.sql 2>/dev/null || true

EXPOSE 3001

CMD ["node", "dist/index.js"]
