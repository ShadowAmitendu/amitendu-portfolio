import fs from "node:fs";
import path from "node:path";

const HOST = "amitendu.me";
const KEY = "f5c6b98e721a48c4842e19d7a31b6728";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP_PATH = path.resolve("public/sitemap.xml");

async function submitIndexNow() {
	console.log(`[IndexNow] Reading canonical URLs from ${SITEMAP_PATH}...`);
	if (!fs.existsSync(SITEMAP_PATH)) {
		console.error(`[IndexNow] Error: sitemap not found at ${SITEMAP_PATH}. Run 'npm run build' first.`);
		process.exit(1);
	}

	const sitemapXml = fs.readFileSync(SITEMAP_PATH, "utf8");
	const matches = sitemapXml.match(/<loc>(.*?)<\/loc>/g) || [];
	const urls = matches.map((m) => m.replace(/<\/?loc>/g, "").trim()).filter(Boolean);

	if (urls.length === 0) {
		console.error("[IndexNow] Error: No URLs found in sitemap.");
		process.exit(1);
	}

	console.log(`[IndexNow] Found ${urls.length} canonical URLs to submit to Bing & IndexNow:`);
	urls.forEach((u) => console.log(`  - ${u}`));

	const payload = {
		host: HOST,
		key: KEY,
		keyLocation: KEY_LOCATION,
		urlList: urls,
	};

	const endpoints = [
		"https://api.indexnow.org/indexnow",
		"https://www.bing.com/indexnow",
	];

	for (const endpoint of endpoints) {
		try {
			console.log(`[IndexNow] Submitting payload to ${endpoint}...`);
			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
				body: JSON.stringify(payload),
			});

			console.log(`[IndexNow] Response from ${endpoint}: ${response.status} ${response.statusText}`);
			if (response.status === 200 || response.status === 202) {
				console.log(`[IndexNow] SUCCESS: URLs queued for immediate crawling by Bing.`);
			} else {
				const body = await response.text();
				console.warn(`[IndexNow] Notice: ${body}`);
			}
		} catch (err) {
			console.error(`[IndexNow] Failed to ping ${endpoint}:`, err.message);
		}
	}
}

submitIndexNow();
