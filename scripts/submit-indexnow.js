import fs from "fs";

const HOST = "amitendu.me";
const KEY = "f5c6b98e721a48c4842e19d7a31b6728";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP_PATH = "./public/sitemap.xml";

async function submitToIndexNow() {
	console.log(`[IndexNow] Preparing Bing/Copilot IndexNow submission for ${HOST}...`);

	if (!fs.existsSync(SITEMAP_PATH)) {
		console.error(`[IndexNow] Error: ${SITEMAP_PATH} not found. Please run 'npm run build' first.`);
		process.exit(1);
	}

	const sitemap = fs.readFileSync(SITEMAP_PATH, "utf-8");
	const matches = sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g);
	const urlList = Array.from(matches, (m) => m[1]);

	if (urlList.length === 0) {
		console.warn("[IndexNow] No URLs found in sitemap.xml");
		return;
	}

	console.log(`[IndexNow] Discovered ${urlList.length} canonical URLs to submit.`);

	const payload = {
		host: HOST,
		key: KEY,
		keyLocation: KEY_LOCATION,
		urlList: urlList,
	};

	try {
		const response = await fetch("https://api.indexnow.org/indexnow", {
			method: "POST",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
			body: JSON.stringify(payload),
		});

		if (response.status === 200 || response.status === 202) {
			console.log(`[IndexNow] Success (${response.status})! Bing and Copilot have been notified to re-crawl your URLs.`);
		} else {
			const text = await response.text();
			console.log(`[IndexNow] Response status: ${response.status} ${response.statusText}`, text);
		}
	} catch (err) {
		console.error("[IndexNow] Failed to send request:", err.message);
	}
}

submitToIndexNow();
