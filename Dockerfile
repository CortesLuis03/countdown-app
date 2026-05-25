FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY env-inject.sh start.sh /
RUN chmod +x /env-inject.sh /start.sh
EXPOSE 80
CMD ["/start.sh"]
