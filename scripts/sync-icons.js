import fs from "node:fs";
import path from "node:path";

const iconsDir = path.resolve("src/assets/icons");
const configPath = path.resolve("src/admin/config.yml");
const publicConfigPath = path.resolve("public/admin/config.yml");

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

export function formatIconLabel(iconName) {
	if (knownLabels[iconName]) return knownLabels[iconName];
	return iconName
		.split(/[-_.]/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

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
