import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trade_positions" ADD COLUMN "commission" numeric;
  ALTER TABLE "trade_positions" ADD COLUMN "gross_pnl" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "trade_positions" DROP COLUMN "commission";
  ALTER TABLE "trade_positions" DROP COLUMN "gross_pnl";`)
}
