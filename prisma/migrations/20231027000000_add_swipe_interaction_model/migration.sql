-- CreateTable
CREATE TABLE "SwipeInteraction" (
    "id" TEXT NOT NULL,
    "swiperUserId" TEXT NOT NULL,
    "targetCoupleProfileId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwipeInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SwipeInteraction_swiperUserId_targetCoupleProfileId_idx" ON "SwipeInteraction"("swiperUserId", "targetCoupleProfileId");

