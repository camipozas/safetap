-- Migration to add missing PaymentStatus enum values
-- The database enum only has PENDING, VERIFIED, REJECTED
-- But our schema expects PAID, TRANSFERRED, CANCELLED too

-- Add the missing enum values to PaymentStatus
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'TRANSFERRED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'TRANSFER_PAYMENT';
