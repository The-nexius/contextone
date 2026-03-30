const aiTools = [
  { name: "ChatGPT", color: "#10a37f" },
  { name: "Claude", color: "#d97706" },
  { name: "Gemini", color: "#4285f4" },
  { name: "Perplexity", color: "#8e44ad" },
  { name: "Grok", color: "#e74c3c" },
];

export default function AITools() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Works With Your Favorite AI Tools
          </h2>
          <p className="mb-12 text-lg text-gray-600 dark:text-gray-300">
            Context One integrates seamlessly with the top 5 AI assistants, covering 99% of users.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {aiTools.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: tool.color }}
              />
              <span className="font-semibold">{tool.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}