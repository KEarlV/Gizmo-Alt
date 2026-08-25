ALTER TABLE `studyDecks` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `studyDecks` ADD CONSTRAINT `studyDecks_shareToken_unique` UNIQUE(`shareToken`);