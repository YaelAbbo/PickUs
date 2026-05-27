import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationRecipient1716825600000 implements MigrationInterface {
  name = 'AddNotificationRecipient1716825600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification"
      ADD COLUMN "recipient_user_id" uuid
      REFERENCES "user"("id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "notification_recipient_ride_idx"
      ON "notification" ("recipient_user_id", "ride_id")
      WHERE "ride_id" IS NOT NULL AND "is_deleted" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "notification_recipient_ride_idx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "recipient_user_id"`,
    );
  }
}
