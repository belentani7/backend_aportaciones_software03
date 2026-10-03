CREATE TABLE `lora_checkpoints` (
	`id` varchar(64) NOT NULL,
	`parentId` varchar(64),
	`checksum` varchar(128) NOT NULL,
	`fidelity` varchar(32) NOT NULL,
	`vendiScore` varchar(32) NOT NULL,
	`status` enum('active','rolled_back','candidate') NOT NULL DEFAULT 'candidate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lora_checkpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lore_nodes` (
	`id` varchar(64) NOT NULL,
	`kind` enum('faction','character','symbol','place','event') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`season` int NOT NULL DEFAULT 1,
	`embeddingJson` text NOT NULL,
	`degree` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lore_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lore_relations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`targetId` varchar(64) NOT NULL,
	`relationType` varchar(64) NOT NULL,
	CONSTRAINT `lore_relations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `musical_genomes` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`baseKey` varchar(32) NOT NULL,
	`slotsJson` text NOT NULL,
	`negative` text NOT NULL,
	`cfg` varchar(32) NOT NULL,
	`steps` int NOT NULL,
	`loraWeightsJson` text NOT NULL,
	`seed` int NOT NULL,
	`fitness` varchar(32) NOT NULL DEFAULT '0',
	`lineageJson` text NOT NULL,
	`qaScore` varchar(32),
	`noveltyScore` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `musical_genomes_id` PRIMARY KEY(`id`)
);
