## Connect to PgAdmin:

PgAdmin is available at http://localhost:8080

- Login:
  - Email/Username: admin@pickus.com
  - Password: admin
- Connect to db server using .env

## Migrations

**1. Make entity changes**

**2. Generate migration with descriptive name**

```bash
npm run migration:generate -- src/database/migrations/AddUserPhoneNumber
```

**3. Review generated migration file**

**4. Run migration**

```bash
npm run migration:run
```

**5. Verify database migrated correctly**

**6. If needed, rollback the migration**

```bash
npm run migration:revert
npm run migration:run
```

**You can check migration status**

```bash
npm run typeorm migration:show -- -d src/data-source.ts
```

**Remember:** Migrations are version control for your database schema.
