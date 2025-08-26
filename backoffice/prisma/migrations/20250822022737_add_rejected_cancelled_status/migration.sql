-- AlterEnum
-- This migration adds REJECTED and CANCELLED status values to PaymentStatus enum
-- Note: This migration was created to sync with production database state
-- This migration is idempotent and safe to run multiple times

-- Add REJECTED if it doesn't exist (though it should exist from initial setup)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'REJECTED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')) THEN
        ALTER TYPE "public"."PaymentStatus" ADD VALUE 'REJECTED';
    END IF;
END $$;

-- Add CANCELLED if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CANCELLED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')) THEN
        ALTER TYPE "public"."PaymentStatus" ADD VALUE 'CANCELLED';
    END IF;
END $$;
