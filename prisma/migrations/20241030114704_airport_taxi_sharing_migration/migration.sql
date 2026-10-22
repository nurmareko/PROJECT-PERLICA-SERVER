-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phoneNumber` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `photo` VARCHAR(255) NULL,
    `token` VARCHAR(255) NULL,
    `tokenExpiry` DATETIME(3) NULL,
    `otp` VARCHAR(4) NULL,
    `otpExpiry` DATETIME(3) NULL,
    `verifiedEmail` BOOLEAN NULL,
    `status` BOOLEAN NULL,
    `lat` DOUBLE NULL,
    `long` DOUBLE NULL,
    `deviceToken` VARCHAR(191) NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `customers_email_key`(`email`),
    UNIQUE INDEX `customers_phoneNumber_key`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `noMembership` VARCHAR(20) NOT NULL,
    `licensePlate` VARCHAR(10) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phoneNumber` VARCHAR(50) NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `photo` VARCHAR(255) NULL,
    `token` VARCHAR(255) NULL,
    `tokenExpiry` DATETIME(3) NULL,
    `otp` VARCHAR(4) NULL,
    `otpExpiry` DATETIME(3) NULL,
    `verifiedEmail` BOOLEAN NULL,
    `status` BOOLEAN NULL,
    `lat` DOUBLE NULL,
    `long` DOUBLE NULL,
    `deviceToken` VARCHAR(191) NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `drivers_noMembership_key`(`noMembership`),
    UNIQUE INDEX `drivers_licensePlate_key`(`licensePlate`),
    UNIQUE INDEX `drivers_email_key`(`email`),
    UNIQUE INDEX `drivers_phoneNumber_key`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rides` (
    `id` VARCHAR(191) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `long` DOUBLE NOT NULL,
    `pickupRadius` INTEGER NOT NULL,
    `rideStatus` INTEGER NOT NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `driverId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `long` DOUBLE NOT NULL,
    `status` INTEGER NOT NULL,
    `customerToAirportDistance` INTEGER NOT NULL,
    `farePerKm` VARCHAR(191) NOT NULL,
    `cost` VARCHAR(191) NOT NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rideId` VARCHAR(191) NOT NULL,
    `customerId` INTEGER NOT NULL,
    `driverId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerRating` DOUBLE NULL,
    `driverRating` DOUBLE NULL,
    `customerReview` VARCHAR(191) NULL,
    `driverReview` VARCHAR(191) NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `orderId` VARCHAR(191) NOT NULL,
    `customerId` INTEGER NOT NULL,
    `driverId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NULL,
    `senderType` VARCHAR(191) NOT NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `orderId` VARCHAR(191) NOT NULL,
    `customerId` INTEGER NOT NULL,
    `driverId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(255) NULL,
    `senderType` VARCHAR(191) NOT NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `orderId` VARCHAR(191) NOT NULL,
    `customerId` INTEGER NOT NULL,
    `driverId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` VARCHAR(255) NULL,
    `recipientType` VARCHAR(191) NOT NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerId` INTEGER NOT NULL,
    `driverId` INTEGER NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `airport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `status` INTEGER NOT NULL,
    `lat` DOUBLE NOT NULL,
    `long` DOUBLE NOT NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NULL,
    `token` VARCHAR(255) NULL,
    `tokenExpiry` DATETIME(3) NULL,
    `createDatetime` DATETIME(3) NOT NULL,
    `updateDatetime` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fare` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farePerKm` INTEGER NOT NULL,
    `createDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateDatetime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adminId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rides` ADD CONSTRAINT `rides_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_rideId_fkey` FOREIGN KEY (`rideId`) REFERENCES `rides`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fare` ADD CONSTRAINT `fare_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
