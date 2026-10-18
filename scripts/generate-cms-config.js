/**
 * @file scripts/generate-cms-config.js
 * @description Decap CMS configuration generator.
 * 
 * Programmatically constructs Decap CMS `config.yml` with:
 * - Editorial workflow and git-gateway backend settings.
 * - Categorized media folders ensuring image uploads are properly organized.
 * - Singletons for site metadata, banner announcements, navigation, and sidebar widgets with configurable limits.
 * - Dynamic select options for retro icons generated from `src/assets/icons/`.
 * - Blog post and portfolio collections with draft support and preview links.
 */

import fs from "node:fs";
import path from "node:path";
import { formatIconLabel, getAvailableIcons } from "./sync-icons.js";

/**
 * Reusable helper generating standard header fields for content collections and singleton pages.
 * 
 * @param {string} title - Default page title.
 * @param {string} tagline - Default header tagline text.
 * @param {string} heading - Default main section heading.
 * @param {boolean} [introRequired=false] - Whether intro summary text is mandatory.
 * @param {string} [defaultBanner=""] - Optional default banner image path.
 * @returns {Array<object>} Decap CMS field schema definitions.
 */
function getHeaderFields(title, tagline, heading, introRequired = false, defaultBanner = "") {
	const bannerField = {
		label: "Header Banner Image",
		name: "headerBanner",
		widget: "image",
		required: false,
	};
	if (defaultBanner) bannerField.default = defaultBanner;

	return [
		{ label: "Page title", name: "title", widget: "string", default: title },
		{ label: "Header tagline", name: "headerTagline", widget: "string", default: tagline },
		bannerField,
		{ label: "Header Banner Alt Text", name: "headerBannerAlt", widget: "string", required: false },
		{ label: "Heading", name: "heading", widget: "string", default: heading },
		{ label: "Intro", name: "intro", widget: "text", required: introRequired },
	];
}

/**
 * Builds the complete Decap CMS configuration object.
 * 
 * @returns {object} The complete configuration hierarchy ready for YAML serialization.
 */
export function buildConfig() {
	const availableIcons = getAvailableIcons().filter((i) => i !== "twitter").sort();
	const iconOptions = availableIcons.map((icon) => ({
		label: formatIconLabel(icon),
		value: icon,
	}));

	const config = {
		backend: {
			name: "git-gateway",
			branch: "main",
			commit_messages: {
				create: "content({{collection}}): create {{slug}}",
				update: "content({{collection}}): update {{slug}}",
				delete: "content({{collection}}): delete {{slug}}",
				uploadMedia: "media: upload {{path}}",
				deleteMedia: "media: delete {{path}}",
			},
		},
		publish_mode: "editorial_workflow",
		local_backend: true,
		site_url: "https://amitendu.me",
		display_url: "https://amitendu.me",
		logo_url: "/favicon.svg",
		show_preview_links: true,
		locale: "en",
		slug: {
			encoding: "ascii",
			clean_accents: true,
		},
		media_folder: "src/images",
		public_folder: "/images",
		max_file_size: 10485760,
		collections: [
			{
				name: "about",
				label: "About",
				delete: false,
				files: [
					{
						name: "me",
						label: "Me",
						file: "src/_data/about.json",
						format: "json",
						fields: [
							...getHeaderFields("About", "ABOUT THIS PERSON", "About me", true),
							{ label: "Profile image", name: "profileImage", widget: "image", required: false },
							{ label: "Profile image alt text", name: "profileAlt", widget: "string", required: false },
							{
								label: "Content (Rich Text / Markdown)",
								name: "content",
								widget: "markdown",
								modes: ["rich_text", "raw"],
								buttons: [
									"bold", "italic", "code", "link", "heading-two", "heading-three", "quote", "bulleted-list", "numbered-list"
								],
								editor_components: ["image", "code-block"],
							},
						],
					},
					{
						name: "books",
						label: "Books",
						file: "src/_data/books.json",
						format: "json",
						fields: [
							...getHeaderFields("Books", "WHAT I'M READING", "Bookshelf", false),
							{
								label: "Books List",
								name: "items",
								widget: "list",
								label_singular: "Book",
								collapsed: true,
								summary: "{{fields.title}} by {{fields.author}} [{{fields.status}}]",
								fields: [
									{ label: "Book Title", name: "title", widget: "string" },
									{ label: "Author", name: "author", widget: "string", required: false },
									{ label: "Cover Image", name: "image", widget: "image", required: false, hint: "Upload a book cover image (JPG, PNG, WEBP)." },
									{ label: "Cover Image Alt Text", name: "imageAlt", widget: "string", required: false },
									{
										label: "Status",
										name: "status",
										widget: "select",
										options: [
											{ label: "Currently Reading", value: "currently-reading" },
											{ label: "Completed / Finished", value: "read" },
											{ label: "Want to Read / Plan to Read", value: "to-read" },
										],
										default: "currently-reading",
									},
									{ label: "Progress / Notes (e.g. Chapter 6 / Page 140)", name: "progress", widget: "string", required: false },
									{ label: "Rating (Stars 1-5)", name: "rating", widget: "number", value_type: "int", min: 1, max: 5, required: false },
									{ label: "Year / Date Read", name: "year", widget: "string", required: false },
									{ label: "Thoughts / Mini Review", name: "review", widget: "text", required: false },
								],
							},
						],
					},
					{
						name: "movies",
						label: "Movies",
						file: "src/_data/movies.json",
						format: "json",
						fields: [
							...getHeaderFields("Movies", "WHAT I'M WATCHING", "Cinema & Shows", false),
							{
								label: "Movies (Section 1)",
								name: "movies",
								widget: "list",
								label_singular: "Movie",
								collapsed: true,
								summary: "{{fields.title}} [{{fields.status}}]",
								fields: [
									{ label: "Movie Title", name: "title", widget: "string" },
									{ label: "Director / Studio", name: "director", widget: "string", required: false },
									{ label: "Poster Image", name: "image", widget: "image", required: false, hint: "Upload a movie poster image (JPG, PNG, WEBP)." },
									{ label: "Poster Alt Text", name: "imageAlt", widget: "string", required: false },
									{
										label: "Status",
										name: "status",
										widget: "select",
										options: [
											{ label: "Currently Watching", value: "currently-watching" },
											{ label: "Completed / Watched", value: "watched" },
											{ label: "Plan to Watch", value: "plan-to-watch" },
										],
										default: "watched",
									},
									{ label: "Rating (Stars 1-5)", name: "rating", widget: "number", value_type: "int", min: 1, max: 5, required: false },
									{ label: "Release Year", name: "year", widget: "string", required: false },
									{ label: "Thoughts / Mini Review", name: "review", widget: "text", required: false },
									{ label: "Link (IMDb, Letterboxd, TMDB)", name: "link", widget: "string", required: false, pattern: ["^https?://.+", "Must be a full URL"] },
								],
							},
							{
								label: "TV Shows & Series (Section 2)",
								name: "shows",
								widget: "list",
								label_singular: "Show",
								collapsed: true,
								summary: "{{fields.title}} [{{fields.status}}]",
								fields: [
									{ label: "Show Title", name: "title", widget: "string" },
									{ label: "Creator / Network / Studio", name: "creator", widget: "string", required: false },
									{ label: "Poster Image", name: "image", widget: "image", required: false, hint: "Upload a show poster image (JPG, PNG, WEBP)." },
									{ label: "Poster Alt Text", name: "imageAlt", widget: "string", required: false },
									{
										label: "Status",
										name: "status",
										widget: "select",
										options: [
											{ label: "Currently Watching", value: "currently-watching" },
											{ label: "Completed / Finished", value: "watched" },
											{ label: "Plan to Watch", value: "plan-to-watch" },
										],
										default: "currently-watching",
									},
									{ label: "Progress / Notes (e.g. Season 2 or S03E04)", name: "progress", widget: "string", required: false },
									{ label: "Rating (Stars 1-5)", name: "rating", widget: "number", value_type: "int", min: 1, max: 5, required: false },
									{ label: "Year / Airing Period", name: "year", widget: "string", required: false },
									{ label: "Thoughts / Mini Review", name: "review", widget: "text", required: false },
									{ label: "Link (IMDb, TMDB, MyAnimeList)", name: "link", widget: "string", required: false, pattern: ["^https?://.+", "Must be a full URL"] },
								],
							},
						],
					},
					{
						name: "anime",
						label: "Anime",
						file: "src/_data/anime.json",
						format: "json",
						fields: [
							...getHeaderFields("Anime", "WHAT I'M WATCHING", "Anime & Animation", false),
							{
								label: "Anime Series & Films",
								name: "series",
								widget: "list",
								label_singular: "Series / Film",
								collapsed: true,
								summary: "{{fields.title}} [{{fields.status}}]",
								fields: [
									{ label: "Title", name: "title", widget: "string" },
									{ label: "Studio", name: "studio", widget: "string", required: false },
									{ label: "Poster Image", name: "image", widget: "image", required: false, hint: "Upload an anime cover/poster image (JPG, PNG, WEBP)." },
									{ label: "Poster Alt Text", name: "imageAlt", widget: "string", required: false },
									{ label: "Format / Type", name: "type", widget: "string", default: "TV Series" },
									{ label: "Progress", name: "progress", widget: "string", required: false },
									{
										label: "Status",
										name: "status",
										widget: "select",
										options: [
											{ label: "Currently Watching", value: "currently-watching" },
											{ label: "Completed / Watched", value: "watched" },
											{ label: "Plan to Watch", value: "plan-to-watch" },
										],
										default: "watched",
									},
									{ label: "Release Year / Airing Period", name: "year", widget: "string", required: false },
									{ label: "Rating (Stars 1-5)", name: "rating", widget: "number", value_type: "int", min: 1, max: 5, required: false },
									{ label: "Genres", name: "genres", widget: "string", required: false },
									{ label: "Thoughts / Mini Review", name: "review", widget: "text", required: false },
									{ label: "Link (MyAnimeList / Official Website)", name: "link", widget: "string", required: false, pattern: ["^https?://.+", "Must be a full URL"] },
								],
							},
						],
					},
					{
						name: "games",
						label: "Games",
						file: "src/_data/games.json",
						format: "json",
						fields: [
							...getHeaderFields("Games", "WHAT I'M PLAYING", "Games", false),
							{
								label: "Games List",
								name: "items",
								widget: "list",
								label_singular: "Game",
								collapsed: true,
								summary: "{{fields.name}} [{{fields.status}}]",
								fields: [
									{ label: "Game Name", name: "name", widget: "string" },
									{
										label: "Playing Right Now (Feature on Home & Sidebar)",
										name: "playingRightNow",
										widget: "boolean",
										default: false,
										required: false,
										hint: "Enable to feature this game in the 'Games I play' card on the Home page and Sidebar.",
									},
									{ label: "Cover / Box Art Image", name: "image", widget: "image", required: false, hint: "Upload a game cover image or box art (JPG, PNG, WEBP)." },
									{ label: "Cover Image Alt Text", name: "imageAlt", widget: "string", required: false },
									{ label: "Icon / Mini Logo (Optional)", name: "icon", widget: "image", required: false, hint: "Upload a small game icon (PNG, SVG, WEBP)." },
									{ label: "Icon Alt Text", name: "iconAlt", widget: "string", required: false },
									{ label: "Publisher / Developer", name: "publisher", widget: "string", required: false, hint: "e.g. HoYoverse, Nintendo, FromSoftware, Valve, Sony, etc." },
									{ label: "Platform (e.g. PC, Switch, PS5, Steam Deck)", name: "platform", widget: "string", required: false },
									{
										label: "Status",
										name: "status",
										widget: "select",
										options: [
											{ label: "Playing", value: "playing" },
											{ label: "Completed", value: "completed" },
											{ label: "Backlog", value: "backlog" },
											{ label: "On Hold", value: "on-hold" },
											{ label: "Dropped", value: "dropped" },
										],
										default: "playing",
									},
									{ label: "Tags", name: "tags", widget: "list", required: false, label_singular: "Tag", hint: "Add tags, e.g. 'RPG', 'Gacha', 'PC', etc." },
									{ label: "Description / Notes", name: "description", widget: "text", required: false },
									{ label: "Link (Official Website or Steam Page)", name: "link", widget: "string", required: false, pattern: ["^https?://.+", "Must be a full URL"] },
								],
							},
						],
					},
					{
						name: "software",
						label: "Software",
						file: "src/_data/software.json",
						format: "json",
						fields: [
							...getHeaderFields("Software", "TOOLS & APPS I USE", "Software & Tools", false),
							{
								label: "Software List",
								name: "items",
								widget: "list",
								label_singular: "Tool",
								collapsed: true,
								summary: "{{fields.name}}",
								fields: [
									{ label: "Software / Tool Name", name: "name", widget: "string" },
									{ label: "Icon / Logo Image", name: "icon", widget: "image", required: false, hint: "Upload a small app icon (PNG, SVG, WEBP, ICO)." },
									{ label: "Icon Alt Text", name: "iconAlt", widget: "string", required: false },
									{ label: "Website / Download Link", name: "link", widget: "string", required: false, pattern: ["^https?://.+", "Must be a full URL"] },
								],
							},
						],
					},
					{
						name: "friends",
						label: "Friends",
						file: "src/_data/friends.json",
						format: "json",
						fields: [
							...getHeaderFields("Friends", "FRIENDS & ALLIES", "Friends & Web Neighbours", false),
							{
								label: "Friends & Allies List",
								name: "items",
								widget: "list",
								label_singular: "Friend",
								collapsed: true,
								summary: "{{fields.name}} [{{fields.relationship}}]",
								fields: [
									{ label: "Friend / Site Name", name: "name", widget: "string" },
									{ label: "Website URL", name: "url", widget: "string", pattern: ["^https?://.+", "Must be a full URL"] },
									{ label: "Avatar / Profile Picture", name: "avatar", widget: "image", required: false, hint: "Upload an avatar or icon (PNG, JPG, WEBP, GIF)." },
									{ label: "Avatar Alt Text", name: "avatarAlt", widget: "string", required: false },
									{ label: "Relationship / Role", name: "relationship", widget: "string", required: false, hint: "e.g. Peer / Friend, Colleague, Design Partner, Webring Ally" },
									{ label: "Bio / Description", name: "description", widget: "text", required: false, hint: "Short note on who they are or what their site is about." },
								],
							},
						],
					},
					{
						name: "gear",
						label: "Gear",
						file: "src/_data/gear.json",
						format: "json",
						fields: [
							...getHeaderFields("Gear", "MY DESK & DAILY DRIVERS", "Hardware, Desk Setup & Photography", false, "/images/header-banner.jpg"),
							{
								label: "Desk & Setup Photo Gallery",
								name: "gallery",
								widget: "list",
								label_singular: "Photo",
								collapsed: true,
								required: false,
								summary: "{{fields.title}} [{{fields.date}}]",
								fields: [
									{ label: "Photo Title", name: "title", widget: "string", default: "Desk Setup" },
									{ label: "Photo Image", name: "image", widget: "image" },
									{ label: "Photo Alt Text", name: "alt", widget: "string", required: false },
									{ label: "Caption / Description", name: "caption", widget: "string", required: false },
									{ label: "Date / Year", name: "date", widget: "string", required: false },
								],
							},
							{
								label: "Hardware & Peripheral Categories",
								name: "categories",
								widget: "list",
								label_singular: "Category",
								collapsed: true,
								required: false,
								summary: "{{fields.category}}",
								fields: [
									{ label: "Category Name", name: "category", widget: "string" },
									{
										label: "Hardware Items",
										name: "items",
										widget: "list",
										label_singular: "Item",
										summary: "{{fields.name}}: {{fields.specs}}",
										fields: [
											{ label: "Item / Component Name", name: "name", widget: "string" },
											{ label: "Key Specifications", name: "specs", widget: "string" },
											{ label: "Notes / Experience", name: "notes", widget: "text", required: false },
										],
									},
								],
							},
						],
					},
				],
			},
			{
				name: "resume-page",
				label: "Resume / CV",
				delete: false,
				files: [
					{
						name: "resume-page",
						label: "Resume / CV Page",
						file: "src/_data/resume.json",
						format: "json",
						fields: [
							{ label: "Page title", name: "title", widget: "string", default: "Resume" },
							{ label: "Header tagline", name: "headerTagline", widget: "string", default: "CURRICULUM VITAE" },
							{ label: "Header Banner Image", name: "headerBanner", widget: "image", required: false, default: "/images/header-banner.jpg" },
							{ label: "Header Banner Alt Text", name: "headerBannerAlt", widget: "string", required: false },
							{ label: "Heading / Full Name", name: "heading", widget: "string", default: "Curriculum Vitae" },
							{ label: "Subheading / Role", name: "subheading", widget: "string", default: "Full-Stack Web Developer & Designer", required: false },
							{ label: "Professional Summary", name: "intro", widget: "text", required: false },
							{ label: "Resume PDF URL or File", name: "pdfUrl", widget: "file", required: false },
							{
								label: "Contact Details",
								name: "contactDetails",
								widget: "list",
								label_singular: "Contact Detail",
								collapsed: true,
								required: false,
								fields: [
									{ label: "Label", name: "label", widget: "string" },
									{ label: "Value", name: "value", widget: "string" },
									{ label: "URL", name: "url", widget: "string", required: false, pattern: ["^https?://.+", "Must be a full URL"] },
								],
							},
							{
								label: "Work Experience",
								name: "experience",
								widget: "list",
								label_singular: "Experience",
								collapsed: true,
								required: false,
								fields: [
									{ label: "Job Title", name: "role", widget: "string" },
									{ label: "Company / Organization", name: "company", widget: "string" },
									{ label: "Period", name: "period", widget: "string" },
									{ label: "Description", name: "description", widget: "text" },
								],
							},
							{
								label: "Education",
								name: "education",
								widget: "list",
								label_singular: "Education",
								collapsed: true,
								required: false,
								fields: [
									{ label: "Degree / Certificate", name: "degree", widget: "string" },
									{ label: "Institution / School", name: "institution", widget: "string" },
									{ label: "Period", name: "period", widget: "string" },
									{ label: "Details", name: "details", widget: "string", required: false },
								],
							},
							{
								label: "Certifications & Credentials",
								name: "certifications",
								widget: "list",
								label_singular: "Certification",
								collapsed: true,
								required: false,
								fields: [
									{ label: "Certificate / Credential Name", name: "name", widget: "string" },
									{ label: "Issuing Organization", name: "issuer", widget: "string" },
									{ label: "Issue Date / Year", name: "date", widget: "string", required: false },
									{ label: "Credential ID / License #", name: "credentialId", widget: "string", required: false },
									{ label: "Verification URL", name: "credentialUrl", widget: "string", required: false, pattern: ["^https?://.+", "Must be a full URL"] },
									{ label: "Badge / Certificate Image", name: "badge", widget: "image", required: false },
									{ label: "Badge Alt Text", name: "badgeAlt", widget: "string", required: false },
									{ label: "Skills Covered", name: "skills", widget: "string", required: false },
								],
							},
							{
								label: "Skill Categories",
								name: "skillsList",
								widget: "list",
								label_singular: "Skill Category",
								collapsed: true,
								required: false,
								fields: [
									{ label: "Category", name: "category", widget: "string" },
									{ label: "Skills", name: "items", widget: "string" },
								],
							},
							{ label: "Additional Notes", name: "additionalNotes", widget: "text", required: false },
						],
					},
				],
			},
			{
				name: "pages",
				label: "Pages",
				delete: false,
				files: [
					{
						name: "home",
						label: "Homepage",
						file: "src/_data/home.json",
						format: "json",
						fields: [
							{ label: "Greeting", name: "greeting", widget: "string" },
							{ label: "Welcome text", name: "welcome", widget: "string" },
							{ label: "Header Banner Image", name: "headerBanner", widget: "image", required: false, default: "/images/header-banner.jpg" },
							{ label: "Header Banner Alt Text", name: "headerBannerAlt", widget: "string", required: false },
							{ label: "Greeting GIF", name: "greetingGif", widget: "image", required: false, default: "/images/hi.gif" },
							{ label: "Greeting GIF Alt Text", name: "greetingGifAlt", widget: "string", required: false },
							{ label: "About heading", name: "aboutTitle", widget: "string" },
							{ label: "About text", name: "about", widget: "text" },
							{ label: "Currently heading", name: "currentlyTitle", widget: "string" },
							{ label: "Currently", name: "currently", widget: "list", label_singular: "Item", field: { label: "Item", name: "item", widget: "string" } },
							{ label: "Profile image", name: "profileImage", widget: "image", required: false },
							{ label: "Profile image alt text", name: "profileAlt", widget: "string", required: false },
							{ label: "Status heading", name: "statusTitle", widget: "string" },
							{
								label: "Status",
								name: "status",
								widget: "list",
								label_singular: "Status Item",
								fields: [
									{ label: "Label", name: "label", widget: "string" },
									{ label: "Value", name: "value", widget: "string" },
								],
							},
							{
								label: "Quick links",
								name: "links",
								widget: "list",
								label_singular: "Quick Link",
								collapsed: true,
								fields: [
									{ label: "Label", name: "label", widget: "string" },
									{ label: "URL", name: "url", widget: "string", pattern: ["^https?://.+", "Must be a full URL"] },
								],
							},
							{ label: "Skills", name: "skills", widget: "list", label_singular: "Skill", field: { label: "Skill", name: "skill", widget: "string" } },
						],
					},
					{
						name: "blog-page",
						label: "Blog landing page",
						file: "src/_data/blogPage.json",
						format: "json",
						fields: getHeaderFields("Blog", "MY WEB LOG", "Web log", true),
					},
					{
						name: "portfolio-page",
						label: "Portfolio landing page",
						file: "src/_data/portfolioPage.json",
						format: "json",
						fields: [
							...getHeaderFields("Portfolio", "MY WEB PORTFOLIO", "My work", true),
							{ label: "Show project filter chips", name: "showFilters", widget: "boolean", default: true },
							{ label: "Empty state message", name: "emptyStateText", widget: "string", default: "There are no portfolio projects published yet. Check back soon!" },
							{ label: "Call to Action Text", name: "ctaText", widget: "string", required: false, default: "Get in touch »" },
							{ label: "Call to Action URL", name: "ctaUrl", widget: "string", required: false, default: "mailto:me@amitendu.me" },
						],
					},
					{
						name: "site",
						label: "Site settings",
						file: "src/_data/site.json",
						format: "json",
						fields: [
							{ label: "Site title", name: "title", widget: "string" },
							{ label: "Site URL", name: "url", widget: "string", default: "https://amitendu.me" },
							{ label: "Header tagline", name: "tagline", widget: "string" },
							{ label: "Default Header Banner Image", name: "headerBanner", widget: "image", required: false, default: "/images/header-banner.jpg" },
							{ label: "Default Header Banner Alt Text", name: "headerBannerAlt", widget: "string", required: false },
							{ label: "Email", name: "email", widget: "string" },
							{ label: "Social Handle", name: "handle", widget: "string", required: false, default: "ShadowAmitendu" },
							{ label: "Twitter / X Handle", name: "twitter", widget: "string", required: false, default: "@shadow_amitendu" },
							{ label: "SEO Description", name: "description", widget: "text", required: false },
							{ label: "SEO Keywords", name: "keywords", widget: "string", required: false },
							{ label: "Social Share Card (OG Image)", name: "ogImage", widget: "image", required: false, default: "/images/og-card.jpg" },
							{ label: "Footer text", name: "footer", widget: "string" },
							{ label: "Footer title", name: "footerTitle", widget: "string" },
							{ label: "Footer badge", name: "footerBadge", widget: "string" },
							{ label: "Visitor count", name: "visitorCount", widget: "string" },
							{
								label: "Author Profile",
								name: "author",
								widget: "object",
								fields: [
									{ label: "Name", name: "name", widget: "string" },
									{ label: "Role / Subtitle", name: "role", widget: "string" },
									{ label: "Avatar", name: "avatar", widget: "image" },
									{ label: "Avatar Alt Text", name: "avatarAlt", widget: "string", required: false },
									{ label: "Mini Bio", name: "bio", widget: "string" },
								],
							},
							{ label: "Featured item limit", name: "featuredLimit", widget: "number", value_type: "int", default: 4 },
						],
					},
				],
			},
			{
				name: "announcement",
				label: "Announcement Banner",
				delete: false,
				files: [
					{
						name: "banner",
						label: "Announcement Banner",
						file: "src/_data/announcement.json",
						format: "json",
						fields: [
							{ label: "Enable Announcement", name: "enabled", widget: "boolean", default: true },
							{ label: "Announcement ID / Version Tag", name: "id", widget: "string", default: "welcome-2026", hint: "Change this tag whenever you update your announcement so visitors who previously dismissed it will see the new banner." },
							{
								label: "Banner Style / Color",
								name: "type",
								widget: "select",
								default: "info",
								options: [
									{ label: "Aero Blue (General / Welcome)", value: "info" },
									{ label: "Gold / Amber (Alert / Important)", value: "alert" },
									{ label: "Emerald Green (Update / Special)", value: "success" },
								],
							},
							{ label: "Announcement Message", name: "message", widget: "string", default: "Welcome to my portfolio! Check out the newly updated retro workspace & books." },
							{ label: "Action Button Text", name: "linkText", widget: "string", required: false, default: "Check it out »" },
							{ label: "Action Button URL", name: "linkUrl", widget: "string", required: false, default: "/about/books/" },
						],
					},
				],
			},
			{
				name: "sidebars",
				label: "Sidebars",
				delete: false,
				files: [
					{
						name: "left-sidebar",
						label: "Left Sidebar (Navigation)",
						file: "src/_data/leftSidebar.json",
						format: "json",
						fields: [
							{ label: "Section Title", name: "title", widget: "string", default: "Navigate" },
							{ label: "Max Navigation Links (0 to show all)", name: "limit", widget: "number", value_type: "int", default: 0, required: false },
							{
								label: "Navigation Links",
								name: "items",
								widget: "list",
								label_singular: "Link",
								collapsed: true,
								summary: "{{fields.label}} ({{fields.url}})",
								fields: [
									{ label: "Label", name: "label", widget: "string" },
									{ label: "URL", name: "url", widget: "string" },
								],
							},
						],
					},
					{
						name: "right-sidebar",
						label: "Right Sidebar (Outlinks & Socials)",
						file: "src/_data/rightSidebar.json",
						format: "json",
						fields: [
							{ label: "Section Title", name: "title", widget: "string", default: "Outlinks" },
							{ label: "Max Shortcuts to Display (0 to show all)", name: "limit", widget: "number", value_type: "int", default: 8, required: false },
							{
								label: "Outlink Shortcuts",
								name: "items",
								widget: "list",
								label_singular: "Shortcut",
								collapsed: true,
								summary: "{{fields.label}} [{{fields.icon}}]",
								fields: [
									{ label: "Label", name: "label", widget: "string" },
									{ label: "URL", name: "url", widget: "string" },
									{
										label: "Website Icon",
										name: "icon",
										widget: "select",
										required: false,
										options: iconOptions,
									},
								],
							},
						],
					},
					{
						name: "sidebar-widgets",
						label: "Sidebar Widgets & Limits",
						file: "src/_data/sidebarWidgets.json",
						format: "json",
						fields: [
							{ label: "Recent Posts Title", name: "recentPostsTitle", widget: "string", default: "Recent Posts" },
							{ label: "Recent Posts Limit", name: "recentPostsLimit", widget: "number", value_type: "int", default: 3, hint: "Number of blog posts to display in left sidebar" },
							{ label: "Favorites Title", name: "favoritesTitle", widget: "string", default: "Favorites" },
							{ label: "Favorites Limit", name: "favoritesLimit", widget: "number", value_type: "int", default: 4, hint: "Number of favorite projects/articles to display in left sidebar" },
							{ label: "Navigation Links Limit (0 to show all)", name: "navigationLimit", widget: "number", value_type: "int", default: 0, required: false, hint: "Maximum navigation items to display in left sidebar (0 = all)" },
							{ label: "Outlinks / Shortcuts Title", name: "shortcutsTitle", widget: "string", default: "Outlinks" },
							{ label: "Outlinks / Shortcuts Limit (0 to show all)", name: "shortcutsLimit", widget: "number", value_type: "int", default: 8, required: false, hint: "Maximum outlinks/social profiles to display in right sidebar (0 = all)" },
							{ label: "Book Reading Card Title", name: "readingTitle", widget: "string", default: "Book I am reading" },
							{ label: "Games Widget Title", name: "gamesTitle", widget: "string", default: "Games I play" },
							{ label: "Games Mini Icons Limit", name: "gamesLimit", widget: "number", value_type: "int", default: 6, hint: "Maximum secondary game icons to display below featured game (0 to hide mini icons)" },
							{ label: "Software Widget Title", name: "softwareTitle", widget: "string", default: "Software" },
							{ label: "Software Icons Limit (0 to show all)", name: "softwareLimit", widget: "number", value_type: "int", default: 8, hint: "Maximum software icons to display in right sidebar (0 = all)" },
							{ label: "Friends & Allies Title", name: "friendsTitle", widget: "string", default: "Friends & Allies" },
							{ label: "Friends & Allies Limit", name: "friendsLimit", widget: "number", value_type: "int", default: 4, hint: "Number of friends & allies to display in right sidebar (0 = all)" },
						],
					},
				],
			},
			{
				name: "blog",
				label: "Blog posts",
				folder: "src/blog",
				create: true,
				preview_path: "blog/{{slug}}",
				slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
				summary: "{{title}} — {{date | date('YYYY-MM-DD')}}",
				sortable_fields: ["date", "title", "commit_date"],
				view_filters: [
					{ label: "Published", field: "draft", pattern: false },
					{ label: "Favorites / Featured", field: "featured", pattern: true },
					{ label: "Drafts", field: "draft", pattern: true },
				],
				view_groups: [
					{ label: "Year", field: "date", pattern: "\\d{4}" },
					{ label: "Draft status", field: "draft" },
				],
				fields: [
					{ label: "Layout", name: "layout", widget: "hidden", default: "post.njk" },
					{ label: "Draft", name: "draft", widget: "boolean", default: false, required: false },
					{ label: "Featured on home", name: "featured", widget: "boolean", default: false, required: false },
					{ label: "Title", name: "title", widget: "string" },
					{ label: "Header tagline", name: "headerTagline", widget: "string", default: "BLOG POST" },
					{ label: "Description", name: "description", widget: "string", pattern: [".{20,160}", "20-160 characters for SEO"] },
					{ label: "Publish date", name: "date", widget: "datetime" },
					{ label: "Updated date", name: "updated", widget: "datetime", required: false },
					{
						label: "Author",
						name: "author",
						widget: "relation",
						collection: "authors",
						search_fields: ["name"],
						value_field: "name",
						display_fields: ["name"],
						default: "Amitendu Bikash Dhusiya",
					},
					{ label: "Canonical URL", name: "canonical", widget: "string", required: false, pattern: ["^https?://.+", "Must be a full URL"] },
					{ label: "Topics", name: "topics", widget: "list", required: false, label_singular: "Topic" },
					{ label: "Current mood", name: "mood", widget: "string", required: false, hint: "e.g. thoughtful, caffeinated" },
					{ label: "Current music", name: "music", widget: "string", required: false, hint: "e.g. Daft Punk - Digital Love" },
					{ label: "Featured image", name: "image", widget: "image", required: false, hint: "Upload an image or use an external image URL." },
					{ label: "Featured image alt text", name: "imageAlt", widget: "string", required: false },
					{ label: "Social share image (OG Image)", name: "ogImage", widget: "image", required: false },
					{ label: "Body", name: "body", widget: "markdown" },
				],
			},
			{
				name: "portfolio",
				label: "Portfolio projects",
				folder: "src/portfolio",
				create: true,
				preview_path: "portfolio/{{slug}}",
				slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
				summary: "{{title}} · {{projectType}} · {{projectStatus}}",
				sortable_fields: ["date", "order", "title", "commit_date"],
				view_filters: [
					{ label: "Published", field: "draft", pattern: false },
					{ label: "Featured on home", field: "featured", pattern: true },
					{ label: "Drafts", field: "draft", pattern: true },
				],
				view_groups: [
					{ label: "Project Type", field: "projectType" },
					{ label: "Status", field: "projectStatus" },
				],
				fields: [
					{ label: "Layout", name: "layout", widget: "hidden", default: "base.njk" },
					{ label: "Draft", name: "draft", widget: "boolean", default: false },
					{ label: "Featured on home", name: "featured", widget: "boolean", default: false },
					{ label: "Title", name: "title", widget: "string" },
					{ label: "Header tagline", name: "headerTagline", widget: "string", default: "PORTFOLIO PROJECT" },
					{ label: "Description", name: "description", widget: "string", pattern: [".{20,160}", "20-160 characters for SEO"] },
					{ label: "Date", name: "date", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false },
					{ label: "Sort order (lower = first)", name: "order", widget: "number", value_type: "int", default: 100, required: false },
					{
						label: "Project type",
						name: "projectType",
						widget: "select",
						options: [
							{ label: "Desktop app", value: "desktop" },
							{ label: "Android app", value: "android" },
							{ label: "Web app", value: "web" },
							{ label: "Tool / Script", value: "tool" },
							{ label: "Academic / College", value: "academic" },
						],
					},
					{ label: "Platforms", name: "platforms", widget: "select", multiple: true, required: false, options: ["Windows", "Android", "Web", "CLI"] },
					{
						label: "Project status",
						name: "projectStatus",
						widget: "select",
						default: "in-progress",
						options: [
							{ label: "In progress", value: "in-progress" },
							{ label: "Completed", value: "completed" },
							{ label: "Maintained", value: "maintained" },
							{ label: "Archived", value: "archived" },
							{ label: "Concept", value: "concept" },
						],
					},
					{ label: "Role", name: "role", widget: "string", required: false },
					{ label: "Context", name: "context", widget: "string", required: false, hint: "Personal, College project, Client work, Hackathon" },
					{ label: "Duration", name: "duration", widget: "string", required: false },
					{ label: "Tech stack", name: "stack", widget: "list", required: false, min: 1, label_singular: "Tech" },
					{ label: "Key highlights", name: "highlights", widget: "list", required: false, label_singular: "Highlight" },
					{
						label: "Links",
						name: "links",
						widget: "list",
						required: false,
						label_singular: "Link",
						summary: "{{fields.label}}",
						fields: [
							{ label: "Label", name: "label", widget: "string" },
							{ label: "URL", name: "url", widget: "string", pattern: ["^https?://.+", "Must be a full URL"] },
						],
					},
					{ label: "Featured image", name: "image", widget: "image", required: false },
					{ label: "Featured image alt text", name: "imageAlt", widget: "string", required: false },
					{
						label: "Screenshots",
						name: "gallery",
						widget: "list",
						required: false,
						collapsed: true,
						label_singular: "Screenshot",
						fields: [
							{ label: "Image", name: "image", widget: "image" },
							{ label: "Alt text", name: "alt", widget: "string" },
							{ label: "Caption", name: "caption", widget: "string", required: false },
						],
					},
					{ label: "Social share image", name: "ogImage", widget: "image", required: false },
					{ label: "Body", name: "body", widget: "markdown" },
				],
			},
			{
				name: "authors",
				label: "Authors",
				folder: "src/authors",
				create: true,
				slug: "{{slug}}",
				summary: "{{name}} (@{{slug}})",
				fields: [
					{ label: "Layout", name: "layout", widget: "hidden", default: "base.njk" },
					{ label: "Page title", name: "title", widget: "hidden", default: "Author Profile" },
					{ label: "Header tagline", name: "headerTagline", widget: "hidden", default: "AUTHOR PROFILE" },
					{ label: "Slug", name: "slug", widget: "string" },
					{ label: "Name", name: "name", widget: "string" },
					{ label: "Profile image", name: "image", widget: "image", required: false },
					{ label: "Profile image alt text", name: "imageAlt", widget: "string", required: false },
					{ label: "Bio", name: "bio", widget: "text", required: false },
					{ label: "Hide hero image", name: "hideHeroImage", widget: "hidden", default: true },
				],
			},
		],
	};

	return config;
}

import yaml from "js-yaml";

// Generate files
const config = buildConfig();
const yamlHeader = `# Note: Netlify Identity / git-gateway is in maintenance mode; the github backend with an OAuth proxy is the long-term option.\n`;
const yamlContent = yamlHeader + yaml.dump(config, { noRefs: true, lineWidth: -1 });

const srcConfigPath = path.resolve("src/admin/config.yml");
const publicConfigPath = path.resolve("public/admin/config.yml");

fs.writeFileSync(srcConfigPath, yamlContent, "utf8");
console.log(`[generate-cms-config] Generated ${srcConfigPath}`);

if (fs.existsSync(path.dirname(publicConfigPath))) {
	fs.writeFileSync(publicConfigPath, yamlContent, "utf8");
	console.log(`[generate-cms-config] Generated ${publicConfigPath}`);
}

// Generate image filename list for admin auto-renamer collision prevention
try {
	const imagesDir = path.resolve("src/images");
	if (fs.existsSync(imagesDir)) {
		const imgFiles = fs
			.readdirSync(imagesDir)
			.filter((f) => !f.startsWith(".") && fs.statSync(path.join(imagesDir, f)).isFile());
		const jsonPathSrc = path.resolve("src/admin/images-list.json");
		fs.writeFileSync(jsonPathSrc, JSON.stringify(imgFiles, null, 2), "utf8");
		console.log(`[generate-cms-config] Generated ${jsonPathSrc} (${imgFiles.length} images)`);

		if (fs.existsSync(path.dirname(publicConfigPath))) {
			const jsonPathPublic = path.resolve("public/admin/images-list.json");
			fs.writeFileSync(jsonPathPublic, JSON.stringify(imgFiles, null, 2), "utf8");
			console.log(`[generate-cms-config] Generated ${jsonPathPublic}`);
		}
	}
} catch (err) {
	console.warn(`[generate-cms-config] Could not generate images-list.json: ${err.message}`);
}
