/*
  Warnings:

  - You are about to drop the column `labelId` on the `Application` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_labelId_fkey";

-- DropIndex
DROP INDEX "Application_labelId_idx";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "labelId";

-- CreateTable
CREATE TABLE "_ApplicationToApplicationLabel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ApplicationToApplicationLabel_AB_unique" ON "_ApplicationToApplicationLabel"("A", "B");

-- CreateIndex
CREATE INDEX "_ApplicationToApplicationLabel_B_index" ON "_ApplicationToApplicationLabel"("B");

-- AddForeignKey
ALTER TABLE "_ApplicationToApplicationLabel" ADD CONSTRAINT "_ApplicationToApplicationLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicationToApplicationLabel" ADD CONSTRAINT "_ApplicationToApplicationLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "ApplicationLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
