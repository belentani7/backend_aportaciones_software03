CREATE TABLE `composition_artifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`compositionId` int NOT NULL,
	`userId` int NOT NULL,
	`genomeId` varchar(64) NOT NULL,
	`checksum` varchar(128) NOT NULL,
	`provenanceJson` text NOT NULL,
	`loreNodeIdsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `composition_artifacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `composition_artifacts_compositionId_unique` UNIQUE(`compositionId`)
);
--> statement-breakpoint
CREATE INDEX `composition_artifacts_user_created_idx` ON `composition_artifacts` (`userId`,`createdAt`);