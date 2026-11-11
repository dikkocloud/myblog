const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "posts");
const OUT = path.join(__dirname, "public");
const OUT_POSTS = path.join(OUT, "posts");

fs.rmSync(OUT_POSTS, { recursive: true, force: true });
fs.mkdirSync(OUT_POSTS, { recursive: true });

function parse(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(":");
    if (i === -1) return;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    meta[key] = value;
  });
  return { meta, body: match[2] };
}

const posts = [];

for (const file of fs.readdirSync(SRC)) {
  if (!file.endsWith(".md")) continue;

  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(SRC, file), "utf8");
  const { meta, body } = parse(raw);

  if (String(meta.draft).toLowerCase() === "true") continue;

  const words = body.trim().split(/\s+/).length;

  posts.push({
    slug,
    title: meta.title || slug,
    date: meta.date || "",
    description: meta.description || "",
    tags: meta.tags
      ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    readingTime: Math.max(1, Math.round(words / 200)),
  });

  fs.writeFileSync(path.join(OUT_POSTS, slug + ".md"), body);
}

posts.sort((a, b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync(path.join(OUT, "posts.json"), JSON.stringify(posts, null, 2));

console.log(`Built ${posts.length} post(s).`);
