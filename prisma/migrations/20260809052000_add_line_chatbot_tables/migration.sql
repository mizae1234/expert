-- CreateTable
CREATE TABLE "line_users" (
    "id" TEXT NOT NULL,
    "line_user_id" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(255),
    "picture_url" TEXT,
    "status_message" VARCHAR(255),
    "system" VARCHAR(50) NOT NULL DEFAULT 'EXPERT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" VARCHAR(20) NOT NULL DEFAULT 'USER',
    "user_id" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_groups" (
    "id" TEXT NOT NULL,
    "group_id" VARCHAR(50) NOT NULL,
    "group_name" VARCHAR(255),
    "group_type" VARCHAR(20) NOT NULL DEFAULT 'group',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_logs" (
    "id" TEXT NOT NULL,
    "source_type" VARCHAR(20) NOT NULL,
    "source_id" VARCHAR(50),
    "user_name" VARCHAR(255),
    "user_message" TEXT NOT NULL,
    "bot_reply" TEXT NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "model_name" VARCHAR(50),
    "response_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "line_users_line_user_id_key" ON "line_users"("line_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "line_groups_group_id_key" ON "line_groups"("group_id");

-- AddForeignKey
ALTER TABLE "line_users" ADD CONSTRAINT "line_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
