export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "You Type Your Message",
      description: "Start chatting with your AI tool as normal. Context One detects when you're about to send a message.",
    },
    {
      number: "2",
      title: "We Inject Relevant Context",
      description: "Our extension searches your unified memory and injects the most relevant past conversations into the prompt.",
    },
    {
      number: "3",
      title: "AI Gives Better Answers",
      description: "Your AI now has full context of your project, preferences, and past discussions. No more repeating yourself.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            How Context One Works
          </h2>
          <p className="mb-12 text-lg text-gray-600 dark:text-gray-300">
            Three simple steps to never lose context again.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                {step.number}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}