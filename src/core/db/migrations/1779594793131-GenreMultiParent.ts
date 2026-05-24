import { MigrationInterface, QueryRunner } from "typeorm";

export class GenreMultiParent1779594793131 implements MigrationInterface {
    name = 'GenreMultiParent1779594793131'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "genres" DROP CONSTRAINT "FK_a4a923dd7a9f121038715eed306"`);
        await queryRunner.query(`ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb"`);
        await queryRunner.query(`ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a4a923dd7a9f121038715eed30"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29ffb606dbb3de578ca231ad6e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d337ad683c9be6c00e9726e6b"`);
        await queryRunner.query(`CREATE TABLE "genre_parents" ("genre_id" text NOT NULL, "parent_id" text NOT NULL, CONSTRAINT "PK_3595c8ed8e2ffe79081ca6e9048" PRIMARY KEY ("genre_id", "parent_id"))`);
        await queryRunner.query(`ALTER TABLE "genres" DROP COLUMN "parent_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_20c631e5437d774c1d9410ba90" ON "genre_parents" ("genre_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_69543288d04e062ea3296aca67" ON "genre_parents" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_29ffb606dbb3de578ca231ad6e" ON "genre_relations" ("genre_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5d337ad683c9be6c00e9726e6b" ON "genre_relations" ("related_id") `);
        await queryRunner.query(`ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be" FOREIGN KEY ("related_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genre_parents" ADD CONSTRAINT "FK_20c631e5437d774c1d9410ba90e" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genre_parents" ADD CONSTRAINT "FK_69543288d04e062ea3296aca672" FOREIGN KEY ("parent_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "genre_parents" DROP CONSTRAINT "FK_69543288d04e062ea3296aca672"`);
        await queryRunner.query(`ALTER TABLE "genre_parents" DROP CONSTRAINT "FK_20c631e5437d774c1d9410ba90e"`);
        await queryRunner.query(`ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be"`);
        await queryRunner.query(`ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d337ad683c9be6c00e9726e6b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29ffb606dbb3de578ca231ad6e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_69543288d04e062ea3296aca67"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_20c631e5437d774c1d9410ba90"`);
        await queryRunner.query(`ALTER TABLE "genres" ADD "parent_id" text`);
        await queryRunner.query(`DROP TABLE "genre_parents"`);
        await queryRunner.query(`CREATE INDEX "IDX_5d337ad683c9be6c00e9726e6b" ON "genre_relations" ("related_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_29ffb606dbb3de578ca231ad6e" ON "genre_relations" ("genre_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a4a923dd7a9f121038715eed30" ON "genres" ("parent_id") `);
        await queryRunner.query(`ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be" FOREIGN KEY ("related_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genres" ADD CONSTRAINT "FK_a4a923dd7a9f121038715eed306" FOREIGN KEY ("parent_id") REFERENCES "genres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
