/**
 * Parser-specific types for Wikipedia event data
 * These types are database-agnostic and represent the raw parsed data
 */

export type ParsedNomination = {
	personName?: string;
	personWikipediaSlug?: string;
	personImageUrl?: string;
	workTitle?: string;
	workWikipediaSlug?: string;
	workImageUrl?: string;
	workYear?: number;
	isWinner?: boolean;
};

export type ParsedCategory = {
	name: string;
	pointValue: number;
	nominations: ParsedNomination[];
};

export type ParsedEvent = {
	name: string;
	date: Date;
	slug: string;
	description?: string;
	categories: ParsedCategory[];
};
