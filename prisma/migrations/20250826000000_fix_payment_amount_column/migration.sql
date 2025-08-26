-- Migration: Fix Payment table amount column
-- This migration ensures the Payment table has the correct column name

-- Step 1: Check if amountCents exists and rename it to amount
DO $$ 
BEGIN
    -- If amountCents exists, rename it to amount (drop amount first if it exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Payment' AND column_name = 'amountCents'
    ) THEN
        -- If amount already exists, drop it first (it might be a duplicate)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Payment' AND column_name = 'amount'
        ) THEN
            ALTER TABLE "Payment" DROP COLUMN "amount";
            RAISE NOTICE 'Dropped existing amount column';
        END IF;
        
        -- Now rename amountCents to amount
        ALTER TABLE "Payment" RENAME COLUMN "amountCents" TO "amount";
        RAISE NOTICE 'Renamed amountCents to amount';
    ELSE
        -- If amountCents doesn't exist, check if amount exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Payment' AND column_name = 'amount'
        ) THEN
            -- Create amount column if it doesn't exist
            ALTER TABLE "Payment" ADD COLUMN "amount" INTEGER NOT NULL DEFAULT 0;
            RAISE NOTICE 'Created amount column';
        ELSE
            RAISE NOTICE 'amount column already exists - no action needed';
        END IF;
    END IF;
END $$;
