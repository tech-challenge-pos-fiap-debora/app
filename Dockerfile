# =========================
# Development
# =========================
FROM node:22.17.1-bookworm AS development

WORKDIR /app

ENV NODE_ENV=development

RUN corepack enable

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["yarn", "start:dev"]


# =========================
# Build
# =========================
FROM node:22.17.1-bookworm AS build

WORKDIR /usr/src/app

RUN corepack enable

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

RUN find . -type f -name '*.json' \
  -exec mkdir -p dist/"$(dirname {})" \; \
  -exec cp {} dist/"{}" \;


# =========================
# Production dependencies
# =========================
FROM build AS prod-deps

ENV NODE_ENV=production

RUN yarn install --frozen-lockfile --production


# =========================
# Migrations (K8s Job)
# =========================
FROM build AS migrations

WORKDIR /usr/src/app

CMD ["yarn", "migrate:up"]


# =========================
# Production
# =========================
FROM node:22.17.1-bookworm-slim AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --chown=node:node package.json yarn.lock newrelic.js ./

COPY --chown=node:node --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

USER node

EXPOSE 3000

# O agente precisa ser carregado antes da aplicação para instrumentar http e mongodb.
CMD ["node", "-r", "newrelic", "dist/main.js"]
