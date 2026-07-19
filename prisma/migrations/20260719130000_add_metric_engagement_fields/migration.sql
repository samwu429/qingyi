-- AlterTable
ALTER TABLE "streamer_metrics" ADD COLUMN "liveMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "streamer_metrics" ADD COLUMN "viewers" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "streamer_metrics" ADD COLUMN "comments" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "streamer_metrics" ADD COLUMN "likes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "streamer_metrics" ADD COLUMN "yinlang" INTEGER NOT NULL DEFAULT 0;
