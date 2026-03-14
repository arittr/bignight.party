CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`order` integer NOT NULL,
	`points` integer DEFAULT 1 NOT NULL,
	`winner_id` text,
	`is_revealed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`winner_id`) REFERENCES `nomination`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `game_config` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`picks_lock_at` integer,
	`completed_at` integer
);
--> statement-breakpoint
CREATE TABLE `nomination` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`image_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pick` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`category_id` text NOT NULL,
	`nomination_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`nomination_id`) REFERENCES `nomination`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pick_player_category_idx` ON `pick` (`player_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `player` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`pin` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_name_unique` ON `player` (`name`);