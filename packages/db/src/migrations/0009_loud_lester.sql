ALTER TABLE "project_token" RENAME COLUMN "hashed_token" TO "encrypted_token";--> statement-breakpoint
ALTER TABLE "project_token" DROP CONSTRAINT "project_token_hashed_token_unique";--> statement-breakpoint
DROP INDEX "project_token_hashedToken_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "project_token_encryptedToken_idx" ON "project_token" USING btree ("encrypted_token");--> statement-breakpoint
ALTER TABLE "project_token" ADD CONSTRAINT "project_token_encrypted_token_unique" UNIQUE("encrypted_token");