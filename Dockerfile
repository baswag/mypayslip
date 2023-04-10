FROM node:18-alpine as builder

WORKDIR /app

COPY --chown=node:node .pnp.cjs \
    .pnp.loader.mjs \
    .yarnrc.yml \
    package.json \
    yarn.lock \
    tsconfig.json \
    /app/

COPY --chown=node:node .yarn /app/.yarn/

RUN yarn install --immutable

COPY --chown=node:node src /app/src/

RUN yarn tsc

RUN yarn prod-install /build
RUN cp -r dist /build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /build .

ENTRYPOINT ["yarn", "node", "dist/main.js"]