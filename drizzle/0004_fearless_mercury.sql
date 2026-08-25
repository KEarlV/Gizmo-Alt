ALTER TABLE `studyCards` ADD `aiDifficulty` enum('easy','medium','hard') DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE `studyCards` ADD `cognitiveSkill` enum('remember','understand','apply','analyze','evaluate') DEFAULT 'understand' NOT NULL;--> statement-breakpoint
ALTER TABLE `studyCards` ADD `questionRationale` text;