-- CreateTable
CREATE TABLE "join_inquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "join_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "join_inquiries_isRead_createdAt_idx" ON "join_inquiries"("isRead", "createdAt");
