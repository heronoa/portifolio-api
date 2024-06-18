-- DropIndex
DROP INDEX "costumers_name_key";

-- AlterTable
ALTER TABLE "costumers" ALTER COLUMN "name" SET DATA TYPE VARCHAR(55);
