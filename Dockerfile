FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

COPY . .

EXPOSE 3000

# docker-compose.yml explicitly sets NODE_ENV=development for local dev
# (hot-reload against the bind-mounted source) — that's the only case that
# should run the dev server. Everything else, including NODE_ENV being
# entirely unset, defaults to a real production build + migrate + start.
# This matters because Railway only auto-sets NODE_ENV=production for its
# own Nixpacks builder, NOT for a custom Dockerfile build — if this image
# ever gets built by Railway directly (its builder locked to "Dockerfile"
# from before railway.json existed, overriding it), NODE_ENV arrives unset,
# and a check that required it to equal "production" to opt in would
# silently fall through to the dev server serving an unmigrated database.
CMD sh -c 'if [ "$NODE_ENV" = "development" ]; then npm run dev; else npm run build && npm start; fi'
