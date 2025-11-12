# Application

## Docker local database

### Step 01

```bash
    docker compose -f docker-compose.postgres.yml up -d
```

### Step 02

Prisma ORM database creation

```bash
# Step 01
npx prisma generate

# Step 02
npx prisma migrate dev

# Step 03
npx prisma db push

# Step 04
# seeding database
npx tsx prisma/seed.ts
```

Db Connection

```bash
# old
DATABASE_URL:"postgresql://zuser:zpassword@localhost:5432/zlovaxdb?schema=public"

Admin@011235

zlavox-ai:us-central1:zlavoxdb

./deploy.sh
```
