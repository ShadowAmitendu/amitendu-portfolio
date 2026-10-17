import path from "node:path";
import fs from "node:fs";
import markdownIt from "markdown-it";
import Image from "@11ty/eleventy-img";
import { syncConfigIcons, resolveIcon } from "./scripts/sync-icons.js";

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

// Render markdown images as lightbox-enabled figures with bottom title caption
const defaultImageRender =
	md.renderer.rules.image ||
	function (tokens, idx, options, env, self) {
		return self.renderToken(tokens, idx, options);
	};

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

// Image optimization with @11ty/eleventy-img (WebP, widths 480/800/1600, strip metadata)
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

export default function (eleventyConfig) {
	eleventyConfig.watchIgnores.add("scripts/**");
	eleventyConfig.watchIgnores.add("src/images/**");

	syncConfigIcons();
	eleventyConfig.on("eleventy.before", () => {
		syncConfigIcons();
	});
	eleventyConfig.addWatchTarget("src/assets/icons/");
	eleventyConfig.setLibrary("md", md);

	// Image shortcode
	eleventyConfig.addAsyncShortcode("image", imageShortcode);

	// Editor shortcodes (callout, youtube, figure)
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

	eleventyConfig.addShortcode("youtube", (id = "", title = "YouTube video player") => {
		const videoId = String(id || "").trim();
		if (!videoId) return "";
		return `<div class="site-video-container my-5 relative aspect-video w-full overflow-hidden border border-[#b2c2cc] bg-black shadow-[2px_2px_0_#cad6de]">
  <iframe class="absolute inset-0 h-full w-full border-0" src="https://www.youtube-nocookie.com/embed/${videoId}" title="${md.utils.escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>`;
	});

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

	eleventyConfig.addPassthroughCopy("src/assets");
	eleventyConfig.addPassthroughCopy({ "src/images": "images" });
	eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
	eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
	eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
	eleventyConfig.addPassthroughCopy({ "src/favicon-16.png": "favicon-16.png" });
	eleventyConfig.addPassthroughCopy({ "src/favicon-32.png": "favicon-32.png" });
	eleventyConfig.addPassthroughCopy({ "src/favicon-48.png": "favicon-48.png" });
	eleventyConfig.addPassthroughCopy({ "src/favicon-96.png": "favicon-96.png" });
	eleventyConfig.addPassthroughCopy({ "src/favicon-192.png": "favicon-192.png" });
	eleventyConfig.addPassthroughCopy({ "src/favicon-512.png": "favicon-512.png" });
	eleventyConfig.addPassthroughCopy({ "src/apple-touch-icon.png": "apple-touch-icon.png" });
	eleventyConfig.addPassthroughCopy({ "src/site.webmanifest": "site.webmanifest" });
	eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
	eleventyConfig.addPassthroughCopy({ "src/f5c6b98e721a48c4842e19d7a31b6728.txt": "f5c6b98e721a48c4842e19d7a31b6728.txt" });

	eleventyConfig.addFilter("resolveIcon", (url, label, explicitIcon) => {
		return resolveIcon(url, label, explicitIcon);
	});
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
	eleventyConfig.addFilter("ratingStars", (rating) => {
		const r = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));
		if (!r) return "";
		return "★".repeat(r) + "☆".repeat(5 - r);
	});
	eleventyConfig.addFilter("readingTime", (content) => {
		const text = String(content || "").replace(/<[^>]*>/g, " ");
		const words = text.trim().split(/\s+/).filter(Boolean).length;
		const minutes = Math.max(1, Math.ceil(words / 200));
		return minutes;
	});
	eleventyConfig.addFilter("markdown", (content) => {
		return md.render(content || "");
	});
	eleventyConfig.addFilter("isoDate", (value) => {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
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
		if (item.data.draft === true) return true;
		const tags = item.data.tags;
		if (Array.isArray(tags)) return tags.includes("draft");
		if (typeof tags === "string") return tags === "draft";
		return false;
	};

	const shouldExcludeDraft = (item) => {
		const draft = isDraft(item);
		if (process.env.NODE_ENV === "production") {
			return draft;
		}
		return draft;
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
		if (item.data.featured === true) return true;
		const tags = item.data.tags;
		if (Array.isArray(tags)) return tags.includes("fav");
		if (typeof tags === "string") return tags === "fav";
		return false;
	};

	eleventyConfig.addCollection("blog", (collectionApi) =>
		collectionApi
			.getAll()
			.filter((item) => isBlogPost(item) && !shouldExcludeDraft(item))
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
	);
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
	eleventyConfig.addCollection("fav", (collectionApi) =>
		collectionApi
			.getAll()
			.filter((item) => isFav(item) && !shouldExcludeDraft(item))
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
	);
	eleventyConfig.addCollection("updates", (collectionApi) =>
		collectionApi
			.getAll()
			.filter(
				(item) =>
					(isBlogPost(item) || isPortfolioProject(item)) && !shouldExcludeDraft(item),
			)
			.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0))
	);

	eleventyConfig.setServerOptions({
		port: 8080,
	});

	return {
		dir: {
			input: "src",
			output: "public",
			includes: "_includes",
		},
	};
}
