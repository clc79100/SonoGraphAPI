import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheckConstraints1779595477517 implements MigrationInterface {
  name = 'AddCheckConstraints1779595477517';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "genre_parents" DROP CONSTRAINT "FK_20c631e5437d774c1d9410ba90e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_parents" DROP CONSTRAINT "FK_69543288d04e062ea3296aca672"`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_29ffb606dbb3de578ca231ad6e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5d337ad683c9be6c00e9726e6b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_20c631e5437d774c1d9410ba90"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_69543288d04e062ea3296aca67"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_20c631e5437d774c1d9410ba90" ON "genre_parents" ("genre_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_69543288d04e062ea3296aca67" ON "genre_parents" ("parent_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29ffb606dbb3de578ca231ad6e" ON "genre_relations" ("genre_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d337ad683c9be6c00e9726e6b" ON "genre_relations" ("related_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_source_tags" ADD CONSTRAINT "CHK_d3cce74b3d1b437804e6f60aad" CHECK (source IN ('musicbrainz', 'spotify', 'lastfm'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" ADD CONSTRAINT "CHK_9ae74d5f8a30993d67742b1d21" CHECK ("genre_id" <> "related_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_parents" ADD CONSTRAINT "CHK_6fe6a144b55914bfad33f470b2" CHECK ("genre_id" <> "parent_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_artists" ADD CONSTRAINT "CHK_740d31956d8dc486e1129dcde5" CHECK (source IN ('musicbrainz', 'spotify', 'lastfm'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_tracks" ADD CONSTRAINT "CHK_4268e6d00bbe61febe4758cdb9" CHECK (source IN ('musicbrainz', 'spotify', 'lastfm'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_albums" ADD CONSTRAINT "CHK_35717b3b1bd1eac2fa85209780" CHECK (source IN ('musicbrainz', 'spotify', 'lastfm'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be" FOREIGN KEY ("related_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_parents" ADD CONSTRAINT "FK_20c631e5437d774c1d9410ba90e" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_parents" ADD CONSTRAINT "FK_69543288d04e062ea3296aca672" FOREIGN KEY ("parent_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "genre_parents" DROP CONSTRAINT "FK_69543288d04e062ea3296aca672"`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_parents" DROP CONSTRAINT "FK_20c631e5437d774c1d9410ba90e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_albums" DROP CONSTRAINT "CHK_35717b3b1bd1eac2fa85209780"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_tracks" DROP CONSTRAINT "CHK_4268e6d00bbe61febe4758cdb9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_artists" DROP CONSTRAINT "CHK_740d31956d8dc486e1129dcde5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_parents" DROP CONSTRAINT "CHK_6fe6a144b55914bfad33f470b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" DROP CONSTRAINT "CHK_9ae74d5f8a30993d67742b1d21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_source_tags" DROP CONSTRAINT "CHK_d3cce74b3d1b437804e6f60aad"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_5d337ad683c9be6c00e9726e6b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_29ffb606dbb3de578ca231ad6e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_69543288d04e062ea3296aca67"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_20c631e5437d774c1d9410ba90"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_69543288d04e062ea3296aca67" ON "genre_parents" ("parent_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20c631e5437d774c1d9410ba90" ON "genre_parents" ("genre_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d337ad683c9be6c00e9726e6b" ON "genre_relations" ("related_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29ffb606dbb3de578ca231ad6e" ON "genre_relations" ("genre_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be" FOREIGN KEY ("related_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_parents" ADD CONSTRAINT "FK_69543288d04e062ea3296aca672" FOREIGN KEY ("parent_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "genre_parents" ADD CONSTRAINT "FK_20c631e5437d774c1d9410ba90e" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
