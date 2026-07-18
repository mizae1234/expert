-- AlterTable
ALTER TABLE "ServiceVehicle" ADD COLUMN "status" "ServiceStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "ServiceVehicle" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "ServiceVehicle" ADD COLUMN "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
