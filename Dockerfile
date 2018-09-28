FROM node:8.12

WORKDIR /app

RUN yarn global add typescript

COPY . .

RUN yarn install

RUN tsc

CMD ["npm", "run", "start"]

EXPOSE  9691
