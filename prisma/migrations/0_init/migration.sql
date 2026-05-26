-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('RECEIVED', 'PARTS_CHECK', 'PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartPaymentStatus" AS ENUM ('PENDING', 'INVOICED', 'PR_SENT', 'PAID');

-- CreateEnum
CREATE TYPE "PartMasterSource" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "LaborPaymentStatus" AS ENUM ('PENDING', 'INVOICED', 'PR_SENT', 'PAID');

-- CreateEnum
CREATE TYPE "POType" AS ENUM ('PARTS', 'LABOR');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('DIRECT_TO_GARAGE', 'SELF_DELIVERY');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'SENT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ARStatus" AS ENUM ('PENDING', 'SENT', 'PARTIAL', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentRequestType" AS ENUM ('AP_VENDOR', 'AP_GARAGE', 'AR');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "APPayType" AS ENUM ('VENDOR', 'GARAGE');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('PARTS', 'GARAGE');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "claimNo" TEXT NOT NULL,
    "receiveNo" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "insuranceId" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "carPlate" TEXT NOT NULL,
    "carBrand" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "carVin" TEXT NOT NULL,
    "carColor" TEXT,
    "province" TEXT NOT NULL,
    "insuredName" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimPart" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "partNo" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "priceFullAmt" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "damageType" TEXT NOT NULL,
    "discountPct" DOUBLE PRECISION NOT NULL,
    "priceOffer" DOUBLE PRECISION NOT NULL,
    "priceApprove" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT NOT NULL,
    "requireReturn" BOOLEAN NOT NULL DEFAULT false,
    "round" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "paymentStatus" "PartPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "partMasterId" TEXT,

    CONSTRAINT "ClaimPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartMaster" (
    "id" TEXT NOT NULL,
    "partNo" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNameAlt" TEXT[],
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'ชิ้น',
    "standardPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" "PartMasterSource" NOT NULL DEFAULT 'AUTO',
    "createdFrom" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartVendorPrice" (
    "id" TEXT NOT NULL,
    "partNo" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PartVendorPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimLabor" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "damageLevel" TEXT NOT NULL,
    "discountPct" DOUBLE PRECISION NOT NULL,
    "priceOffer" DOUBLE PRECISION NOT NULL,
    "priceApprove" DOUBLE PRECISION NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "paymentStatus" "LaborPaymentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ClaimLabor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "poNo" TEXT NOT NULL,
    "poType" "POType" NOT NULL,
    "deliveryMode" "DeliveryMode" NOT NULL,
    "deliveryAddress" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POItem" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "partNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "POItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvoiceItem" (
    "id" TEXT NOT NULL,
    "supplierInvoiceId" TEXT NOT NULL,
    "poItemId" TEXT,
    "claimPartId" TEXT,
    "claimLaborId" TEXT,
    "partNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SupplierInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryOrder" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "DeliveryOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvoice" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "pdfUrl" TEXT,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceInvoice" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "laborTotal" DOUBLE PRECISION NOT NULL,
    "partsTotal" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "deductible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "status" "ARStatus" NOT NULL DEFAULT 'PENDING',
    "cancelledAt" TIMESTAMP(3),
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "requestType" "PaymentRequestType" NOT NULL,
    "claimId" TEXT NOT NULL,
    "supplierInvoiceId" TEXT,
    "garageInvoiceId" TEXT,
    "insuranceInvoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "whtAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL,
    "note" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillReceipt" (
    "id" TEXT NOT NULL,
    "paymentRequestId" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "physicalInvoiceNo" TEXT NOT NULL,
    "invoiceNoMatched" BOOLEAN NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "systemInvoiceNo" TEXT NOT NULL,
    "poNo" TEXT,
    "claimNo" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APPayment" (
    "id" TEXT NOT NULL,
    "supplierInvoiceId" TEXT,
    "poId" TEXT,
    "paymentRequestId" TEXT,
    "payType" "APPayType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "whtAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "ref" TEXT,

    CONSTRAINT "APPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ARPayment" (
    "id" TEXT NOT NULL,
    "insuranceInvoiceId" TEXT NOT NULL,
    "paymentRequestId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "ref" TEXT,

    CONSTRAINT "ARPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insurance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT,
    "taxId" TEXT,
    "branchCode" TEXT NOT NULL DEFAULT '00000',
    "isVatRegistered" BOOLEAN NOT NULL DEFAULT true,
    "contactPerson" TEXT,
    "peakCustomerId" TEXT,
    "contactType" TEXT NOT NULL DEFAULT 'ลูกค้า',
    "nationality" TEXT NOT NULL DEFAULT 'ไทย',
    "businessType" TEXT NOT NULL DEFAULT 'บริษัทจำกัด',
    "creditTermAr" TEXT NOT NULL DEFAULT 'ตามการตั้งค่าของกิจการ',
    "creditTermArDays" INTEGER NOT NULL DEFAULT 30,
    "creditTermAp" TEXT NOT NULL DEFAULT 'ตามการตั้งค่าของกิจการ',
    "creditTermApDays" INTEGER NOT NULL DEFAULT 30,
    "accountArCode" TEXT NOT NULL DEFAULT '113101',
    "accountApCode" TEXT NOT NULL DEFAULT '212101',
    "creditLimitType" TEXT NOT NULL DEFAULT 'ไม่กำหนดวงเงิน',
    "creditLimitAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendorType" "VendorType" NOT NULL,
    "taxId" TEXT,
    "phone" TEXT,
    "zone" TEXT,
    "province" TEXT,
    "address" TEXT,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchCode" TEXT NOT NULL DEFAULT '00000',
    "peakVendorCode" TEXT,
    "isVatRegistered" BOOLEAN NOT NULL DEFAULT true,
    "billingPct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "whtType" TEXT NOT NULL DEFAULT '53',
    "whtRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contactType" TEXT NOT NULL DEFAULT 'ผู้ขาย',
    "nationality" TEXT NOT NULL DEFAULT 'ไทย',
    "businessType" TEXT NOT NULL DEFAULT 'บริษัทจำกัด',
    "creditTermAr" TEXT NOT NULL DEFAULT 'ตามการตั้งค่าของกิจการ',
    "creditTermArDays" INTEGER NOT NULL DEFAULT 30,
    "creditTermAp" TEXT NOT NULL DEFAULT 'ตามการตั้งค่าของกิจการ',
    "creditTermApDays" INTEGER NOT NULL DEFAULT 30,
    "accountArCode" TEXT NOT NULL DEFAULT '113101',
    "accountApCode" TEXT NOT NULL DEFAULT '212101',
    "creditLimitType" TEXT NOT NULL DEFAULT 'ไม่กำหนดวงเงิน',
    "creditLimitAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GarageInvoice" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "pdfUrl" TEXT,
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GarageInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GarageInvoiceItem" (
    "id" TEXT NOT NULL,
    "garageInvoiceId" TEXT NOT NULL,
    "claimLaborId" TEXT,
    "description" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GarageInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimStatusLog" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionLog" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "aiValue" TEXT NOT NULL,
    "userValue" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "partNo" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "claimId" TEXT,
    "vendorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBalance" (
    "id" TEXT NOT NULL,
    "partNo" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "taxId" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL DEFAULT '00000',
    "branchName" TEXT NOT NULL DEFAULT 'สำนักงานใหญ่',
    "address" TEXT NOT NULL,
    "subDistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "authorizedName" TEXT,
    "authorizedTitle" TEXT,
    "signatureUrl" TEXT,
    "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankAccountName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastNo" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "quotationNo" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "quotationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "laborTotal" DOUBLE PRECISION NOT NULL,
    "partsTotal" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationLabor" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "damageLevel" TEXT,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuotationLabor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationPart" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "partNo" TEXT,
    "partName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "partMasterId" TEXT,

    CONSTRAINT "QuotationPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimExpense" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "note" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimDocument" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'other',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL DEFAULT 'Admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimNo_key" ON "Claim"("claimNo");

-- CreateIndex
CREATE UNIQUE INDEX "PartMaster_partNo_key" ON "PartMaster"("partNo");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNo_key" ON "PurchaseOrder"("poNo");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_poId_key" ON "GoodsReceipt"("poId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryOrder_goodsReceiptId_key" ON "DeliveryOrder"("goodsReceiptId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_invoiceNo_key" ON "SupplierInvoice"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceInvoice_claimId_key" ON "InsuranceInvoice"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceInvoice_invoiceNo_key" ON "InsuranceInvoice"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "BillReceipt_paymentRequestId_key" ON "BillReceipt"("paymentRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "APPayment_supplierInvoiceId_key" ON "APPayment"("supplierInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "APPayment_poId_key" ON "APPayment"("poId");

-- CreateIndex
CREATE UNIQUE INDEX "APPayment_paymentRequestId_key" ON "APPayment"("paymentRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ARPayment_insuranceInvoiceId_key" ON "ARPayment"("insuranceInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "ARPayment_paymentRequestId_key" ON "ARPayment"("paymentRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "GarageInvoice_invoiceNo_key" ON "GarageInvoice"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_partNo_key" ON "StockBalance"("partNo");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_docType_key" ON "DocumentSequence"("docType");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNo_key" ON "Quotation"("quotationNo");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "Insurance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimPart" ADD CONSTRAINT "ClaimPart_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimPart" ADD CONSTRAINT "ClaimPart_partMasterId_fkey" FOREIGN KEY ("partMasterId") REFERENCES "PartMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartVendorPrice" ADD CONSTRAINT "PartVendorPrice_partNo_fkey" FOREIGN KEY ("partNo") REFERENCES "PartMaster"("partNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartVendorPrice" ADD CONSTRAINT "PartVendorPrice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimLabor" ADD CONSTRAINT "ClaimLabor_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POItem" ADD CONSTRAINT "POItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_supplierInvoiceId_fkey" FOREIGN KEY ("supplierInvoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "POItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_claimPartId_fkey" FOREIGN KEY ("claimPartId") REFERENCES "ClaimPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoiceItem" ADD CONSTRAINT "SupplierInvoiceItem_claimLaborId_fkey" FOREIGN KEY ("claimLaborId") REFERENCES "ClaimLabor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceInvoice" ADD CONSTRAINT "InsuranceInvoice_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_supplierInvoiceId_fkey" FOREIGN KEY ("supplierInvoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_garageInvoiceId_fkey" FOREIGN KEY ("garageInvoiceId") REFERENCES "GarageInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_insuranceInvoiceId_fkey" FOREIGN KEY ("insuranceInvoiceId") REFERENCES "InsuranceInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillReceipt" ADD CONSTRAINT "BillReceipt_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APPayment" ADD CONSTRAINT "APPayment_supplierInvoiceId_fkey" FOREIGN KEY ("supplierInvoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APPayment" ADD CONSTRAINT "APPayment_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APPayment" ADD CONSTRAINT "APPayment_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ARPayment" ADD CONSTRAINT "ARPayment_insuranceInvoiceId_fkey" FOREIGN KEY ("insuranceInvoiceId") REFERENCES "InsuranceInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ARPayment" ADD CONSTRAINT "ARPayment_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarageInvoice" ADD CONSTRAINT "GarageInvoice_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarageInvoice" ADD CONSTRAINT "GarageInvoice_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarageInvoiceItem" ADD CONSTRAINT "GarageInvoiceItem_garageInvoiceId_fkey" FOREIGN KEY ("garageInvoiceId") REFERENCES "GarageInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarageInvoiceItem" ADD CONSTRAINT "GarageInvoiceItem_claimLaborId_fkey" FOREIGN KEY ("claimLaborId") REFERENCES "ClaimLabor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimStatusLog" ADD CONSTRAINT "ClaimStatusLog_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionLog" ADD CONSTRAINT "ExtractionLog_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationLabor" ADD CONSTRAINT "QuotationLabor_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationPart" ADD CONSTRAINT "QuotationPart_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimExpense" ADD CONSTRAINT "ClaimExpense_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDocument" ADD CONSTRAINT "ClaimDocument_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

