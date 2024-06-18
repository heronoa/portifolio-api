/*
  Warnings:

  - The primary key for the `costumers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `client_id` on the `costumers` table. All the data in the column will be lost.
  - The required column `costumer_id` was added to the `costumers` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "costumers" DROP CONSTRAINT "costumers_pkey",
DROP COLUMN "client_id",
ADD COLUMN     "costumer_id" TEXT NOT NULL,
ADD CONSTRAINT "costumers_pkey" PRIMARY KEY ("costumer_id");
