#!/bin/bash

DOCKER_WORKDIR=.docker

DATA_DOCKERFILE='
FROM nginx:stable-alpine

VOLUME /etc/nginx/conf.d

COPY nginx.conf /etc/nginx/nginx.conf
COPY dist /usr/share/nginx/web
'

DATA_NGINX_CONFIG='
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  30s;
    keepalive_requests 1000;

    upstream http_backend {
        server jobeditor:8080;
        keepalive 64;
    }

    server {
        listen       80;
        server_name  localhost;

        location /api/ {
            proxy_pass http://http_backend/;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location / {
            root   /usr/share/nginx/web;
            index  index.html;
            try_files $uri $uri/ /index.html;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }

    include conf.d/*.conf;
}
'

build() {
    rm -rf "${DOCKER_WORKDIR}/" && mkdir -p "${DOCKER_WORKDIR}/"
    npm run build
    cp -r dist/ "${DOCKER_WORKDIR}/dist/"
    cat > "${DOCKER_WORKDIR}/Dockerfile" <<< "${DATA_DOCKERFILE}"
    cat > "${DOCKER_WORKDIR}/nginx.conf" <<< "${DATA_NGINX_CONFIG}"
    docker build -t jobeditor-web .docker/
}

build