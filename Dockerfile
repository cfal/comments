FROM node:5.1
ENV PATH /usr/src/app/node_modules/.bin:$PATH
ADD . /usr/src/app
RUN cd /usr/src/app && npm install && gulp --uglify
CMD (sleep 1 && node /usr/src/app/scripts/populate.js) & (node /usr/src/app/out/server/server.js)

