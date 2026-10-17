import fs from "node:fs";
import path from "node:path";

function parseFrontMatter(content) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { frontMatter: {}, body: content, hasFrontMatter: false };

	const fmLines = match[1].split(/\r?\n/);
	const fm = {};
	let currentKey = null;
	let currentList = null;

	for (let i = 0; i < fmLines.length; i++) {
		const line = fmLines[i];
		const listMatch = line.match(/^\s*-\s*(.*)$/);
		if (listMatch && currentKey) {
			if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
			let val = listMatch[1].trim();
			if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
				val = val.slice(1, -1);
			}
			fm[currentKey].push(val);
			continue;
		}

		const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
		if (keyMatch) {
			const key = keyMatch[1];
			let val = keyMatch[2].trim();
			currentKey = key;
			if (val === "") {
				// Might be start of list or empty
				fm[key] = [];
			} else {
				// Look ahead for continuation lines that are indented
				let scalar = val;
				while (i + 1 < fmLines.length && /^\s{2,}[^\s-]/.test(fmLines[i + 1])) {
					i++;
					scalar += " " + fmLines[i].trim();
				}
				if ((scalar.startsWith('"') && scalar.endsWith('"')) || (scalar.startsWith("'") && scalar.endsWith("'"))) {
					scalar = scalar.slice(1, -1);
				} else if (scalar === "true") {
					scalar = true;
				} else if (scalar === "false") {
					scalar = false;
				}
				fm[key] = scalar;
			}
		}
	}

	return { frontMatter: fm, rawFm: match[1], body: match[2], hasFrontMatter: true };
}

// 1. Migrate blog posts
const blogDir = path.resolve("src/blog");
const blogFiles = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md"));

for (const file of blogFiles) {
	const filePath = path.join(blogDir, file);
	const content = fs.readFileSync(filePath, "utf8");
	const parsed = parseFrontMatter(content);

	if (parsed.hasFrontMatter) {
		const fm = parsed.frontMatter;
		const tags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];

		const isFav = tags.includes("fav") || fm.featured === true;
		const isDraft = tags.includes("draft") || fm.draft === true;

		// Topics: all tags that are not post, fav, draft
		const topics = (fm.topics && Array.isArray(fm.topics)) ? fm.topics : tags.filter((t) => !["post", "fav", "draft", "blog"].includes(t));

		// Build new front matter YAML
		const lines = ["---"];
		lines.push(`layout: ${fm.layout || "post.njk"}`);
		lines.push(`draft: ${isDraft ? "true" : "false"}`);
		lines.push(`featured: ${isFav ? "true" : "false"}`);
		if (fm.title) lines.push(`title: ${JSON.stringify(fm.title)}`);
		if (fm.headerTagline) lines.push(`headerTagline: ${JSON.stringify(fm.headerTagline)}`);
		if (fm.description) lines.push(`description: ${JSON.stringify(fm.description)}`);
		if (fm.date) lines.push(`date: ${fm.date}`);
		lines.push(`author: ${JSON.stringify(fm.author || "Amitendu Bikash Dhusiya")}`);
		if (fm.mood !== undefined && fm.mood !== "") lines.push(`mood: ${JSON.stringify(fm.mood)}`);
		if (fm.music !== undefined && fm.music !== "") lines.push(`music: ${JSON.stringify(fm.music)}`);
		if (fm.image) lines.push(`image: ${JSON.stringify(fm.image)}`);
		if (fm.imageAlt) lines.push(`imageAlt: ${JSON.stringify(fm.imageAlt)}`);
		if (fm.updated) lines.push(`updated: ${fm.updated}`);
		if (fm.canonical) lines.push(`canonical: ${JSON.stringify(fm.canonical)}`);
		if (fm.ogImage) lines.push(`ogImage: ${JSON.stringify(fm.ogImage)}`);

		if (topics.length > 0) {
			lines.push("topics:");
			for (const t of topics) {
				lines.push(`  - ${JSON.stringify(t)}`);
			}
		}

		lines.push("---");
		const newContent = lines.join("\n") + "\n" + parsed.body;
		fs.writeFileSync(filePath, newContent, "utf8");
		console.log(`[migrate] Migrated blog post: ${file}`);
	}
}

// 2. Migrate games.json
const gamesPath = path.resolve("src/_data/games.json");
if (fs.existsSync(gamesPath)) {
	const gamesData = JSON.parse(fs.readFileSync(gamesPath, "utf8"));
	if (Array.isArray(gamesData.items)) {
		gamesData.items = gamesData.items.map((item) => {
			const s = String(item.status || "").toLowerCase().trim();
			let newStatus = "playing";
			if (s.includes("play")) newStatus = "playing";
			else if (s.includes("complete")) newStatus = "completed";
			else if (s.includes("backlog")) newStatus = "backlog";
			else if (s.includes("hold")) newStatus = "on-hold";
			else if (s.includes("drop")) newStatus = "dropped";

			// Determine playingRightNow boolean
			const playingRightNow = Boolean(
				item.playingRightNow ||
				item.status === "Playing right now" ||
				(Array.isArray(item.tags) && item.tags.some(t => String(t).toLowerCase().includes("playing right now")))
			);

			// Clean up tags
			const newTags = Array.isArray(item.tags)
				? item.tags.filter(t => !String(t).toLowerCase().includes("playing right now"))
				: [];

			return {
				...item,
				playingRightNow,
				status: newStatus,
				tags: newTags
			};
		});
		fs.writeFileSync(gamesPath, JSON.stringify(gamesData, null, 2) + "\n", "utf8");
		console.log(`[migrate] Migrated games.json (${gamesData.items.length} items)`);
	}
}

// 3. Migrate books.json
const booksPath = path.resolve("src/_data/books.json");
if (fs.existsSync(booksPath)) {
	const booksData = JSON.parse(fs.readFileSync(booksPath, "utf8"));
	if (Array.isArray(booksData.items)) {
		booksData.items = booksData.items.map((item) => {
			let rating = item.rating;
			if (typeof rating === "string") {
				const numMatch = rating.match(/([0-9]+(?:\.[0-9]+)?)/);
				if (numMatch && !rating.toLowerCase().includes("not yet rated")) {
					rating = Math.round(parseFloat(numMatch[1]));
					if (rating < 1) rating = 1;
					if (rating > 5) rating = 5;
				} else {
					rating = undefined;
				}
			}

			let status = item.status || "currently-reading";
			const s = status.toLowerCase();
			if (s.includes("currently") || s.includes("reading")) status = "currently-reading";
			else if (s === "read" || s.includes("finished") || s.includes("completed")) status = "read";
			else if (s.includes("plan") || s.includes("to-read") || s.includes("want")) status = "to-read";

			const updated = { ...item, status };
			if (rating !== undefined) {
				updated.rating = rating;
			} else {
				delete updated.rating;
			}
			return updated;
		});
		fs.writeFileSync(booksPath, JSON.stringify(booksData, null, 2) + "\n", "utf8");
		console.log(`[migrate] Migrated books.json (${booksData.items.length} items)`);
	}
}

// 4. Migrate movies.json
const moviesPath = path.resolve("src/_data/movies.json");
if (fs.existsSync(moviesPath)) {
	const moviesData = JSON.parse(fs.readFileSync(moviesPath, "utf8"));
	function migrateMovieItem(item) {
		let rating = item.rating;
		if (typeof rating === "string") {
			const numMatch = rating.match(/([0-9]+(?:\.[0-9]+)?)/);
			if (numMatch) {
				rating = Math.round(parseFloat(numMatch[1]));
				if (rating < 1) rating = 1;
				if (rating > 5) rating = 5;
			} else {
				rating = undefined;
			}
		}

		let status = item.status || "watched";
		const s = status.toLowerCase();
		if (s.includes("currently") || s.includes("watching")) status = "currently-watching";
		else if (s.includes("watched") || s.includes("completed")) status = "watched";
		else if (s.includes("plan")) status = "plan-to-watch";

		const updated = { ...item, status };
		if (rating !== undefined) {
			updated.rating = rating;
		} else {
			delete updated.rating;
		}
		return updated;
	}

	if (Array.isArray(moviesData.movies)) {
		moviesData.movies = moviesData.movies.map(migrateMovieItem);
	}
	if (Array.isArray(moviesData.shows)) {
		moviesData.shows = moviesData.shows.map(migrateMovieItem);
	}
	fs.writeFileSync(moviesPath, JSON.stringify(moviesData, null, 2) + "\n", "utf8");
	console.log(`[migrate] Migrated movies.json`);
}

// 5. Migrate site.json
const sitePath = path.resolve("src/_data/site.json");
if (fs.existsSync(sitePath)) {
	const siteData = JSON.parse(fs.readFileSync(sitePath, "utf8"));
	if (siteData.author && siteData.author.resumeUrl !== undefined) {
		delete siteData.author.resumeUrl;
	}
	if (siteData.rightSidebar && Array.isArray(siteData.rightSidebar.items)) {
		siteData.rightSidebar.items = siteData.rightSidebar.items.map(item => {
			if (item.icon === "twitter") {
				return { ...item, icon: "x" };
			}
			return item;
		});
	}
	fs.writeFileSync(sitePath, JSON.stringify(siteData, null, 2) + "\n", "utf8");
	console.log(`[migrate] Migrated site.json`);
}

// 6. Migrate portfolioPage.json
const portfolioPagePath = path.resolve("src/_data/portfolioPage.json");
if (fs.existsSync(portfolioPagePath)) {
	const pData = JSON.parse(fs.readFileSync(portfolioPagePath, "utf8"));
	pData.showFilters = pData.showFilters !== undefined ? pData.showFilters : true;
	pData.emptyStateText = pData.emptyStateText || "There are no portfolio projects published yet. Check back soon!";
	pData.ctaText = pData.ctaText || "Get in touch »";
	pData.ctaUrl = pData.ctaUrl || "mailto:me@amitendu.me";
	fs.writeFileSync(portfolioPagePath, JSON.stringify(pData, null, 2) + "\n", "utf8");
	console.log(`[migrate] Migrated portfolioPage.json`);
}

console.log("[migrate] Migration completed successfully!");
