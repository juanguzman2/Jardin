CREATE TABLE `areas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `day_commitments` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`text` text NOT NULL,
	`area_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`date`) REFERENCES `day_entries`(`date`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `day_commitments_date_idx` ON `day_commitments` (`date`);--> statement-breakpoint
CREATE TABLE `day_entries` (
	`date` text PRIMARY KEY NOT NULL,
	`values_read` integer DEFAULT false NOT NULL,
	`satisfaction` integer,
	`gratitude_1` text,
	`gratitude_2` text,
	`gratitude_3` text,
	`step` text,
	`learning` text,
	`opening_done_at` text,
	`closing_done_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `functional_records` (
	`id` text PRIMARY KEY NOT NULL,
	`occurred_at` text NOT NULL,
	`context` text NOT NULL,
	`body` text,
	`thought` text,
	`action` text,
	`long_term` text,
	`intensity_before` integer,
	`intensity_after` integer,
	`area_id` text,
	`direction` text,
	`rule_id` text,
	`followed_rule` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`rule_id`) REFERENCES `verbal_rules`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `functional_records_occurred_at_idx` ON `functional_records` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `functional_records_rule_idx` ON `functional_records` (`rule_id`);--> statement-breakpoint
CREATE TABLE `habit_checks` (
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`habit_id`, `date`),
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `habit_checks_date_idx` ON `habit_checks` (`date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`area_id` text NOT NULL,
	`value_text` text,
	`frequency_type` text DEFAULT 'daily' NOT NULL,
	`weekdays` text,
	`times_per_week` integer,
	`minimal_version` text,
	`if_then` text,
	`reminder_time` text,
	`reminder_weekdays` text,
	`rule_id` text,
	`auto_link` text,
	`start_date` text NOT NULL,
	`phase` integer,
	`archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rule_id`) REFERENCES `verbal_rules`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `obstacle_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`text` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `values` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`area_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `rule_areas` (
	`rule_id` text NOT NULL,
	`area_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`rule_id`, `area_id`),
	FOREIGN KEY (`rule_id`) REFERENCES `verbal_rules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `timeline_items` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`activity` text NOT NULL,
	`thought` text,
	`direction` text,
	`area_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`date`) REFERENCES `day_entries`(`date`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `timeline_items_date_idx` ON `timeline_items` (`date`);--> statement-breakpoint
CREATE TABLE `verbal_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`thought` text NOT NULL,
	`typical_action` text,
	`reinforcement` text,
	`consequence` text,
	`functional_rule` text,
	`opposite_action` text,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
