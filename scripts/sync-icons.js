/**
 * @file scripts/sync-icons.js
 * @description Icon synchronization and resolution utility for retro 2007 macOS dock icons.
 * 
 * Responsibilities:
 * 1. Reads available icon assets in `src/assets/icons/macos-*.png|svg`.
 * 2. Provides URL domain and label heuristic resolution for right sidebar shortcuts (e.g. github.com -> github).
 * 3. Dynamically injects available icon select options into Decap CMS `config.yml`.
 */

import fs from "node:fs";
import path from "node:path";

const iconsDir = path.resolve("src/assets/icons");
const configPath = path.resolve("src/admin/config.yml");
const publicConfigPath = path.resolve("public/admin/config.yml");

/**
 * Friendly display labels for known social networks and application names.
 */
const knownLabels = {
	github: "GitHub",
	youtube: "YouTube",
	linkedin: "LinkedIn",
	twitter: "Twitter / X",
	x: "X (Twitter)",
	discord: "Discord",
	figma: "Figma",
	peerlist: "Peerlist",
	hashnode: "Hashnode",
	"dev.to": "DEV Community (dev.to)",
	devto: "DEV Community",
	masterji: "Masterji",
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
	medium: "Medium",
	twitch: "Twitch",
	facebook: "Facebook",
	threads: "Threads",
	dribbble: "Dribbble",
	behance: "Behance",
};

/**
 * Scans `src/assets/icons/` and returns an array of unique icon identifiers.
 * Extracts icon names from filenames following the `macos-{name}.(png|svg)` convention.
 * 
 * @returns {string[]} List of lowercase icon names (e.g. ["github", "safari", "x"]).
 */
export function getAvailableIcons() {
	if (!fs.existsSync(iconsDir)) return [];
	const files = fs.readdirSync(iconsDir);
	const icons = new Set();
	for (const file of files) {
		const match = file.match(/^macos-(.+)\.(png|svg)$/i);
		if (match) {
			icons.add(match[1].toLowerCase());
		}
	}
	return Array.from(icons);
}

/**
 * Returns a human-friendly capitalized label for an icon name.
 * 
 * @param {string} iconName - The raw icon key (e.g. "devto", "github").
 * @returns {string} Human-friendly label (e.g. "DEV Community", "GitHub").
 */
export function formatIconLabel(iconName) {
	if (knownLabels[iconName]) return knownLabels[iconName];
	return iconName
		.split(/[-_.]/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

/**
 * Resolves the most appropriate retro icon identifier for a shortcut or bookmark.
 * Prioritizes an explicit icon selection first, followed by URL domain heuristics, label name matches,
 * and finally falls back to the default "safari" compass icon.
 * 
 * @param {string} [itemUrl=""] - Bookmark destination URL (e.g. "https://github.com/ShadowAmitendu").
 * @param {string} [itemLabel=""] - Bookmark link text (e.g. "GitHub Profile").
 * @param {string} [explicitIcon=""] - Manually chosen icon override from CMS.
 * @returns {string} The resolved icon identifier.
 */
export function resolveIcon(itemUrl = "", itemLabel = "", explicitIcon = "") {
	const available = getAvailableIcons();
	const normalizedExplicit = (explicitIcon || "").toLowerCase().trim();
	if (normalizedExplicit === "twitter") {
		return "x";
	}
	if (normalizedExplicit && available.includes(normalizedExplicit)) {
		return normalizedExplicit;
	}

	const urlLower = String(itemUrl || "").toLowerCase();
	const labelLower = String(itemLabel || "").toLowerCase();

	if (
		urlLower.includes("x.com") ||
		urlLower.includes("twitter.com") ||
		labelLower.includes("twitter") ||
		labelLower.includes("x (") ||
		labelLower === "x"
	) {
		if (available.includes("x")) return "x";
		if (available.includes("twitter")) return "x";
	}
	if (
		urlLower.startsWith("mailto:") ||
		labelLower.includes("email") ||
		labelLower.includes("mail")
	) {
		if (available.includes("mail")) return "mail";
	}

	for (const icon of available) {
		if (icon === "safari" || icon === "twitter") continue;
		if (urlLower.includes(icon) || labelLower.includes(icon)) {
			return icon;
		}
	}

	return available.includes("safari") ? "safari" : available[0] || "safari";
}

export function syncConfigIcons() {
	if (!fs.existsSync(configPath)) return;

	const content = fs.readFileSync(configPath, "utf8");
	const available = getAvailableIcons().filter((i) => i !== "twitter").sort();

	let optionsYaml = `                    required: false\n                    options:`;
	for (const icon of available) {
		const label = formatIconLabel(icon);
		optionsYaml += `\n                      - { label: "${label}", value: "${icon}" }`;
	}

	const iconOptionsRegex =
		/(-\s*label:\s*["']Website Icon["'][\s\S]*?name:\s*["']icon["'][\s\S]*?widget:\s*["']select["'][\s\S]*?)(?:required:\s*(?:true|false)\s*\n\s*)?options:\s*\n(?:\s+-\s*\{[^\n]+\}\n?)+/;
	if (iconOptionsRegex.test(content)) {
		const updated = content.replace(
			iconOptionsRegex,
			`$1${optionsYaml}\n`,
		);
		if (updated !== content) {
			fs.writeFileSync(configPath, updated, "utf8");
			console.log(
				`[sync-icons] Updated ${configPath} with ${available.length} icons.`,
			);
		}
		if (fs.existsSync(publicConfigPath)) {
			const publicContent = fs.readFileSync(publicConfigPath, "utf8");
			if (iconOptionsRegex.test(publicContent)) {
				const publicUpdated = publicContent.replace(
					iconOptionsRegex,
					`$1${optionsYaml}\n`,
				);
				if (publicUpdated !== publicContent) {
					fs.writeFileSync(publicConfigPath, publicUpdated, "utf8");
					console.log(`[sync-icons] Updated ${publicConfigPath}.`);
				}
			}
		}
	}
}

// If executed directly from CLI
if (
	process.argv[1] &&
	process.argv[1].replace(/\\/g, "/").endsWith("scripts/sync-icons.js")
) {
	syncConfigIcons();

	if (process.argv.includes("--watch")) {
		console.log(`[sync-icons] Watching ${iconsDir} for new icons...`);
		let debounceTimer = null;
		fs.watch(iconsDir, (eventType, filename) => {
			if (!filename) return;
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				console.log(
					`[sync-icons] Detected change in icons directory (${filename}). Syncing...`,
				);
				syncConfigIcons();
			}, 150);
		});
	}
}
