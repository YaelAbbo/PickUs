import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVectorEmbeddings1778251170009 implements MigrationInterface {
  name = 'AddVectorEmbeddings1778251170009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Using 768 dimensions for Gemini text-embedding-004 model, for other models, adjust the dimension accordingly.
    await queryRunner.query(
      `ALTER TABLE "user" ADD "avg_ride_embedding" vector(768)`,
    );
    await queryRunner.query(`ALTER TABLE "ride" ADD "embedding" vector(768)`);

    // HNSW (Hierarchical Navigable Small World) indexes for highly performant vector similarity search.
    await queryRunner.query(
      `CREATE INDEX "idx_user_avg_ride_embedding" ON "user" USING hnsw ("avg_ride_embedding" vector_cosine_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ride_embedding" ON "ride" USING hnsw ("embedding" vector_cosine_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_ride_embedding"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_user_avg_ride_embedding"`,
    );
    await queryRunner.query(`ALTER TABLE "ride" DROP COLUMN "embedding"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "avg_ride_embedding"`,
    );
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
  }
}
