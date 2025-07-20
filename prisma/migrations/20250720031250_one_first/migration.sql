-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL,
    "device_id" TEXT NOT NULL,
    "message_text" TEXT NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);
