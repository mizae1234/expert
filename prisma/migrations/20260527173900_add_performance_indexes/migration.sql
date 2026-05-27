-- CreateIndex
CREATE INDEX "Claim_insuranceId_idx" ON "Claim"("insuranceId");

-- CreateIndex
CREATE INDEX "Claim_garageId_idx" ON "Claim"("garageId");

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Claim_createdAt_idx" ON "Claim"("createdAt");

-- CreateIndex
CREATE INDEX "ClaimExpense_claimId_idx" ON "ClaimExpense"("claimId");

-- CreateIndex
CREATE INDEX "ClaimExpense_category_idx" ON "ClaimExpense"("category");

-- CreateIndex
CREATE INDEX "ClaimLabor_claimId_idx" ON "ClaimLabor"("claimId");

-- CreateIndex
CREATE INDEX "ClaimPart_claimId_idx" ON "ClaimPart"("claimId");

-- CreateIndex
CREATE INDEX "ClaimPart_partMasterId_idx" ON "ClaimPart"("partMasterId");

-- CreateIndex
CREATE INDEX "GarageInvoice_claimId_idx" ON "GarageInvoice"("claimId");

-- CreateIndex
CREATE INDEX "GarageInvoice_garageId_idx" ON "GarageInvoice"("garageId");

-- CreateIndex
CREATE INDEX "InsuranceInvoice_status_idx" ON "InsuranceInvoice"("status");

-- CreateIndex
CREATE INDEX "InsuranceInvoice_invoiceDate_idx" ON "InsuranceInvoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "PaymentRequest_claimId_idx" ON "PaymentRequest"("claimId");

-- CreateIndex
CREATE INDEX "PaymentRequest_supplierInvoiceId_idx" ON "PaymentRequest"("supplierInvoiceId");

-- CreateIndex
CREATE INDEX "PaymentRequest_garageInvoiceId_idx" ON "PaymentRequest"("garageInvoiceId");

-- CreateIndex
CREATE INDEX "PaymentRequest_insuranceInvoiceId_idx" ON "PaymentRequest"("insuranceInvoiceId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_claimId_idx" ON "PurchaseOrder"("claimId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_claimId_idx" ON "SupplierInvoice"("claimId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_vendorId_idx" ON "SupplierInvoice"("vendorId");
