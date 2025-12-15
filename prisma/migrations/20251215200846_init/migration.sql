-- CreateTable
CREATE TABLE "Monster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cr" REAL NOT NULL,
    "size" TEXT NOT NULL,
    "alignment" TEXT NOT NULL,
    "imageUrl" TEXT,
    "data" TEXT NOT NULL
);
