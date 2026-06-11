import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRideStats1779809760257 implements MigrationInterface {
  name = 'AddUserRideStats1779809760257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add user ride statistics columns (vector columns already added in AddVectorEmbeddings migration)
    await queryRunner.query(
      `ALTER TABLE "user" ADD "avg_start_location" geography(Point,4326)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "avg_end_location" geography(Point,4326)`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "avg_start_time" TIME`);
    await queryRunner.query(`ALTER TABLE "user" ADD "avg_end_time" TIME`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "completed_rides_count" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "completed_rides_count"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avg_end_time"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avg_start_time"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "avg_end_location"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "avg_start_location"`,
    );
  }
}
