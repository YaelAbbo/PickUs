import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeRideLocationsToRideStops1774702689251 implements MigrationInterface {
  name = 'ChangeRideLocationsToRideStops1774702689251';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ride" DROP COLUMN "start_location"`);
    await queryRunner.query(`ALTER TABLE "ride" DROP COLUMN "end_location"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ride" ADD "end_location" geography(Point,4326) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride" ADD "start_location" geography(Point,4326) NOT NULL`,
    );
  }
}
