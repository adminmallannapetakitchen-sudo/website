-- AlterTable
ALTER TABLE "users" ADD COLUMN     "staff_role_id" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivery_user_id" TEXT;

-- AlterTable
ALTER TABLE "kitchen_settings" ADD COLUMN     "cod_enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "staff_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_roles_name_key" ON "staff_roles"("name");

-- CreateIndex
CREATE INDEX "users_staff_role_id_idx" ON "users"("staff_role_id");

-- CreateIndex
CREATE INDEX "orders_delivery_user_id_status_idx" ON "orders"("delivery_user_id", "status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_staff_role_id_fkey" FOREIGN KEY ("staff_role_id") REFERENCES "staff_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_user_id_fkey" FOREIGN KEY ("delivery_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

