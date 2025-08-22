-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentStatus" ADD VALUE 'TRANSFER_PAYMENT';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PAID';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'TRANSFERRED';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."StickerStatus" ADD VALUE 'REJECTED';
ALTER TYPE "public"."StickerStatus" ADD VALUE 'CANCELLED';
