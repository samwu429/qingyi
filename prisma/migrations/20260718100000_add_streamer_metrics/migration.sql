-- CreateTable
CREATE TABLE "streamer_metrics" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "income" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streamer_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "streamer_metrics_streamerId_recordedAt_idx" ON "streamer_metrics"("streamerId", "recordedAt");

-- AddForeignKey
ALTER TABLE "streamer_metrics" ADD CONSTRAINT "streamer_metrics_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "streamers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
