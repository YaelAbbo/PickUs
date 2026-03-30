import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationNameToRideStop1774704817387 implements MigrationInterface {
  name = 'AddLocationNameToRideStop1774704817387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ride_stop" ADD "location_name" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ride_stop" DROP COLUMN "location_name"`,
    );
  }
}
