CREATE TABLE `studyCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deckId` int NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`hint` text,
	`mnemonic` text,
	`difficulty` enum('again','good','easy') NOT NULL DEFAULT 'good',
	`reviewCount` int NOT NULL DEFAULT 0,
	`nextReviewAt` timestamp,
	`lastReviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studyCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studyDecks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`sourceFileName` varchar(255),
	`sourceFileKey` varchar(512),
	`sourceMimeType` varchar(120),
	`summary` text,
	`mnemonic` text,
	`cardCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studyDecks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `studyCards` ADD CONSTRAINT `studyCards_deckId_studyDecks_id_fk` FOREIGN KEY (`deckId`) REFERENCES `studyDecks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyDecks` ADD CONSTRAINT `studyDecks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;