-- Migration: Fix user data consistency
-- This migration fixes inconsistent user data and ensures proper synchronization

-- 1. Fix users with null or 'null' names - convert email prefix to proper name
UPDATE "User" 
SET 
  "name" = CASE 
    WHEN email = 'admin@safetap.cl' THEN 'Admin SafeTap'
    WHEN email = 'camila@safetap.cl' THEN 'Camila Pozas'
    WHEN email = 'demo@safetap.cl' THEN 'Demo User'
    ELSE INITCAP(SPLIT_PART(email, '@', 1))
  END,
  "updatedAt" = NOW()
WHERE "name" IS NULL OR "name" = 'null' OR TRIM("name") = '';

-- 2. Update user countries based on business logic
UPDATE "User" 
SET 
  "country" = CASE 
    WHEN email LIKE '%@safetap.cl' THEN 'CL'
    WHEN email = 'camila@safetap.cl' THEN 'CL'
    ELSE COALESCE("country", 'CL')
  END,
  "updatedAt" = NOW()
WHERE "country" IS NULL;

-- 3. Ensure sticker names match user names
UPDATE "Sticker" 
SET 
  "nameOnSticker" = u."name",
  "updatedAt" = NOW()
FROM "User" u 
WHERE "Sticker"."ownerId" = u.id 
  AND ("Sticker"."nameOnSticker" IS NULL 
       OR "Sticker"."nameOnSticker" != u."name"
       OR "Sticker"."nameOnSticker" = 'null');

-- 4. Ensure sticker flag codes match user countries
UPDATE "Sticker" 
SET 
  "flagCode" = u."country",
  "updatedAt" = NOW()
FROM "User" u 
WHERE "Sticker"."ownerId" = u.id 
  AND u."country" IS NOT NULL
  AND ("Sticker"."flagCode" IS NULL 
       OR "Sticker"."flagCode" != u."country");

-- 5. Update admin user role if needed
UPDATE "User" 
SET 
  "role" = 'ADMIN',
  "updatedAt" = NOW()
WHERE email = 'admin@safetap.cl' AND "role" != 'ADMIN';

-- 6. Ensure all users have valid updated timestamps
UPDATE "User" 
SET "updatedAt" = NOW()
WHERE "updatedAt" IS NULL;

-- 7. Ensure all stickers have valid updated timestamps
UPDATE "Sticker" 
SET "updatedAt" = NOW()
WHERE "updatedAt" IS NULL;
