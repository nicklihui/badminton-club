FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# The built server has no runtime npm dependencies (SQLite is built into Node).
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/data/club.db
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
VOLUME /data
EXPOSE 3000
USER node
CMD ["node", "build"]
