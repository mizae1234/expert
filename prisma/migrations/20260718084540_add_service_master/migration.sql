-- CreateTable
CREATE TABLE "ServiceMaster" (
    "id" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceMaster_serviceCode_key" ON "ServiceMaster"("serviceCode");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceMaster_name_key" ON "ServiceMaster"("name");
