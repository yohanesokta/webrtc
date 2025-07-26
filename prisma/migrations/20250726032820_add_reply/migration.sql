-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "message_media" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reply_id" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "message_text" SET DEFAULT '';
