import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPhoneNumber1780757187937 implements MigrationInterface {
  name = 'AddUserPhoneNumber1780757187937';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "phone_number" character varying`,
    );
    await queryRunner.query(
      `UPDATE "user" SET "phone_number" = 'TEMP_' || "id" WHERE "phone_number" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "phone_number" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_01eea41349b6c9275aec646eee0" UNIQUE ("phone_number")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_01eea41349b6c9275aec646eee0"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone_number"`);
  }
}
