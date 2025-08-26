-- Fix NULL, empty, or 'null' user names with proper data
-- This migration corrects data inconsistencies in the User table

-- Fix admin user with 'null' name
UPDATE "User" 
SET name = 'Admin SafeTap', "updatedAt" = CURRENT_TIMESTAMP
WHERE id = 'cmek1dqnz000015ftqpwfqldm' AND name = 'null';

-- Fix any other users with NULL names (derive from email)
UPDATE "User" 
SET name = INITCAP(SPLIT_PART(email, '@', 1)),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE name IS NULL OR name = '' OR name = 'null';

-- Ensure stickers have matching names with their owners
UPDATE "Sticker" 
SET "nameOnSticker" = u.name, "updatedAt" = CURRENT_TIMESTAMP
FROM "User" u 
WHERE "Sticker"."ownerId" = u.id 
  AND ("Sticker"."nameOnSticker" IS NULL 
       OR "Sticker"."nameOnSticker" != u.name 
       OR "Sticker"."nameOnSticker" = 'null');
