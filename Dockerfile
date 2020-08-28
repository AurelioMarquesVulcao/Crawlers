FROM node:12.18.0-buster-slim@sha256:97da8d5023fd0380ed923d13f83041dd60b0744e4d140f6276c93096e85d0899
WORKDIR /app
COPY ./app ./
#RUN  apt-get update -y && apt-get install -y procps

#Libs
RUN  apt-get update && apt-get install -y --no-install-recommends \
     wget \
     procps \
     gnupg \
     ca-certificates \
     libxss1 \
     && rm -rf /var/lib/apt/lists/*

#Outras instalacoes
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
&& sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
&& apt-get update \
&& apt-get install -y google-chrome-stable \
&& rm -rf /var/lib/apt/lists/* \
&& wget --quiet https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -O /usr/sbin/wait-for-it.sh \
&& chmod +x /usr/sbin/wait-for-it.sh


RUN npm install && npm install -g pm2 nodemon
CMD ["node", "server"]
# CMD ["pm2-docker", "ecosystem.config.js"]
