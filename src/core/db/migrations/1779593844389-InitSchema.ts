import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1779593844389 implements MigrationInterface {
    name = 'InitSchema1779593844389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "genre_source_tags" ("genre_id" text NOT NULL, "source" text NOT NULL, "tag" text NOT NULL, CONSTRAINT "PK_916ecc8fde7635309d862eba869" PRIMARY KEY ("genre_id", "source"))`);
        await queryRunner.query(`CREATE TABLE "genres" ("id" text NOT NULL, "name" text NOT NULL, "family_id" text NOT NULL, "parent_id" text, "era" text, "region" text, "description" text, CONSTRAINT "PK_80ecd718f0f00dde5d77a9be842" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_077f363eb620930e5755205124" ON "genres" ("family_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a4a923dd7a9f121038715eed30" ON "genres" ("parent_id") `);
        await queryRunner.query(`CREATE TABLE "families" ("id" text NOT NULL, "name" text NOT NULL, CONSTRAINT "PK_70414ac0c8f45664cf71324b9bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "genre_relations" ("genre_id" text NOT NULL, "related_id" text NOT NULL, CONSTRAINT "PK_3b608ee38c7d8b6b6511af303e8" PRIMARY KEY ("genre_id", "related_id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "password_hash" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "favorite_genres" ("user_id" uuid NOT NULL, "genre_id" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2dd44ba5be3cf0dad81621eabd2" PRIMARY KEY ("user_id", "genre_id"))`);
        await queryRunner.query(`CREATE TABLE "favorite_artists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "external_id" text NOT NULL, "name" text NOT NULL, "image_url" text, "source" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_10c3e59c0cbac8a79f69c80fbab" UNIQUE ("user_id", "external_id", "source"), CONSTRAINT "PK_a2808c56d3dc5d8882f9495e63d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eccf58c2d704231e05d13e556b" ON "favorite_artists" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "favorite_tracks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "external_id" text NOT NULL, "title" text NOT NULL, "artist_name" text, "source" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_05067df0391d0855aeaf0a08523" UNIQUE ("user_id", "external_id", "source"), CONSTRAINT "PK_8d34ad5c55c7d5448fad8c4ced7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3af7a3ee5333d4db9a85133b87" ON "favorite_tracks" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "favorite_albums" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "external_id" text NOT NULL, "title" text NOT NULL, "artist_name" text, "image_url" text, "source" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_75dae71434b2814ccc5038eb49e" UNIQUE ("user_id", "external_id", "source"), CONSTRAINT "PK_8435921763b8a56c98b3700773d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bb5020b4859da36592ac151f22" ON "favorite_albums" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "genre_visits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "genre_id" text NOT NULL, "visited_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a28225b7607c1afa0848f3986af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9e586573c39ec9635976753813" ON "genre_visits" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_29ffb606dbb3de578ca231ad6e" ON "genre_relations" ("genre_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5d337ad683c9be6c00e9726e6b" ON "genre_relations" ("related_id") `);
        await queryRunner.query(`ALTER TABLE "genre_source_tags" ADD CONSTRAINT "FK_29323dc409434af26b90d437137" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genres" ADD CONSTRAINT "FK_077f363eb620930e57552051244" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genres" ADD CONSTRAINT "FK_a4a923dd7a9f121038715eed306" FOREIGN KEY ("parent_id") REFERENCES "genres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "genre_relations" ADD CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be" FOREIGN KEY ("related_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_5d337ad683c9be6c00e9726e6be"`);
        await queryRunner.query(`ALTER TABLE "genre_relations" DROP CONSTRAINT "FK_29ffb606dbb3de578ca231ad6eb"`);
        await queryRunner.query(`ALTER TABLE "genres" DROP CONSTRAINT "FK_a4a923dd7a9f121038715eed306"`);
        await queryRunner.query(`ALTER TABLE "genres" DROP CONSTRAINT "FK_077f363eb620930e57552051244"`);
        await queryRunner.query(`ALTER TABLE "genre_source_tags" DROP CONSTRAINT "FK_29323dc409434af26b90d437137"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d337ad683c9be6c00e9726e6b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29ffb606dbb3de578ca231ad6e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e586573c39ec9635976753813"`);
        await queryRunner.query(`DROP TABLE "genre_visits"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb5020b4859da36592ac151f22"`);
        await queryRunner.query(`DROP TABLE "favorite_albums"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3af7a3ee5333d4db9a85133b87"`);
        await queryRunner.query(`DROP TABLE "favorite_tracks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eccf58c2d704231e05d13e556b"`);
        await queryRunner.query(`DROP TABLE "favorite_artists"`);
        await queryRunner.query(`DROP TABLE "favorite_genres"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "genre_relations"`);
        await queryRunner.query(`DROP TABLE "families"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a4a923dd7a9f121038715eed30"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_077f363eb620930e5755205124"`);
        await queryRunner.query(`DROP TABLE "genres"`);
        await queryRunner.query(`DROP TABLE "genre_source_tags"`);
    }

}
