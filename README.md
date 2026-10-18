# Amitendu Bikash Dhusiya — Personal Website & Web Log

> A nostalgic, content-rich personal homepage and developer blog styled in the classic **2007 Windows Aero & Mac OS X Frutiger Aero** visual aesthetic. Built with modern, high-performance web tooling: **Eleventy 3**, **Tailwind CSS 4**, and **Decap CMS**.

---

## 🌟 Overview & Architecture

This repository hosts the personal portfolio, resume, reading bookshelf, video game showcase, and blog for **Amitendu Bikash Dhusiya** ([amitendu.me](https://amitendu.me)).

### Key Features
* **Aero & Skeuomorphic Visual Design**: Glass-styled headers, 2007-era bevels, CRT monitors header banner, retro macOS dock icon badges, and smooth hover interactions.
* **Decap CMS Admin Panel (`/admin/`)**: Full in-browser content management with editorial workflow, live full-shell preview rendering, and zero vendor lock-in.
* **Component-Based Modular Templates**: Clean Nunjucks partials (`src/_includes/components/`) for sidebars, announcement banners, navigation, comments, and project details.
* **Configurable Sidebar Limits & Titles**: Full control over recent posts count, favorites limit, navigation links, shortcuts, game icons, software dock items, and friends list.
* **Responsive Image Optimization**: Automated WebP generation and responsive `srcset` output powered by `@11ty/eleventy-img` with built-in lightbox zoom.
* **SEO & Indexing Ready**: Automated XML sitemap generation, Open Graph / Twitter Card meta tags, JSON-LD structured data, and IndexNow ping automation for Bing & Google.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Static Site Generator** | [Eleventy 3 (11ty)](https://www.11ty.dev/) | Ultra-fast Node.js SSG compiling Markdown, Nunjucks, and JSON into static HTML. |
| **CSS Framework** | [Tailwind CSS 4](https://tailwindcss.com/) | Modern utility-first CSS with custom glassmorphism and retro Aero tokens. |
| **Content Management** | [Decap CMS](https://decapcms.org/) | Git-based CMS with git-gateway backend and custom React-based live previews. |
| **Template Engine** | [Nunjucks](https://mozilla.github.io/nunjucks/) | Extensible layout inheritance and component partials. |
| **Image Processing** | [`@11ty/eleventy-img`](https://www.11ty.dev/docs/plugins/image/) | Responsive WebP conversion at 480w, 800w, and 1600w breakpoints. |
| **Hosting & CI/CD** | Netlify / GitHub Pages | Git-driven automated builds on push to the `main` branch. |

---

## 📂 Project Directory Structure

```text
shadowamitendu/
├── eleventy.config.js          # Main Eleventy configuration (plugins, shortcodes, filters, collections)
├── package.json                # Project dependencies, build scripts, and metadata
├── scripts/                    # Automation and build helper utilities
│   ├── generate-cms-config.js  # Compiles dynamic Decap CMS config.yml from schema definitions
│   ├── sync-icons.js           # Scans retro dock icons and syncs dropdown options with CMS
│   ├── optimize-images.mjs     # Standalone Sharp-based batch image compressor and manifest generator
│   ├── start-cms.js            # Launches local decap-server proxy with port conflict resolution
│   └── submit-indexnow.js      # Automatic search engine index submission via IndexNow API
├── src/                        # Source content, templates, and data files
│   ├── _data/                  # Global JSON data singletons
│   │   ├── site.json           # Global site metadata, author details, and SEO defaults
│   │   ├── announcement.json   # Top alert/bulletin announcement banner state
│   │   ├── sidebarWidgets.json # Configurable limits and custom titles for all sidebar widgets
│   │   ├── leftSidebar.json    # Left sidebar navigation links list
│   │   ├── rightSidebar.json   # Right sidebar shortcuts & social bookmarks list
│   │   ├── home.json           # Home page hero text, skills, and intro cards
│   │   ├── about.json          # About page biography, timeline, and education
│   │   ├── books.json          # Bookshelf items and reading statuses
│   │   ├── games.json          # Video games played and current ongoing game
│   │   ├── software.json       # Daily software applications and developer tools
│   │   └── friends.json        # Webring peers, friends, and community allies
│   ├── _includes/              # Reusable Nunjucks layouts and partials
│   │   ├── base.njk            # Master HTML document structure and 3-column site shell
│   │   ├── post.njk            # Layout for individual markdown blog articles
│   │   └── components/         # Reusable modular UI components
│   │       ├── announcement.njk    # 1-click dismissible bulletin banner
│   │       ├── header.njk          # CRT monitor banner header with page titles
│   │       ├── nav.njk             # Top navigation bar and location breadcrumbs
│   │       ├── sidebar-left.njk    # Left sidebar column wrapper
│   │       ├── sidebar-right.njk   # Right sidebar column wrapper
│   │       ├── sidebar-nav.njk     # Desktop navigation link tree (with limit support)
│   │       ├── sidebar-shortcuts.njk # Social shortcuts with retro dock icons (with limit support)
│   │       ├── recent-posts.njk    # Recent blog posts list (with limit support)
│   │       ├── favorites.njk       # Starred projects & articles (with limit support)
│   │       ├── widget-reading.njk  # Book reading card (with limit/hide toggle)
│   │       ├── widget-games.njk    # Games tracker card (with secondary mini icons limit)
│   │       ├── widget-software.njk # Developer tools dock icons (with limit support)
│   │       ├── widget-friends.njk  # Friends & allies list (with limit support)
│   │       ├── lightbox.njk        # Pure JS image zoom modal
│   │       ├── comments.njk        # Utterances / GitHub Discussions comment integration
│   │       └── footer.njk          # Copyright, sitemap links, and build timestamp
│   ├── admin/                  # Decap CMS admin interface
│   │   ├── index.html          # Custom CMS UI entry point with live full-shell previews
│   │   └── config.yml          # Generated CMS collections and field schemas
│   ├── assets/                 # Compiled CSS and static icons
│   │   └── icons/              # Retro 2007 macOS dock icons (macos-*.png/svg)
│   ├── blog/                   # Markdown blog articles (`YYYY-MM-DD-slug.md`)
│   ├── portfolio/              # Markdown portfolio project entries
│   └── images/                 # Uploaded media assets
└── public/                     # Output distribution directory compiled by Eleventy
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/ShadowAmitendu/shadowamitendu.git
cd shadowamitendu

# Install dependencies
npm install
```

### Running Locally with Live Reload
```bash
# Start Eleventy dev server and local Decap CMS proxy concurrently
npm run dev
```
* **Website preview**: `http://localhost:8080/`
* **Admin CMS**: `http://localhost:8080/admin/`

---

## 📝 Content Management (Decap CMS)

Access the CMS panel at `/admin/` in your browser. When running locally with `npm run dev`, Decap connects to the local filesystem via `decap-server`, allowing instant editing and drafting without committing immediately to GitHub.

### Collections Available in CMS:
1. **Site Settings (`site.json`)**: Site title, author description, footer notices, and default SEO OpenGraph images.
2. **Banner Announcement (`announcement.json`)**: Enable or disable the top announcement banner, select bulletin style (`info`, `alert`, `success`), configure message text, call-to-action link, and unique dismissal ID.
3. **Sidebar Widgets & Limits (`sidebarWidgets.json`)**: Configure item counts and custom section headings across all desktop sidebar widgets:
   * **Nav Links Limit** (`navigationLimit`): `0` displays all links; positive integers cap the display.
   * **Recent Posts Limit** (`recentPostsLimit`): Number of latest articles to show in the left column.
   * **Favorites Limit** (`favoritesLimit`): Number of starred items to show in the left column.
   * **Outlinks Limit** (`shortcutsLimit`): Maximum social bookmarks to render in the right column.
   * **Book Reading Card** (`readingLimit`): Set to `1` to display current reading card; `0` hides it.
   * **Games Mini Icons Limit** (`gamesLimit`): Number of secondary game icons below the featured game.
   * **Software Icons Limit** (`softwareLimit`): Maximum software dock icons to display.
   * **Friends & Allies Limit** (`friendsLimit`): Maximum webring allies to display.
4. **Blog Posts (`src/blog/`)**: Markdown articles with frontmatter fields for date, title, tags, cover image, mood, and draft status.
5. **Portfolio Projects (`src/portfolio/`)**: Detailed project case studies with order sorting, live demo URLs, source code links, and tech stack tags.

---

## ⚙️ Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs Tailwind watcher, icon synchronizer, Decap CMS local proxy, and Eleventy dev server in parallel. |
| `npm run build` | Full production build: compiles Tailwind CSS, triggers icon sync, and builds static HTML with Eleventy. |
| `npm run build:css` | Compiles and minifies Tailwind CSS from `src/styles/tailwind.css` to `src/assets/styles.css`. |
| `npm run build:cms` | Regenerates `src/admin/config.yml` and `public/admin/config.yml` using `scripts/generate-cms-config.js`. |
| `npm run optimize:images` | Analyzes and optimizes images in `src/images/` using Sharp to save bandwidth. |
| `npm run sync:icons` | Scans `src/assets/icons/` and synchronizes available icon select options in Decap CMS. |
| `npm run submit:indexnow` | Submits all sitemap URLs to Microsoft Bing and IndexNow search engines. |

---

## 🎨 Design & Styling Notes

The interface embraces **Frutiger Aero / Windows Aero** principles:
* **Color Palette**: Sky blue gradients (`#164b70`, `#064f83`, `#b8d9e8`), crisp steel-blue borders (`#9bb0be`, `#b7cbd6`), and vintage paper backgrounds (`#f8fbfc`).
* **Typography**: Clean condensed modern sans-serif headings using **Barlow Condensed** and **Bebas Neue**.
* **Micro-Interactions**: Hover glows on buttons, subtle drop shadows, and authentic retro macOS and Windows application icons.

---

## 📄 License & Credits

* **Code & Architecture**: © 2026 [Amitendu Bikash Dhusiya](https://amitendu.me). All rights reserved.
* **Icons**: Retro dock and application icons are inspired by classic macOS and Windows themes for portfolio demonstration purposes.
