export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
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
  eleventyConfig.addGlobalData("buildDate", () => new Date());
  eleventyConfig.addShortcode("currentYear", () => `${new Date().getFullYear()}`);
  eleventyConfig.addCollection("blog", (collectionApi) =>
    collectionApi
      .getFilteredByTag("blog")
      .sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
  );
  eleventyConfig.addCollection("portfolio", (collectionApi) =>
    collectionApi
      .getFilteredByTag("portfolio")
      .sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)),
  );
  eleventyConfig.addCollection("updates", (collectionApi) =>
    collectionApi
      .getAll()
      .filter((item) => item.data.tags?.includes("blog") || item.data.tags?.includes("portfolio"))
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
