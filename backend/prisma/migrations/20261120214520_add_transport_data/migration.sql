-- CreateTable
CREATE TABLE "MetroLine" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "nameEn" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetroLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetroLineStation" (
    "lineId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MetroLineStation_pkey" PRIMARY KEY ("lineId","stationId")
);

-- CreateTable
CREATE TABLE "BusRoute" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusStop" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusRouteStop" (
    "routeId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "BusRouteStop_pkey" PRIMARY KEY ("routeId","stopId")
);

-- CreateIndex
CREATE UNIQUE INDEX "MetroLine_number_key" ON "MetroLine"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Station_nameEn_key" ON "Station"("nameEn");

-- CreateIndex
CREATE INDEX "MetroLineStation_lineId_idx" ON "MetroLineStation"("lineId");

-- CreateIndex
CREATE INDEX "MetroLineStation_stationId_idx" ON "MetroLineStation"("stationId");

-- CreateIndex
CREATE UNIQUE INDEX "MetroLineStation_lineId_order_key" ON "MetroLineStation"("lineId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "BusRoute_code_key" ON "BusRoute"("code");

-- CreateIndex
CREATE INDEX "BusRouteStop_routeId_idx" ON "BusRouteStop"("routeId");

-- CreateIndex
CREATE INDEX "BusRouteStop_stopId_idx" ON "BusRouteStop"("stopId");

-- CreateIndex
CREATE UNIQUE INDEX "BusRouteStop_routeId_order_key" ON "BusRouteStop"("routeId", "order");

-- AddForeignKey
ALTER TABLE "MetroLineStation" ADD CONSTRAINT "MetroLineStation_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "MetroLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetroLineStation" ADD CONSTRAINT "MetroLineStation_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusRouteStop" ADD CONSTRAINT "BusRouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "BusRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusRouteStop" ADD CONSTRAINT "BusRouteStop_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "BusStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
