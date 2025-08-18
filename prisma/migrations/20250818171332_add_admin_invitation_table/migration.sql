-- CreateTable
CREATE TABLE "public"."AdminInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminInvitation_token_key" ON "public"."AdminInvitation"("token");

-- CreateIndex
CREATE INDEX "AdminInvitation_email_expiresAt_idx" ON "public"."AdminInvitation"("email", "expiresAt");
