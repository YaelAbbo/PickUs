## Connect to PgAdmin

PgAdmin is available at <http://localhost:8080>

- Login:
  - Email/Username: <admin@pickus.com>
  - Password: admin
- Connect to db server using .env

## Migrations

> **All migration commands are run inside the backend container** (`pickus_backend`).
> This ensures the correct database connection and environment variables are used.

**1. Make entity changes**

**2. Generate migration with descriptive name**

```bash
docker exec -it pickus_backend npm run migration:generate -- src/database/migrations/AddUserPhoneNumber
```

**3. Review generated migration file**

**4. Run migration**

```bash
docker exec -it pickus_backend npm run migration:run
```

**5. Verify database migrated correctly**

**6. If needed, rollback the migration**

```bash
docker exec -it pickus_backend npm run migration:revert
docker exec -it pickus_backend npm run migration:run
```

**You can check migration status**

```bash
docker exec -it pickus_backend npm run typeorm migration:show -- -d src/data-source.ts
```

**Remember:** Migrations are version control for your database schema.
