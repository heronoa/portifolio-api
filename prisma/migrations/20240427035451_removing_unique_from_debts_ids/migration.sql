/*
  Warnings:

  - Added the required column `initial_date` to the `Debts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initial_value` to the `Debts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_method` to the `Debts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adress` to the `costumers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cep` to the `costumers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `costumers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "costumers_debt_ids_key";

-- AlterTable
ALTER TABLE "Debts" ADD COLUMN     "initial_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "initial_value" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "payment_method" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "costumers" ADD COLUMN     "adress" TEXT NOT NULL,
ADD COLUMN     "cep" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL;
