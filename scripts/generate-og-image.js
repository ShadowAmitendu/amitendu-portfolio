import fs from "fs";

const imgBase64 = fs.readFileSync("src/images/og-profile.jpg").toString("base64");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d2b42"/>
      <stop offset="60%" stop-color="#164b70"/>
      <stop offset="100%" stop-color="#081e2e"/>
    </linearGradient>
    <clipPath id="avatarClip">
      <rect x="90" y="140" width="350" height="350" rx="32"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle grid pattern & accents -->
  <rect x="24" y="24" width="1152" height="582" rx="20" fill="none" stroke="#246491" stroke-width="2" opacity="0.6"/>

  <!-- Avatar Outer Border -->
  <rect x="82" y="132" width="366" height="366" rx="40" fill="#2b77aa" opacity="0.4"/>
  <rect x="86" y="136" width="358" height="358" rx="36" fill="#164b70"/>
  <image href="data:image/jpeg;base64,${imgBase64}" x="90" y="140" width="350" height="350" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>

  <!-- Content -->
  <text x="490" y="195" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#00f0ff" letter-spacing="3">PORTFOLIO &amp; DEVELOPER</text>
  <text x="490" y="265" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="800" fill="#ffffff" letter-spacing="-0.5">Amitendu Bikash Dhusiya</text>
  <text x="490" y="325" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="500" fill="#b9d6ea">BCA Student &amp; Software Developer</text>

  <!-- Tech tags -->
  <g transform="translate(490, 365)">
    <rect x="0" y="0" width="95" height="36" rx="8" fill="#0a263a" stroke="#235c82" stroke-width="1"/>
    <text x="47.5" y="24" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">React</text>

    <rect x="110" y="0" width="90" height="36" rx="8" fill="#0a263a" stroke="#235c82" stroke-width="1"/>
    <text x="155" y="24" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">Java</text>

    <rect x="215" y="0" width="135" height="36" rx="8" fill="#0a263a" stroke="#235c82" stroke-width="1"/>
    <text x="282.5" y="24" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">Spring Boot</text>

    <rect x="365" y="0" width="110" height="36" rx="8" fill="#0a263a" stroke="#235c82" stroke-width="1"/>
    <text x="420" y="24" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">UI / UX</text>

    <rect x="490" y="0" width="125" height="36" rx="8" fill="#0a263a" stroke="#235c82" stroke-width="1"/>
    <text x="552.5" y="24" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">JavaScript</text>
  </g>

  <!-- URL & Brand Footer -->
  <g transform="translate(490, 455)">
    <circle cx="10" cy="10" r="6" fill="#00f0ff"/>
    <text x="28" y="16" font-family="Courier New, monospace" font-size="22" font-weight="700" fill="#ffffff">https://amitendu.me</text>
  </g>
</svg>
`;

fs.writeFileSync("src/images/og-card.svg", svg);
console.log("src/images/og-card.svg created successfully");
