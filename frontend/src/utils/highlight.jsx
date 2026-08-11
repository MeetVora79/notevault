export function highlightText(text, query) {
  if (!text || !query?.trim()) return text;

  // Split query into individual words, filter empty strings
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // escape regex chars

  if (!words.length) return text;

  // Build regex that matches ANY of the words individually
  const regex = new RegExp(`(${words.join("|")})`, "gi");
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="text-ai not-italic"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}