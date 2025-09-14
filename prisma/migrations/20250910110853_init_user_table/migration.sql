/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Payment` table. All the data in the column will be lost.
  - Made the column `userId` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Payment_razorpayOrderId_key";

-- AlterTable
ALTER TABLE "public"."Payment" DROP COLUMN "updatedAt",
ALTER COLUMN "userId" SET NOT NULL;
