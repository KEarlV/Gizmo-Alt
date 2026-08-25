CREATE TABLE `adminAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int NOT NULL,
	`targetUserId` int,
	`action` varchar(120) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studyFolders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`color` varchar(24) NOT NULL DEFAULT 'persimmon',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studyFolders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `studyDecks` ADD `folderId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `studyPreferences` text;--> statement-breakpoint
ALTER TABLE `adminAuditLogs` ADD CONSTRAINT `adminAuditLogs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adminAuditLogs` ADD CONSTRAINT `adminAuditLogs_targetUserId_users_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyFolders` ADD CONSTRAINT `studyFolders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyDecks` ADD CONSTRAINT `studyDecks_folderId_studyFolders_id_fk` FOREIGN KEY (`folderId`) REFERENCES `studyFolders`(`id`) ON DELETE no action ON UPDATE no action;