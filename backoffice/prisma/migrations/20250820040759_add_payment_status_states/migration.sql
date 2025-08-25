-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PAID';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'TRANSFERRED';

-- CANCELLED might already exist from previous migration, adding conditionally
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CANCELLED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')) THEN
        ALTER TYPE "public"."PaymentStatus" ADD VALUE 'CANCELLED';
    END IF;
END $$;
