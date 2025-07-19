FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY . .
RUN ls -a
RUN npm install
RUN npm run build
RUN ls -a
EXPOSE 3002
CMD ["node","./src/index.js"]