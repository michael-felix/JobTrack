-- CreateEnum
CREATE TYPE "SortOrder" AS ENUM ('DATE_CAPTURED_DESC', 'DATE_CAPTURED_ASC', 'UPDATED_AT_DESC', 'COMPANY_ASC');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "labelId" TEXT,
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sortOrder" "SortOrder" NOT NULL DEFAULT 'DATE_CAPTURED_DESC';

-- CreateTable
CREATE TABLE "ApplicationLabel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationLabel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationLabel_userId_idx" ON "ApplicationLabel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationLabel_userId_name_key" ON "ApplicationLabel"("userId", "name");

-- CreateIndex
CREATE INDEX "Application_labelId_idx" ON "Application"("labelId");

-- AddForeignKey
ALTER TABLE "ApplicationLabel" ADD CONSTRAINT "ApplicationLabel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "ApplicationLabel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
