-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Monster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "system" TEXT NOT NULL DEFAULT 'D&D 5e',
    "type" TEXT NOT NULL,
    "cr" REAL NOT NULL,
    "size" TEXT NOT NULL,
    "alignment" TEXT NOT NULL,
    "imageUrl" TEXT,
    "data" TEXT NOT NULL
);
INSERT INTO "new_Monster" ("alignment", "cr", "createdAt", "data", "id", "imageUrl", "name", "size", "type", "updatedAt") SELECT "alignment", "cr", "createdAt", "data", "id", "imageUrl", "name", "size", "type", "updatedAt" FROM "Monster";
DROP TABLE "Monster";
ALTER TABLE "new_Monster" RENAME TO "Monster";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
