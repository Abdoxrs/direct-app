import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1234567890123 implements MigrationInterface {
  name = 'CreateTables1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "urls" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "shortCode" character varying(20) NOT NULL,
        "originalUrl" text NOT NULL,
        "userId" uuid NOT NULL,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_5c4b9c8c6c7b8b8b8b8b8b8b8b" UNIQUE ("shortCode"),
        CONSTRAINT "PK_6c1e3e5c3b3b3b3b3b3b3b3b3b" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "clicks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "urlId" uuid NOT NULL,
        "ip" character varying NOT NULL,
        "country" character varying,
        "city" character varying,
        "browser" character varying,
        "os" character varying,
        "referrer" character varying,
        "clickedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_clicks_urlId" ON "clicks" ("urlId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_clicks_clickedAt" ON "clicks" ("clickedAt")
    `);
    await queryRunner.query(`
      ALTER TABLE "urls" ADD CONSTRAINT "FK_urls_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "clicks" ADD CONSTRAINT "FK_clicks_urlId" FOREIGN KEY ("urlId") REFERENCES "urls"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "clicks" DROP CONSTRAINT "FK_clicks_urlId"`);
    await queryRunner.query(`ALTER TABLE "urls" DROP CONSTRAINT "FK_urls_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_clicks_clickedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_clicks_urlId"`);
    await queryRunner.query(`DROP TABLE "clicks"`);
    await queryRunner.query(`DROP TABLE "urls"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}