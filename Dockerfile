FROM node:12
WORKDIR /app
COPY ./app/package*.json ./
RUN npm install
CMD ["node", "server"]