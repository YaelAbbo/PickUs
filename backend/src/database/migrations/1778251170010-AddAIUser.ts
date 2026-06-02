import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAIUser1778251170010 implements MigrationInterface {
  name = 'AddAIUser1778251170010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "organization" (id, name, is_deleted)
      VALUES ('a015ddf0-2a45-44e4-83d4-ac98c48cbf0a', 'PickUs', false)
      ON CONFLICT (name) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "user" (
        id,
        national_id,
        org_id,
        first_name,
        last_name,
        email,
        password_hash,
        role,
        is_temp_password,
        is_deleted,
        profile_image_url
      )
      SELECT 
        '967c1974-dd5d-415e-ba71-d202109d408b',
        '999588957',
        org.id,
        'פיק-איי',
        '',
        'pickus.app@gmail.com',
        '',
        'AI',
        false,
        false,
        'https://res.cloudinary.com/djlyxzaj7/image/upload/v1774385274/logo_rxckuq.jpg'
      FROM "organization" org
      WHERE org.name = 'PickUs' AND org.is_deleted = false
        AND NOT EXISTS (
          SELECT 1 FROM "user" WHERE role = 'AI' AND is_deleted = false
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user"
      WHERE id = '967c1974-dd5d-415e-ba71-d202109d408b'
    `);
  }
}
