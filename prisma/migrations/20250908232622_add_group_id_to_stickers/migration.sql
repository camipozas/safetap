-- AlterTable
ALTER TABLE "public"."Sticker" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Sticker_groupId_idx" ON "public"."Sticker"("groupId");
