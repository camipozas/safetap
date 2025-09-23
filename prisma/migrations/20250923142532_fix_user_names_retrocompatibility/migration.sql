-- Fix user names retrocompatibility
-- This migration updates user names that are equal to the email prefix
-- to more appropriate names for better display in backoffice and emergency profiles

-- Update users whose name is equal to their email prefix
-- This creates more readable names while maintaining user identification
-- First, try to use the name from their stickers if available
UPDATE "User" 
SET 
  name = CASE 
    -- If user has stickers with proper names, use the most recent one
    WHEN user_data.sticker_name IS NOT NULL AND user_data.sticker_name != user_data.email_prefix THEN
      user_data.sticker_name
    -- If email prefix contains dots, dashes, or underscores, create a proper name
    WHEN user_data.email_prefix LIKE '%.%' OR user_data.email_prefix LIKE '%-%' OR user_data.email_prefix LIKE '%_%' THEN
      CASE 
        WHEN user_data.email_prefix LIKE '%.%' THEN
          -- Split by dots and capitalize each part
          INITCAP(REPLACE(user_data.email_prefix, '.', ' '))
        WHEN user_data.email_prefix LIKE '%-%' THEN
          -- Split by dashes and capitalize each part  
          INITCAP(REPLACE(user_data.email_prefix, '-', ' '))
        WHEN user_data.email_prefix LIKE '%_%' THEN
          -- Split by underscores and capitalize each part
          INITCAP(REPLACE(user_data.email_prefix, '_', ' '))
        ELSE user_data.email_prefix
      END
    -- For admin emails, keep the prefix but make it readable
    WHEN user_data.email_prefix ILIKE '%admin%' OR user_data.email_prefix ILIKE '%system%' OR user_data.email_prefix ILIKE '%safetap%' THEN
      INITCAP(user_data.email_prefix)
    -- For demo/test emails, keep the prefix but make it readable
    WHEN user_data.email_prefix ILIKE '%demo%' OR user_data.email_prefix ILIKE '%test%' THEN
      INITCAP(user_data.email_prefix)
    -- Default case: capitalize the email prefix to make it more readable
    ELSE INITCAP(user_data.email_prefix)
  END,
  "updatedAt" = NOW()
FROM (
  SELECT 
    u.id,
    u.email,
    SPLIT_PART(u.email, '@', 1) as email_prefix,
    u.name,
    u."createdAt" as created_at,
    s."nameOnSticker" as sticker_name
  FROM "User" u
  LEFT JOIN "Sticker" s ON s."ownerId" = u.id AND s."nameOnSticker" IS NOT NULL AND s."nameOnSticker" != SPLIT_PART(u.email, '@', 1)
  WHERE u.name IS NOT NULL 
    AND u.name = SPLIT_PART(u.email, '@', 1)
) as user_data
WHERE "User".id = user_data.id;

-- Update nameOnSticker for all stickers owned by users whose names were updated
UPDATE "Sticker" 
SET 
  "nameOnSticker" = "User".name,
  "updatedAt" = NOW()
FROM "User"
WHERE "Sticker"."ownerId" = "User".id
  AND "User".name IS NOT NULL
  AND "User"."updatedAt" > NOW() - INTERVAL '1 minute'; -- Only recently updated users
