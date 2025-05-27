-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "coupleProfileAId" TEXT NOT NULL,
    "coupleProfileBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_coupleProfileAId_idx" ON "Match"("coupleProfileAId");

-- CreateIndex
CREATE INDEX "Match_coupleProfileBId_idx" ON "Match"("coupleProfileBId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_coupleProfileAId_coupleProfileBId_key" ON "Match"("coupleProfileAId", "coupleProfileBId");

