import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Extensions and Utils
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "set_updated_at"()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW."updated_at" := NOW();
        RETURN NEW;
      END;
      $$;
    `);

    // 2. Organization Table
    await queryRunner.query(`
      CREATE TABLE "organization" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR NOT NULL UNIQUE,
        "image_url" VARCHAR,
        "is_deleted" BOOL NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 3. User Role Enum & User Table
    await queryRunner.query(
      `CREATE TYPE "user_role" AS ENUM ('BASIC_USER', 'HR_MANAGER', 'ADMIN', 'AI')`,
    );
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "national_id" VARCHAR NOT NULL UNIQUE,
        "org_id" UUID NOT NULL,
        "first_name" VARCHAR NOT NULL,
        "last_name" VARCHAR NOT NULL,
        "password_hash" VARCHAR NOT NULL,
        "is_temp_password" BOOL NOT NULL DEFAULT TRUE,
        "role" "user_role" NOT NULL DEFAULT 'BASIC_USER',
        "profile_image_url" VARCHAR,
        "hashed_refresh_token" VARCHAR,
        "current_location" GEOGRAPHY(POINT, 4326),
        "is_deleted" BOOL NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "user_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // 4. Add admin_id to Organization
    await queryRunner.query(
      `ALTER TABLE "organization" ADD COLUMN "admin_id" UUID`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD CONSTRAINT "UQ_4020dcdbdc6830b903b1eee01a0" UNIQUE ("admin_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD CONSTRAINT "organization_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // 5. Ride Status Enum & Ride Table
    await queryRunner.query(
      `CREATE TYPE "ride_status" AS ENUM ('PENDING', 'ACTIVE', 'DONE', 'CANCELLED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "ride" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "org_id" UUID NOT NULL,
        "driver_id" UUID NOT NULL,
        "starts_at" TIMESTAMPTZ NOT NULL,
        "estimated_ends_at" TIMESTAMPTZ NOT NULL,
        "start_location" GEOGRAPHY(POINT, 4326) NOT NULL,
        "end_location" GEOGRAPHY(POINT, 4326) NOT NULL,
        "current_location" GEOGRAPHY(POINT, 4326),
        "max_seats_amount" INT NOT NULL,
        "ride_status" "ride_status" NOT NULL DEFAULT 'PENDING',
        "is_deleted" BOOL NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "ride_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "ride_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "ride_driver_id_starts_at_key" UNIQUE ("driver_id", "starts_at"),
        CONSTRAINT "ride_max_seats_amount_check" CHECK (max_seats_amount > 0),
        CONSTRAINT "ride_check" CHECK (estimated_ends_at > starts_at)
      )
    `);

    // 6. Ride Stop Table
    await queryRunner.query(`
      CREATE TABLE "ride_stop" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ride_id" UUID NOT NULL,
        "location" GEOGRAPHY(POINT, 4326) NOT NULL,
        "estimated_arrival_at" TIMESTAMPTZ NOT NULL,
        "order_index" INT NOT NULL,
        "is_deleted" BOOL NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "ride_stop_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "ride"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "ride_stop_ride_id_location_key" UNIQUE ("ride_id", "location")
      )
    `);

    // 7. Ride Passenger Table
    await queryRunner.query(`
      CREATE TABLE "ride_passenger" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" UUID NOT NULL,
        "ride_id" UUID NOT NULL,
        "ride_stop_id" UUID NOT NULL,
        "is_deleted" BOOL NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "ride_passenger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "ride_passenger_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "ride"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "ride_passenger_ride_stop_id_fkey" FOREIGN KEY ("ride_stop_id") REFERENCES "ride_stop"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "ride_passenger_user_id_ride_id_key" UNIQUE ("user_id", "ride_id")
      )
    `);

    // 8. Notifications
    await queryRunner.query(`
      CREATE TABLE "notification" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_by_user_id" UUID NOT NULL,
        "ride_id" UUID,
        "content" VARCHAR NOT NULL,
        "is_deleted" BOOL NOT NULL DEFAULT FALSE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "notification_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "notification_ride_id_fkey" FOREIGN KEY ("ride_id") REFERENCES "ride"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // 9. Triggers
    const tables = [
      'organization',
      'user',
      'ride',
      'ride_stop',
      'ride_passenger',
      'notification',
    ];
    for (const table of tables) {
      await queryRunner.query(`
        CREATE TRIGGER "${table}_set_updated_at"
        BEFORE UPDATE ON "${table}"
        FOR EACH ROW EXECUTE PROCEDURE "set_updated_at"();
      `);
    }

    // 10. Indexes
    await queryRunner.query(
      `CREATE INDEX "user_current_location_index" ON "user" USING GIST ("current_location")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ride_current_location_index" ON "ride" USING GIST ("current_location")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ride_stop_location_index" ON "ride_stop" USING GIST ("location")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notification" CASCADE`);
    await queryRunner.query(`DROP TABLE "ride_passenger" CASCADE`);
    await queryRunner.query(`DROP TABLE "ride_stop" CASCADE`);
    await queryRunner.query(`DROP TABLE "ride" CASCADE`);
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "admin_id"`,
    );
    await queryRunner.query(`DROP TABLE "user" CASCADE`);
    await queryRunner.query(`DROP TABLE "organization" CASCADE`);
    await queryRunner.query(`DROP TYPE "ride_status"`);
    await queryRunner.query(`DROP TYPE "user_role"`);
    await queryRunner.query(`DROP FUNCTION "set_updated_at"`);
  }
}
