/*
  Warnings:

  - The primary key for the `Debts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `client_id` on the `Debts` table. All the data in the column will be lost.
  - You are about to drop the column `due_date` on the `Debts` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Debts` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clients` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[costumer_id]` on the table `Debts` will be added. If there are existing duplicate values, this will fail.
  - The required column `costumer_id` was added to the `Debts` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `debt_id` was added to the `Debts` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `payed` to the `Debts` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `value` on the `Debts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `fee` on table `Debts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Debts_client_id_key";

-- AlterTable
ALTER TABLE "Debts" DROP CONSTRAINT "Debts_pkey",
DROP COLUMN "client_id",
DROP COLUMN "due_date",
DROP COLUMN "id",
ADD COLUMN     "costumer_id" TEXT NOT NULL,
ADD COLUMN     "debt_id" TEXT NOT NULL,
ADD COLUMN     "due_dates" TIMESTAMP(3)[],
ADD COLUMN     "payed" DOUBLE PRECISION NOT NULL,
DROP COLUMN "value",
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "fee" SET NOT NULL,
ADD CONSTRAINT "Debts_pkey" PRIMARY KEY ("debt_id");

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "clients";

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hash_password" TEXT NOT NULL,
    "acess_token" TEXT NOT NULL,
    "permission" INTEGER NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "costumers" (
    "client_id" TEXT NOT NULL,
    "debt_ids" TEXT[],
    "name" VARCHAR(13) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "costumers_pkey" PRIMARY KEY ("client_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_hash_password_key" ON "Users"("hash_password");

-- CreateIndex
CREATE UNIQUE INDEX "costumers_debt_ids_key" ON "costumers"("debt_ids");

-- CreateIndex
CREATE UNIQUE INDEX "costumers_name_key" ON "costumers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "costumers_phone_key" ON "costumers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "costumers_email_key" ON "costumers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Debts_costumer_id_key" ON "Debts"("costumer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Debts_value_key" ON "Debts"("value");
