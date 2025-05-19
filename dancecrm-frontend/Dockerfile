# dancecrm-frontend/Dockerfile

# 1) Строим статические файлы
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --unsafe-perm
COPY . .
RUN node node_modules/vite/bin/vite.js build


# 2) Отдаём через Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
