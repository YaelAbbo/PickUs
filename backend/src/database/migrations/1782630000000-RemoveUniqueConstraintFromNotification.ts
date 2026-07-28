import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUniqueConstraintFromNotification1782630000000 implements MigrationInterface {
  name = 'RemoveUniqueConstraintFromNotification1782630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "notification_recipient_ride_idx"`,
    );
    await queryRunner.query(
      `CREATE INDEX "notification_recipient_ride_idx" ON "notification" ("recipient_user_id", "ride_id") WHERE "ride_id" IS NOT NULL AND "is_deleted" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "notification_recipient_ride_idx"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "notification_recipient_ride_idx" ON "notification" ("recipient_user_id", "ride_id") WHERE "ride_id" IS NOT NULL AND "is_deleted" = false`,
    );
  }
}
