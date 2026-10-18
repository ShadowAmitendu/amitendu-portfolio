/**
 * @file eleventy.config.js
 * @description Primary Eleventy (11ty) configuration file for Amitendu Bikash Dhusiya's personal website.
 * 
 * Orchestrates:
 * 1. Markdown Parsing: Custom `markdown-it` rules for auto-target blank links and lightbox-enabled figures with captions.
 * 2. Image Optimization: Responsive WebP generation via `@11ty/eleventy-img` with automatic fallback.
 * 3. CMS Shortcodes: Visual callouts, responsive YouTube embeds, and lightbox figures usable in Decap CMS.
 * 4. Custom Filters: Resolving retro icons, skill badges, rating stars, reading times, and date formats.
 * 5. Content Collections: Sorting and draft-filtering for blog posts, portfolio items, favorites, and recent updates.
 * 6. Passthrough Copies: Assets, uploaded images, and Decap CMS admin files to the `public/` distribution directory.
 * 
 * @see https://www.11ty.dev/docs/config/
 */

import path from "node:path";
import fs from "node:fs";
import markdownIt from "markdown-it";
import Image from "@11ty/eleventy-img";
import { syncConfigIcons, resolveIcon } from "./scripts/sync-icons.js";

// Automatically synchronize retro icons across the Decap CMS config on server startup
syncConfigIcons();

/**
 * Configure markdown-it parser with HTML support, automatic line breaks, and URL linkification.
 */
const md = markdownIt({ html: true, breaks: true, linkify: true });

/**
 * Fallback to default link renderer rule.
 */
const defaultLinkRender =
	md.renderer.rules.link_open ||
	function (tokens, idx, options, env, self) {
		return self.renderToken(tokens, idx, options);
	};

/**
 * Markdown link renderer rule override.
 * Automatically adds target="_blank" and rel="noopener noreferrer" to external HTTP/HTTPS links and email links
 * to ensure secure, new-tab navigation while keeping internal links in the same tab.
 */
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

/**
 * Fallback to default image renderer rule.
 */
const defaultImageRender =
	md.renderer.rules.image ||
	function (tokens, idx, options, env, self) {
		return self.renderToken(tokens, idx, options);
	};

/**
 * Markdown image renderer rule override.
 * Wraps Markdown images into `<figure>` elements with a clickable zoom trigger for the lightbox script
 * and an optional bottom `<figcaption>` displaying image titles or alt text.
 */
md.renderer.rules.image = function (tokens, idx, options, env, self) {
	const token = tokens[idx];
	const srcIndex = token.attrIndex("src");
	const titleIndex = token.attrIndex("title");
	const alt = token.content || "";
	const src = srcIndex >= 0 ? token.attrs[srcIndex][1] : "";
	const title = titleIndex >= 0 ? token.attrs[titleIndex][1] : "";
	const captionText = title || alt;

	const captionHtml = captionText
		? `<figcaption class="site-image-caption mt-1.5 text-center text-xs italic text-[#556b78] border-t border-dashed border-[#b7cbd6] pt-1.5">${md.utils.escapeHtml(captionText)}</figcaption>`
		: "";

	return `<figure class="site-image-figure my-5 text-center">
  <a class="site-lightbox-trigger inline-block cursor-zoom-in" href="${md.utils.escapeHtml(src)}" data-lightbox="true" data-caption="${md.utils.escapeHtml(captionText)}" title="${md.utils.escapeHtml(captionText || "Click to view full image")}">
    <img src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(alt)}" class="site-entry-image block mx-auto max-w-full h-auto" />
  </a>
  ${captionHtml}
</figure>`;
};

/**
 * Responsive Image Optimization Shortcode.
 * Generates modern responsive WebP formats at 480px, 800px, and 1600px widths using `@11ty/eleventy-img`.
 * Safely passes through vector formats (SVG) and animations (GIF) without alteration.
 * 
 * @param {string} src - Relative or absolute image path (e.g. "/images/my-photo.jpg").
 * @param {string} [alt=""] - Alternative text for accessibility and SEO.
 * @param {string} [className=""] - Custom CSS class string to apply to the generated <img> element.
 * @param {string} [sizes="100vw"] - CSS responsive sizes attribute.
 * @param {string} [loading="lazy"] - Native loading strategy ("lazy" or "eager").
 * @returns {Promise<string>} HTML `<picture>` or `<img>` tag string.
 */
async function imageShortcode(src, alt = "", className = "", sizes = "100vw", loading = "lazy") {
	if (!src) return "";
	if (src.endsWith(".svg") || src.endsWith(".ico") || src.endsWith(".gif")) {
		return `<img src="${src}" alt="${alt || ""}" class="${className}" loading="${loading}" />`;
	}

	let fullSrc = src;
	if (src.startsWith("/")) {
		fullSrc = path.join("src", src);
		if (!fs.existsSync(fullSrc)) {
			fullSrc = path.join("public", src);
		}
	}
	if (!fs.existsSync(fullSrc)) {
		return `<img src="${src}" alt="${alt || ""}" class="${className}" loading="${loading}" />`;
	}

	try {
		const metadata = await Image(fullSrc, {
			widths: [480, 800, 1600],
			formats: ["webp"],
			outputDir: "./public/images/optimized/",
			urlPath: "/images/optimized/",
			filenameFormat: function (id, srcPath, width, format) {
				const ext = path.extname(srcPath);
				const name = path.basename(srcPath, ext);
				return `${name}-${width}w.${format}`;
			},
		});

		const imageAttributes = {
			alt: alt || "",
			sizes: sizes || "(max-width: 800px) 100vw, 800px",
			loading: loading || "lazy",
			decoding: "async",
			class: className || "",
		};

		return Image.generateHTML(metadata, imageAttributes);
	} catch (err) {
		console.warn("[eleventy-img] Failed to optimize", src, err.message);
		return `<img src="${src}" alt="${alt || ""}" class="${className}" loading="${loading}" />`;
	}
}

/**
 * Primary Eleventy configuration export.
 * Defines project build lifecycle, filters, shortcodes, and collections.
 * 
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig - The Eleventy configuration API instance.
 * @returns {object} Configuration options specifying source, include, and output directories.
 */
export default function (eleventyConfig) {
	// Prevent unnecessary rebuild loops when scripts update generated manifests or optimized images
	eleventyConfig.watchIgnores.add("scripts/**");
	eleventyConfig.watchIgnores.add("src/images/**");

	// Initial icon synchronization & pre-build hook
	syncConfigIcons();
	eleventyConfig.on("eleventy.before", () => {
		syncConfigIcons();
	});

	// Watch custom retro icon directory and bind custom markdown-it instance
	eleventyConfig.addWatchTarget("src/assets/icons/");
	eleventyConfig.setLibrary("md", md);

	// Register responsive image optimization shortcode
	eleventyConfig.addAsyncShortcode("image", imageShortcode);

	/**
	 * Shortcode: `callout`
	 * Renders styled retro callout notification boxes (info, alert/note, success/tip).
	 * Useful in markdown blog posts and editable via Decap CMS.
	 * 
	 * @example {% callout "info", "Remember to drink water!" %}
	 */
	eleventyConfig.addShortcode("callout", (type = "info", text = "") => {
		const typeLower = String(type || "info").toLowerCase();
		const styles = {
			info: "border-[#789bb0] bg-[#e6f2f8] text-[#164b70]",
			alert: "border-[#d4a017] bg-[#fff8e1] text-[#5d4037]",
			success: "border-[#66bb6a] bg-[#e8f5e9] text-[#1b5e20]",
		};
		const badgeStyles = {
			info: "border-[#789bb0] bg-[#d0e5f2] text-[#164b70]",
			alert: "border-[#d4a017] bg-[#ffecb3] text-[#795548]",
			success: "border-[#66bb6a] bg-[#c8e6c9] text-[#2e7d32]",
		};
		const boxClass = styles[typeLower] || styles.info;
		const badgeClass = badgeStyles[typeLower] || badgeStyles.info;
		const label = typeLower === "alert" ? "NOTE" : typeLower === "success" ? "TIP" : "INFO";

		return `<aside class="my-4 border px-3.5 py-2.5 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.06)] flex items-start gap-2.5 ${boxClass}">
  <span class="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 border select-none shrink-0 ${badgeClass}">${label}</span>
  <div class="leading-relaxed flex-1">${md.renderInline(text || "")}</div>
</aside>`;
	});

	/**
	 * Shortcode: `youtube`
	 * Embeds a responsive, privacy-friendly (youtube-nocookie) 16:9 video player.
	 * 
	 * @example {% youtube "dQw4w9WgXcQ", "Never Gonna Give You Up" %}
	 */
	eleventyConfig.addShortcode("youtube", (id = "", title = "YouTube video player") => {
		const videoId = String(id || "").trim();
		if (!videoId) return "";
		return `<div class="site-video-container my-5 relative aspect-video w-full overflow-hidden border border-[#b2c2cc] bg-black shadow-[2px_2px_0_#cad6de]">
  <iframe class="absolute inset-0 h-full w-full border-0" src="https://www.youtube-nocookie.com/embed/${videoId}" title="${md.utils.escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>`;
	});

	/**
	 * Shortcode: `figure`
	 * Embeds an image wrapped in a clickable zoom anchor for the lightbox with an optional caption.
	 * 
	 * @example {% figure "/images/retro-setup.jpg", "My Desktop", "Windows Aero Workspace in 2007" %}
	 */
	eleventyConfig.addShortcode("figure", (src = "", alt = "", caption = "") => {
		const captionText = caption || alt || "";
		const captionHtml = captionText
			? `<figcaption class="site-image-caption mt-1.5 text-center text-xs italic text-[#556b78] border-t border-dashed border-[#b7cbd6] pt-1.5">${md.utils.escapeHtml(captionText)}</figcaption>`
			: "";
		return `<figure class="site-image-figure my-5 text-center">
  <a class="site-lightbox-trigger inline-block cursor-zoom-in" href="${md.utils.escapeHtml(src)}" data-lightbox="true" data-caption="${md.utils.escapeHtml(captionText)}" title="${md.utils.escapeHtml(captionText || "Click to view full image")}">
    <img src="${md.utils.escapeHtml(src)}" alt="${md.utils.escapeHtml(alt)}" class="site-entry-image block mx-auto max-w-full h-auto" />
  </a>
  ${captionHtml}
</figure>`;
	});

	/**
	 * Passthrough file copies: Transfers static assets, uploaded images, Decap admin UI,
	 * and root-level files (robots.txt, favicon, sitemap) directly to the `public/` directory.
	 */
	eleventyConfig.addPassthroughCopy("src/assets");
	eleventyConfig.addPassthroughCopy({ "src/images": "images" });
	eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
	eleventyConfig.addPassthroughCopy({ "src/static": "/" });

	/**
	 * Filter: `resolveIcon`
	 * Resolves shortcut URL domains (e.g. github.com, x.com, youtube.com) to corresponding retro icon identifiers.
	 */
	eleventyConfig.addFilter("resolveIcon", (url, label, explicitIcon) => {
		return resolveIcon(url, label, explicitIcon);
	});

	/**
	 * Filter: `skillIcon`
	 * Maps programming languages, technologies, and database names to SVG filenames in `src/assets/icons/skills/`.
	 */
	eleventyConfig.addFilter("skillIcon", (skillName = "") => {
		const map = {
			html: "html.svg",
			html5: "html.svg",
			css: "css.svg",
			css3: "css.svg",
			javascript: "javascript.svg",
			js: "javascript.svg",
			angular: "angular.svg",
			angularjs: "angular.svg",
			react: "react.svg",
			reactjs: "react.svg",
			markdown: "markdown.svg",
			md: "markdown.svg",
			java: "java.svg",
			python: "python.svg",
			c: "c.svg",
			cpp: "c.svg",
			"c++": "c.svg",
			php: "php.svg",
			mysql: "mysql.svg",
			"oracle sql plus": "oracle.svg",
			"oracle sql": "oracle.svg",
			oracle: "oracle.svg",
			sql: "oracle.svg",
			plsql: "oracle.svg",
			typescript: "typescript.svg",
			ts: "typescript.svg",
		};
		const key = String(skillName || "").toLowerCase().trim();
		return map[key] || "";
	});

	/**
	 * Filter: `ratingStars`
	 * Converts numeric ratings (1 to 5) into Unicode star characters (e.g. 4 -> "★★★★☆").
	 */
	eleventyConfig.addFilter("ratingStars", (rating) => {
		const r = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));
		if (!r) return "";
		return "★".repeat(r) + "☆".repeat(5 - r);
	});

	/**
	 * Filter: `filterByStatus`
	 * Filters reading list or shelf items by reading status ("currently-reading", "read", "to-read").
	 */
	eleventyConfig.addFilter("filterByStatus", (items = [], statusKey = "") => {
		if (!Array.isArray(items)) return [];
		const key = String(statusKey || "").toLowerCase().trim();
		if (key === "reading" || key === "currently-reading") {
			return items.filter((b) => b && (b.status === "currently-reading" || b.status === "reading"));
		}
		if (key === "read" || key === "completed" || key === "finished") {
			return items.filter((b) => b && (b.status === "read" || b.status === "completed" || b.status === "finished"));
		}
		if (key === "to-read" || key === "plan-to-read" || key === "wishlist") {
			return items.filter((b) => b && (b.status === "to-read" || b.status === "plan-to-read" || b.status === "wishlist"));
		}
		return items.filter((b) => b && b.status === key);
	});

	/**
	 * Filter: `readingTime`
	 * Calculates estimated article reading time in minutes based on average 200 words-per-minute speed.
	 */
	eleventyConfig.addFilter("readingTime", (content) => {
		const text = String(content || "").replace(/<[^>]*>/g, " ");
		const words = text.trim().split(/\s+/).filter(Boolean).length;
		const minutes = Math.max(1, Math.ceil(words / 200));
		return minutes;
	});

	/**
	 * Filter: `markdown`
	 * Renders raw markdown strings into clean HTML using the configured markdown-it parser.
	 */
	eleventyConfig.addFilter("markdown", (content) => {
		return md.render(content || "");
	});

	/**
	 * Filter: `isoDate`
	 * Converts date values to standardized YYYY-MM-DD ISO format for sitemaps and machine consumption.
	 */
	eleventyConfig.addFilter("isoDate", (value) => {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
	});

	/**
	 * Filter: `shortDate`
	 * Formats dates into human-readable US English format (e.g. "Oct 18, 2026").
	 */
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

	/**
	 * Filter: `safeId`
	 * Sanitizes arbitrary text or post titles into valid HTML id attribute strings.
	 */
	eleventyConfig.addFilter("safeId", (value) => {
		const slug = String(value || "post");
		const cleaned = slug.replace(/[^a-zA-Z0-9_]/g, "_");
		return /^[a-zA-Z_]/.test(cleaned) ? cleaned : `post_${cleaned}`;
	});

	// Global data variable for current build timestamp
	eleventyConfig.addGlobalData("buildDate", () => new Date());

	/**
	 * Shortcode: `currentYear`
	 * Renders the 4-digit current year (e.g. 2026) for copyright statements.
	 */
	eleventyConfig.addShortcode(
		"currentYear",
		() => `${new Date().getFullYear()}`,
	);

	/**
	 * Helper function to determine if a content item is flagged as a draft.
	 */
	const isDraft = (item) => {
		if (item.data.draft === true) return true;
		const tags = item.data.tags;
		if (Array.isArray(tags)) return tags.includes("draft");
		if (typeof tags === "string") return tags === "draft";
		return false;
	};

	/**
	 * Helper function to exclude drafts from public site listings.
	 */
	const shouldExcludeDraft = (item) => {
		const draft = isDraft(item);
		if (process.env.NODE_ENV === "production") {
			return draft;
		}
		return draft;
	};

	/**
	 * Helper function to verify if an item belongs to the blog post collection.
	 */
	const isBlogPost = (item) => {
		const tags = item.data.tags;
		if (Array.isArray(tags))
			return tags.includes("blog") || tags.includes("post");
		if (typeof tags === "string") return tags === "blog" || tags === "post";
		return item.data.layout === "post.njk";
	};

	/**
	 * Helper function to verify if an item belongs to the portfolio projects collection.
	 */
	const isPortfolioProject = (item) => {
		const tags = item.data.tags;
		if (Array.isArray(tags)) return tags.includes("portfolio");
		if (typeof tags === "string") return tags === "portfolio";
		return false;
	};

	/**
	 * Helper function to verify if an item is starred/favorited for the sidebar favorites widget.
	 */
	const isFav = (item) => {
		if (item.data.featured === true) return true;
		const tags = item.data.tags;
		if (Array.isArray(tags)) return tags.includes("fav");
		if (typeof tags === "string") return tags === "fav";
		return false;
	};

	/**
	 * Collection: `blog`
	 * All published blog posts sorted by date descending (newest first).
	 */
	eleventyConfig.addCollection("blog", (collectionApi) =>
		collectionApi
			.getAll()
			.filter((item) => isBlogPost(item) && !shouldExcludeDraft(item))
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
	);

	/**
	 * Collection: `portfolio`
	 * All published portfolio projects sorted by custom `order` field, then date descending.
	 */
	eleventyConfig.addCollection("portfolio", (collectionApi) =>
		collectionApi
			.getAll()
			.filter((item) => isPortfolioProject(item) && !shouldExcludeDraft(item))
			.sort((a, b) => {
				const orderA = a.data.order !== undefined && a.data.order !== null ? a.data.order : 100;
				const orderB = b.data.order !== undefined && b.data.order !== null ? b.data.order : 100;
				if (orderA !== orderB) return orderA - orderB;
				return new Date(b.data.date || 0) - new Date(a.data.date || 0);
			}),
	);

	/**
	 * Collection: `fav`
	 * Curated favorite items featured in the left sidebar widget.
	 */
	eleventyConfig.addCollection("fav", (collectionApi) =>
		collectionApi
			.getAll()
			.filter((item) => isFav(item) && !shouldExcludeDraft(item))
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
	);

	/**
	 * Collection: `updates`
	 * Combined chronological feed of all blog posts and portfolio projects.
	 */
	eleventyConfig.addCollection("updates", (collectionApi) =>
		collectionApi
			.getAll()
			.filter(
				(item) =>
					(isBlogPost(item) || isPortfolioProject(item)) && !shouldExcludeDraft(item),
			)
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0))
	);

	/**
	 * Local development server configuration.
	 */
	eleventyConfig.setServerOptions({
		port: 8080,
	});

	/**
	 * Directory configuration:
	 * - input: `src` (source templates, markdown, and assets)
	 * - output: `public` (production static site output)
	 * - includes: `_includes` (Nunjucks layouts, partials, and components)
	 */
	return {
		dir: {
			input: "src",
			output: "public",
			includes: "_includes",
		},
	};
}
