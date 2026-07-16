/*
  Warnings:

  - You are about to drop the column `serviceOrderId` on the `ServiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `carBrand` on the `ServiceOrder` table. All the data in the column will be lost.
  - You are about to drop the column `carModel` on the `ServiceOrder` table. All the data in the column will be lost.
  - You are about to drop the column `carPlate` on the `ServiceOrder` table. All the data in the column will be lost.
  - You are about to drop the column `carProvince` on the `ServiceOrder` table. All the data in the column will be lost.
  - You are about to drop the column `carVin` on the `ServiceOrder` table. All the data in the column will be lost.
  - Added the required column `serviceVehicleId` to the `ServiceItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ServiceItem" DROP CONSTRAINT "ServiceItem_serviceOrderId_fkey";

-- AlterTable
ALTER TABLE "ServiceItem" DROP COLUMN "serviceOrderId",
ADD COLUMN     "serviceVehicleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServiceOrder" DROP COLUMN "carBrand",
DROP COLUMN "carModel",
DROP COLUMN "carPlate",
DROP COLUMN "carProvince",
DROP COLUMN "carVin";

-- CreateTable
CREATE TABLE "ServiceVehicle" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "carPlate" TEXT NOT NULL,
    "carProvince" TEXT,
    "carBrand" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "carVin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceVehicle_serviceOrderId_idx" ON "ServiceVehicle"("serviceOrderId");

-- CreateIndex
CREATE INDEX "ServiceItem_serviceVehicleId_idx" ON "ServiceItem"("serviceVehicleId");

-- AddForeignKey
ALTER TABLE "ServiceVehicle" ADD CONSTRAINT "ServiceVehicle_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_serviceVehicleId_fkey" FOREIGN KEY ("serviceVehicleId") REFERENCES "ServiceVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
