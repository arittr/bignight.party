-- AlterTable
ALTER TABLE "Person" ADD COLUMN "wikipediaSlug" TEXT;

-- AlterTable
ALTER TABLE "Work" ADD COLUMN "wikipediaSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Person_wikipediaSlug_key" ON "Person"("wikipediaSlug");

-- CreateIndex
CREATE INDEX "Person_wikipediaSlug_idx" ON "Person"("wikipediaSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Work_wikipediaSlug_key" ON "Work"("wikipediaSlug");

-- CreateIndex
CREATE INDEX "Work_wikipediaSlug_idx" ON "Work"("wikipediaSlug");
