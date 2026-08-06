import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUserUniqueConstraints1785940086981 implements MigrationInterface {
  name = 'FixUserUniqueConstraints1785940086981';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "user_national_id_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_01eea41349b6c9275aec646eee0"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_phone_number" ON "user" ("phone_number") WHERE "is_deleted" IS FALSE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_email" ON "user" ("email") WHERE "is_deleted" IS FALSE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_national_id" ON "user" ("national_id") WHERE "is_deleted" IS FALSE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."uq_user_national_id"`);
    await queryRunner.query(`DROP INDEX "public"."uq_user_email"`);
    await queryRunner.query(`DROP INDEX "public"."uq_user_phone_number"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_01eea41349b6c9275aec646eee0" UNIQUE ("phone_number")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_email" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "user_national_id_key" UNIQUE ("national_id")`,
    );
  }
}
