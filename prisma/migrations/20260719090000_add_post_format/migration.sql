-- CreateEnum
CREATE TYPE "PostFormat" AS ENUM ('MARKDOWN', 'HTML');

-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN "format" "PostFormat" NOT NULL DEFAULT 'MARKDOWN';
