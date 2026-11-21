-- AlterTable
ALTER TABLE "MetroLineStation" ADD COLUMN     "branch" TEXT;

-- CreateIndex
CREATE INDEX "MetroLineStation_lineId_branch_idx" ON "MetroLineStation"("lineId", "branch");
