-- DropIndex
DROP INDEX "public"."Game_accessCode_key";

-- CreateIndex
CREATE INDEX "Game_accessCode_idx" ON "Game"("accessCode");
