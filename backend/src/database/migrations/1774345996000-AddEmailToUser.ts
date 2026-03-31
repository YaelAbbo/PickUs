import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailToUser1774345996000 implements MigrationInterface {
  name = 'AddEmailToUser1774345996000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "email" VARCHAR`);

    // Back-fill existing rows with a placeholder derived from their national_id
    await queryRunner.query(
      `UPDATE "user" SET "email" = CONCAT('placeholder+', "national_id", '@example.com') WHERE "email" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_email" UNIQUE ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_email"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
  }
}
