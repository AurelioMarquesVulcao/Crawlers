FROM node:12
WORKDIR /app
COPY ./app ./
RUN npm install
CMD ["node", "server"]