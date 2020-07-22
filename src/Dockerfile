FROM node:current
WORKDIR /usr/src/quizengine

COPY . .
RUN npm install
EXPOSE 8080
ENV NODE_PATH /usr/src/quizengine
CMD ["node", "index.js"]