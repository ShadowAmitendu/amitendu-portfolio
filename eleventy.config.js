import markdownIt from "markdown-it";
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

export default function (eleventyConfig) {
	syncConfigIcons();
	eleventyConfig.on("eleventy.before", () => {
		syncConfigIcons();
	});
	eleventyConfig.addWatchTarget("src/assets/icons/");
	eleventyConfig.setLibrary("md", md);
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
	eleventyConfig.addFilter("resolveIcon", (url, label, explicitIcon) => {
		return resolveIcon(url, label, explicitIcon);
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
