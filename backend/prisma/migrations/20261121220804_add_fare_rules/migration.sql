-- CreateEnum
CREATE TYPE "TransportType" AS ENUM ('METRO', 'BUS');

-- CreateTable
CREATE TABLE "FareRule" (
    "id" TEXT NOT NULL,
    "transportType" "TransportType" NOT NULL,
    "minStops" INTEGER NOT NULL,
    "maxStops" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FareRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FareRule_transportType_isActive_idx" ON "FareRule"("transportType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FareRule_transportType_minStops_maxStops_key" ON "FareRule"("transportType", "minStops", "maxStops");
