CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceType` enum('iphone_backup','gmail','google_calendar') NOT NULL,
	`lastSyncDate` timestamp,
	`status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`metadata` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `googleCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`expiresAt` timestamp,
	`scope` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `googleCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `googleCredentials_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('call','sms','email','calendar_event','manual_note') NOT NULL,
	`direction` enum('incoming','outgoing','bidirectional'),
	`date` timestamp NOT NULL,
	`subject` varchar(500),
	`content` text,
	`source` enum('iphone','gmail','google_calendar','manual') NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outreachLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`userId` int NOT NULL,
	`contactedDate` timestamp NOT NULL,
	`responseReceived` boolean NOT NULL DEFAULT false,
	`responseType` enum('positive','negative','neutral','no_response'),
	`notes` text,
	`nextContactDate` timestamp,
	`nextContactMonth` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `outreachLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`userId` int NOT NULL,
	`serviceName` varchar(255) NOT NULL,
	`serviceDate` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `customers` (`userId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `phone_idx` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `dataSources` (`userId`);--> statement-breakpoint
CREATE INDEX `sourceType_idx` ON `dataSources` (`sourceType`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `googleCredentials` (`userId`);--> statement-breakpoint
CREATE INDEX `customerId_idx` ON `interactions` (`customerId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `interactions` (`userId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `interactions` (`date`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `interactions` (`type`);--> statement-breakpoint
CREATE INDEX `customerId_idx` ON `outreachLogs` (`customerId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `outreachLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `contactedDate_idx` ON `outreachLogs` (`contactedDate`);--> statement-breakpoint
CREATE INDEX `nextContactDate_idx` ON `outreachLogs` (`nextContactDate`);--> statement-breakpoint
CREATE INDEX `customerId_idx` ON `services` (`customerId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `services` (`userId`);--> statement-breakpoint
CREATE INDEX `serviceDate_idx` ON `services` (`serviceDate`);--> statement-breakpoint
CREATE INDEX `serviceName_idx` ON `services` (`serviceName`);