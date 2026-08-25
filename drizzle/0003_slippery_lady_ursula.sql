ALTER TABLE `studyCards` ADD `questionType` enum('multiple_choice','identification') DEFAULT 'identification' NOT NULL;--> statement-breakpoint
ALTER TABLE `studyCards` ADD `choices` text;--> statement-breakpoint
ALTER TABLE `studyCards` ADD `correctAnswer` text;