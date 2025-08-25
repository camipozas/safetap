-- AlterTable
ALTER TABLE "Payment" RENAME COLUMN "amountCents" TO "amount";

-- Update the values from cents to regular amount (divide by 100)
UPDATE "Payment" SET "amount" = "amount" / 100;
