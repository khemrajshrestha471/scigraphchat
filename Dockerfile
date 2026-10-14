# Multi-stage build: compile the static site, then serve it with nginx.
# Build from the sciflowdiagram/ directory itself (not the repo root):
#   docker build -t sciflowdiagram sciflowdiagram/
#   docker run --rm -p 8080:80 sciflowdiagram
# then open http://localhost:8080

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
