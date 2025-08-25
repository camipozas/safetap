-- AlterTable
ALTER TABLE "Payment" RENAME COLUMN "amountCents" TO "amount";

-- Update the values from cents to regular amount (divide by 100)
UPDATE "Payment" SET "amount" = CASE 
  WHEN "amount" > 100 THEN "amount" / 100
  ELSE "amount"
END;
