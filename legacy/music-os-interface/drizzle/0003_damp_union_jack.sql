CREATE TABLE `organism_controls` (
	`key` varchar(64) NOT NULL,
	`valueJson` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organism_controls_key` PRIMARY KEY(`key`)
);
