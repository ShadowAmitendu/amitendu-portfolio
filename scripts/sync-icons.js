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
	if (explicitIcon && available.includes(explicitIcon.toLowerCase())) {
		return explicitIcon.toLowerCase();
	}

	const urlLower = String(itemUrl || "").toLowerCase();
	const labelLower = String(itemLabel || "").toLowerCase();

	if (
		urlLower.includes("x.com") ||
		labelLower.includes("twitter") ||
		labelLower.includes("x (")
	) {
		if (available.includes("twitter")) return "twitter";
		if (available.includes("x")) return "x";
	}
	if (
		urlLower.startsWith("mailto:") ||
		labelLower.includes("email") ||
		labelLower.includes("mail")
	) {
		if (available.includes("mail")) return "mail";
	}

	for (const icon of available) {
		if (icon === "safari") continue;
		if (urlLower.includes(icon) || labelLower.includes(icon)) {
			return icon;
		}
	}

	return available.includes("safari") ? "safari" : available[0] || "safari";
}

export function syncConfigIcons() {
	if (!fs.existsSync(configPath)) return;

	const content = fs.readFileSync(configPath, "utf8");
	const available = getAvailableIcons().sort();

	let optionsYaml = `                    options:\n                      - { label: "Auto (Detect from URL/Label)", value: "" }`;
	for (const icon of available) {
		const label = formatIconLabel(icon);
		optionsYaml += `\n                      - { label: "${label}", value: "${icon}" }`;
	}

	const iconOptionsRegex =
		/(name:\s*["']icon["'][\s\S]*?options:\s*\n)(?:\s+-\s*\{[^\n]+\}\n?)+/;
	if (iconOptionsRegex.test(content)) {
		const updated = content.replace(
			iconOptionsRegex,
			`$1${optionsYaml.replace("                    options:\n", "")}\n`,
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
					`$1${optionsYaml.replace("                    options:\n", "")}\n`,
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
