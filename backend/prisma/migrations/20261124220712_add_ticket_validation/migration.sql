-- CreateEnum
CREATE TYPE "ValidationResult" AS ENUM ('VALID', 'ALREADY_USED', 'EXPIRED', 'INVALID');

-- CreateTable
CREATE TABLE "TicketValidation" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT,
    "employeeId" TEXT NOT NULL,
    "scannedCode" TEXT NOT NULL,
    "result" "ValidationResult" NOT NULL,
    "stationName" TEXT,
    "notes" TEXT,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketValidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketValidation_employeeId_validatedAt_idx" ON "TicketValidation"("employeeId", "validatedAt");

-- CreateIndex
CREATE INDEX "TicketValidation_ticketId_validatedAt_idx" ON "TicketValidation"("ticketId", "validatedAt");

-- AddForeignKey
ALTER TABLE "TicketValidation" ADD CONSTRAINT "TicketValidation_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketValidation" ADD CONSTRAINT "TicketValidation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
