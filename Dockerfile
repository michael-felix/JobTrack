FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

COPY . .

EXPOSE 3000

# docker-compose.yml sets NODE_ENV=development for local dev (hot-reload
# against the bind-mounted source). Railway sets NODE_ENV=production by
# default for every service — if it ever builds from this Dockerfile
# instead of the Nixpacks builder pinned in railway.json (e.g. because a
# service's builder was already locked to "Dockerfile" from before
# railway.json existed), this still produces a real production server
# with migrations applied, never the dev server serving unmigrated data.
CMD sh -c 'if [ "$NODE_ENV" = "production" ]; then npm run build && npm start; else npm run dev; fi'
