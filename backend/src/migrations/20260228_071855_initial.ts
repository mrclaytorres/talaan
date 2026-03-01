import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_trade_positions_direction" AS ENUM('long', 'short');
  CREATE TYPE "public"."enum_trade_positions_status" AS ENUM('open', 'closed');
  CREATE TYPE "public"."enum_tickers_asset_class" AS ENUM('stock', 'forex', 'crypto');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar NOT NULL,
  	"password_hash" varchar,
  	"timezone" varchar DEFAULT 'UTC' NOT NULL,
  	"security_q" varchar,
  	"security_a" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "trade_positions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"account_id" integer NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"ticker_symbol" varchar NOT NULL,
  	"direction" "enum_trade_positions_direction" NOT NULL,
  	"entry_price" numeric NOT NULL,
  	"stop_loss" numeric NOT NULL,
  	"take_profit" numeric NOT NULL,
  	"position_size" numeric,
  	"exit_price" numeric,
  	"status" "enum_trade_positions_status" DEFAULT 'open' NOT NULL,
  	"rr_ratio" numeric,
  	"pnl_amount" numeric,
  	"pnl_percent" numeric,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "trade_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"trade_id" integer NOT NULL,
  	"sort_order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_medium_url" varchar,
  	"sizes_medium_width" numeric,
  	"sizes_medium_height" numeric,
  	"sizes_medium_mime_type" varchar,
  	"sizes_medium_filesize" numeric,
  	"sizes_medium_filename" varchar
  );
  
  CREATE TABLE "trading_accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"currency" varchar DEFAULT 'USD' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tickers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"symbol" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"asset_class" "enum_tickers_asset_class" NOT NULL,
  	"exchange" varchar,
  	"base_currency" varchar,
  	"quote_currency" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"trade_positions_id" integer,
  	"trade_images_id" integer,
  	"trading_accounts_id" integer,
  	"tickers_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trade_positions" ADD CONSTRAINT "trade_positions_account_id_trading_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."trading_accounts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trade_images" ADD CONSTRAINT "trade_images_trade_id_trade_positions_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trade_positions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trade_positions_fk" FOREIGN KEY ("trade_positions_id") REFERENCES "public"."trade_positions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trade_images_fk" FOREIGN KEY ("trade_images_id") REFERENCES "public"."trade_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trading_accounts_fk" FOREIGN KEY ("trading_accounts_id") REFERENCES "public"."trading_accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tickers_fk" FOREIGN KEY ("tickers_id") REFERENCES "public"."tickers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "trade_positions_account_idx" ON "trade_positions" USING btree ("account_id");
  CREATE INDEX "trade_positions_updated_at_idx" ON "trade_positions" USING btree ("updated_at");
  CREATE INDEX "trade_positions_created_at_idx" ON "trade_positions" USING btree ("created_at");
  CREATE INDEX "trade_images_trade_idx" ON "trade_images" USING btree ("trade_id");
  CREATE INDEX "trade_images_updated_at_idx" ON "trade_images" USING btree ("updated_at");
  CREATE INDEX "trade_images_created_at_idx" ON "trade_images" USING btree ("created_at");
  CREATE UNIQUE INDEX "trade_images_filename_idx" ON "trade_images" USING btree ("filename");
  CREATE INDEX "trade_images_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "trade_images" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "trade_images_sizes_medium_sizes_medium_filename_idx" ON "trade_images" USING btree ("sizes_medium_filename");
  CREATE INDEX "trading_accounts_user_idx" ON "trading_accounts" USING btree ("user_id");
  CREATE INDEX "trading_accounts_updated_at_idx" ON "trading_accounts" USING btree ("updated_at");
  CREATE INDEX "trading_accounts_created_at_idx" ON "trading_accounts" USING btree ("created_at");
  CREATE UNIQUE INDEX "tickers_symbol_idx" ON "tickers" USING btree ("symbol");
  CREATE INDEX "tickers_updated_at_idx" ON "tickers" USING btree ("updated_at");
  CREATE INDEX "tickers_created_at_idx" ON "tickers" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_trade_positions_id_idx" ON "payload_locked_documents_rels" USING btree ("trade_positions_id");
  CREATE INDEX "payload_locked_documents_rels_trade_images_id_idx" ON "payload_locked_documents_rels" USING btree ("trade_images_id");
  CREATE INDEX "payload_locked_documents_rels_trading_accounts_id_idx" ON "payload_locked_documents_rels" USING btree ("trading_accounts_id");
  CREATE INDEX "payload_locked_documents_rels_tickers_id_idx" ON "payload_locked_documents_rels" USING btree ("tickers_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "trade_positions" CASCADE;
  DROP TABLE "trade_images" CASCADE;
  DROP TABLE "trading_accounts" CASCADE;
  DROP TABLE "tickers" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_trade_positions_direction";
  DROP TYPE "public"."enum_trade_positions_status";
  DROP TYPE "public"."enum_tickers_asset_class";`)
}
