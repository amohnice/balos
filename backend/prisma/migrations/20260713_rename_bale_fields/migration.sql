-- Drop the BaleGrade enum
DROP TYPE "BaleGrade";

-- Rename referenceNo to baleNumber
ALTER TABLE "Bale" RENAME COLUMN "referenceNo" TO "baleNumber";

-- Drop the grade column
ALTER TABLE "Bale" DROP COLUMN "grade";

-- Rename notes to description
ALTER TABLE "Bale" RENAME COLUMN "notes" TO "description";
