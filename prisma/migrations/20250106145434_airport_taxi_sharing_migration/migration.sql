/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `reviews_orderId_key` ON `reviews`(`orderId`);
