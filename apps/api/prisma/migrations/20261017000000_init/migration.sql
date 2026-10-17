-- CreateTable
CREATE TABLE `shop_customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(80) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `email_verified_at` DATETIME(3) NULL,
    `picture_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_shop_customers_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_customer_identities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `provider` VARCHAR(20) NOT NULL,
    `provider_user_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_shop_identity_customer`(`customer_id`),
    UNIQUE INDEX `uq_shop_identity`(`provider`, `provider_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `user_agent` VARCHAR(255) NULL,

    UNIQUE INDEX `uq_shop_sessions_token`(`token_hash`),
    INDEX `idx_shop_sessions_customer`(`customer_id`),
    INDEX `idx_shop_sessions_expiry`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_customer_addresses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `type` VARCHAR(10) NOT NULL DEFAULT 'Home',
    `label` VARCHAR(30) NOT NULL DEFAULT '',
    `recipient_name` VARCHAR(80) NOT NULL,
    `phone` CHAR(10) NOT NULL,
    `alternate_phone` CHAR(10) NULL,
    `house` VARCHAR(120) NOT NULL,
    `street` VARCHAR(160) NOT NULL,
    `city` VARCHAR(60) NOT NULL,
    `state` VARCHAR(60) NOT NULL,
    `pincode` CHAR(6) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_shop_addresses_customer`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_password_resets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `code_hash` CHAR(64) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,

    INDEX `idx_shop_resets_customer`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_email_verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `token_hash` CHAR(64) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uq_shop_email_verification_token`(`token_hash`),
    INDEX `idx_shop_email_verification_customer`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shop_customer_identities` ADD CONSTRAINT `shop_customer_identities_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `shop_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_sessions` ADD CONSTRAINT `shop_sessions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `shop_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_customer_addresses` ADD CONSTRAINT `shop_customer_addresses_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `shop_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_password_resets` ADD CONSTRAINT `shop_password_resets_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `shop_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shop_email_verifications` ADD CONSTRAINT `shop_email_verifications_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `shop_customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

