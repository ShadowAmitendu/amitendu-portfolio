import fs from "node:fs";
import path from "node:path";
import markdownIt from "markdown-it";

function getAvailableIcons() {
	const iconsDir = path.resolve("src/assets/icons");
	if (!fs.existsSync(iconsDir)) return [];
	const files = fs.readdirSync(iconsDir);
	const icons = new Set();
	for (const file of files) {
		const match = file.match(/^macos-([a-z0-9_-]+)\.(png|svg)$/i);
		if (match) {
			icons.add(match[1].toLowerCase());
		}
	}
	return Array.from(icons);
}

function resolveIcon(itemUrl = "", itemLabel = "", explicitIcon = "") {
	const available = getAvailableIcons();
	if (explicitIcon && available.includes(explicitIcon.toLowerCase())) {
		return explicitIcon.toLowerCase();
	}

	const urlLower = String(itemUrl || "").toLowerCase();
	const labelLower = String(itemLabel || "").toLowerCase();

	if (urlLower.includes("x.com") || labelLower.includes("twitter") || labelLower.includes("x (")) {
		if (available.includes("twitter")) return "twitter";
		if (available.includes("x")) return "x";
	}
	if (urlLower.startsWith("mailto:") || labelLower.includes("email") || labelLower.includes("mail")) {
		if (available.includes("mail")) return "mail";
	}

	for (const icon of available) {
		if (icon === "safari") continue;
		if (urlLower.includes(icon) || labelLower.includes(icon)) {
			return icon;
		}
	}

	return available.includes("safari") ? "safari" : (available[0] || "safari");
}

function formatIconLabel(iconName) {
	const knownLabels = {
		github: "GitHub",
		youtube: "YouTube",
		linkedin: "LinkedIn",
		twitter: "Twitter / X",
		x: "X (Twitter)",
		discord: "Discord",
		figma: "Figma",
		peerlist: "Peerlist",
		safari: "Safari / Web",
		mail: "Apple Mail",
		terminal: "Terminal",
		finder: "Finder",
		notes: "Notes",
		steam: "Steam",
		spotify: "Spotify",
		slack: "Slack",
		reddit: "Reddit",
		instagram: "Instagram",
		twitch: "Twitch",
		facebook: "Facebook",
		threads: "Threads",
		dribbble: "Dribbble",
		behance: "Behance",
	};
	if (knownLabels[iconName]) return knownLabels[iconName];
	return iconName.charAt(0).toUpperCase() + iconName.slice(1);
}

function syncConfigIcons() {
	const configPath = path.resolve("src/admin/config.yml");
	if (!fs.existsSync(configPath)) return;

	const content = fs.readFileSync(configPath, "utf8");
	const available = getAvailableIcons().sort();

	let optionsYaml = `                    options:\n                      - { label: "Auto (Detect from URL/Label)", value: "" }`;
	for (const icon of available) {
		const label = formatIconLabel(icon);
		optionsYaml += `\n                      - { label: "${label}", value: "${icon}" }`;
	}

	const iconOptionsRegex = /(name:\s*["']icon["'][\s\S]*?options:\s*\n)(?:\s+-\s*\{[^\n]+\}\n?)+/;
	if (iconOptionsRegex.test(content)) {
		const updated = content.replace(iconOptionsRegex, `$1${optionsYaml.replace("                    options:\n", "")}\n`);
		if (updated !== content) {
			fs.writeFileSync(configPath, updated, "utf8");
		}
	}
}

// Automatically sync config.yml on startup
syncConfigIcons();

const md = markdownIt({ html: true, breaks: true, linkify: true });

const defaultLinkRender =
	md.renderer.rules.link_open ||
	function (tokens, idx, options, env, self) {
		return self.renderToken(tokens, idx, options);
	};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
	const hrefIndex = tokens[idx].attrIndex("href");
	if (hrefIndex >= 0) {
		const href = tokens[idx].attrs[hrefIndex][1];
		if (/^(https?:)?\/\//i.test(href) || href.startsWith("mailto:")) {
			tokens[idx].attrSet("target", "_blank");
			tokens[idx].attrSet("rel", "noopener noreferrer");
		}
	}
	return defaultLinkRender(tokens, idx, options, env, self);
};

export default function (eleventyConfig) {
	syncConfigIcons();
	eleventyConfig.on("eleventy.before", () => {
		syncConfigIcons();
	});
	eleventyConfig.setLibrary("md", md);
	eleventyConfig.addPassthroughCopy("src/assets");
	eleventyConfig.addPassthroughCopy({ "src/images": "images" });
	eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
	eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
	eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
	eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
	eleventyConfig.addFilter("resolveIcon", (url, label, explicitIcon) => {
		return resolveIcon(url, label, explicitIcon);
	});
	eleventyConfig.addFilter("markdown", (content) => {
		return md.render(content || "");
	});
	eleventyConfig.addFilter("isoDate", (value) => {
		const date = new Date(value);
		return Number.isNaN(date.getTime())
			? ""
			: date.toISOString().split("T")[0];
	});
	eleventyConfig.addFilter("shortDate", (value) => {
		const date = new Date(value);
		return Number.isNaN(date.getTime())
			? value
			: new Intl.DateTimeFormat("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
				}).format(date);
	});
	eleventyConfig.addFilter("safeId", (value) => {
		const slug = String(value || "post");
		const cleaned = slug.replace(/[^a-zA-Z0-9_]/g, "_");
		return /^[a-zA-Z_]/.test(cleaned) ? cleaned : `post_${cleaned}`;
	});
	eleventyConfig.addGlobalData("buildDate", () => new Date());
	eleventyConfig.addShortcode(
		"currentYear",
		() => `${new Date().getFullYear()}`,
	);
	const isDraft = (item) => {
		if (item.data.draft) return true;
		const tags = item.data.tags;
		if (Array.isArray(tags)) return tags.includes("draft");
		if (typeof tags === "string") return tags === "draft";
		return false;
	};

	const isBlogPost = (item) => {
		const tags = item.data.tags;
		if (Array.isArray(tags))
			return tags.includes("blog") || tags.includes("post");
		if (typeof tags === "string") return tags === "blog" || tags === "post";
		return item.data.layout === "post.njk";
	};

	const isPortfolioProject = (item) => {
		const tags = item.data.tags;
		if (Array.isArray(tags)) return tags.includes("portfolio");
		if (typeof tags === "string") return tags === "portfolio";
		return false;
	};

	const isFav = (item) => {
		const tags = item.data.tags;
		if (Array.isArray(tags)) return tags.includes("fav");
		if (typeof tags === "string") return tags === "fav";
		return false;
	};

	eleventyConfig.addCollection("blog", (collectionApi) =>
		collectionApi
			.getAll()
			.filter((item) => isBlogPost(item) && !isDraft(item))
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
	);
	eleventyConfig.addCollection("portfolio", (collectionApi) =>
		collectionApi
			.getAll()
			.filter((item) => isPortfolioProject(item) && !isDraft(item))
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
	);
	eleventyConfig.addCollection("fav", (collectionApi) =>
		collectionApi
			.getAll()
			.filter((item) => isFav(item) && !isDraft(item))
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
	);
	eleventyConfig.addCollection("updates", (collectionApi) =>
		collectionApi
			.getAll()
			.filter(
				(item) =>
					(isBlogPost(item) || isPortfolioProject(item)) && !isDraft(item),
			)
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
	);

	return {
		dir: {
			input: "src",
			output: "public",
			includes: "_includes",
		},
	};
}
