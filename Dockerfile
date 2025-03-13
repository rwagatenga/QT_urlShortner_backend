FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN rm -rf node_modules
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5001
# CMD ["sh", "-c", "npm" "run db:migrate && npm run db:seed && node dist/index.js"]
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run dev"]
