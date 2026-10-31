/*
 * Copy for the AI savings estimator page. It contains no statistics, benchmarks or
 * customer results on purpose: every figure on the page comes from the numbers the
 * reader types in.
 */

export const estimatorPage = {
  path: "/tools/ai-savings-estimator",
  name: "AI savings and growth estimator",
  /** TODO(owner): update when the copy or the model changes. */
  updatedISO: "2026-10-31",
  updatedLabel: "31 October 2026",
  title: "AI savings and growth estimator: a free planning calculator",
  description:
    "Estimate what automating a workflow with AI could save, what it would cost to build and run, and when it could pay back. Free, runs in your browser, nothing is stored.",
  answer: [
    "This free estimator works out roughly what automating one workflow with AI could save, what it would cost to build and run, when it could pay back, and how the next three years compare with doing nothing. It is for owners and managers weighing a first AI project.",
    "It is a planning calculator, not a forecast or a quote. It turns the numbers you enter into arithmetic and shows its working. It runs in your browser, and nothing you type is sent, stored or put in the web address.",
  ],
} as const;

export const howToUse: { title: string; body: string }[] = [
  {
    title: "Pick one workflow.",
    body: "Choose a single repeated piece of work, such as answering a type of customer email, entering invoice data or preparing quotes. Estimating a whole department at once hides the detail that makes an estimate useful.",
  },
  {
    title: "Measure how it runs today.",
    body: "Count how many times it happens in a month and time a handful of real examples. Use the fully loaded cost of an hour of the people who do it, which includes more than the wage.",
  },
  {
    title: "Decide what AI would do, honestly.",
    body: "Split the work into tasks AI could finish by itself and tasks where it only helps a person. Be cautious with the first group, and add the minutes a person needs to check each result.",
  },
  {
    title: "Add the costs.",
    body: "Enter the one-time build cost, ideally from a real quote, and the monthly cost of running it. Look up current provider pricing yourself for the run cost, because it changes.",
  },
  {
    title: "Read the three cases.",
    body: "Look at the Conservative case first. If the project only makes sense in the Optimistic case, that is worth knowing before you spend anything.",
  },
  {
    title: "Change one input at a time.",
    body: "Raise the review time, lower the share AI can handle, extend the ramp-up. The inputs that move the answer most are the ones to check carefully before you decide.",
  },
  {
    title: "Keep a copy.",
    body: "Copy the summary or download the CSV to share with colleagues. The page keeps nothing, so a refresh clears your inputs.",
  },
];

export const goodFirstProject: { title: string; body: string }[] = [
  {
    title: "High volume.",
    body: "The work happens often enough that a small saving per task adds up, and the build cost is spread over many tasks.",
  },
  {
    title: "Repetitive and similar each time.",
    body: "Tasks that follow a pattern are easier to automate and easier to test than one-off judgement calls.",
  },
  {
    title: "Well-defined inputs and outputs.",
    body: "You can say what goes in (an email, a form, a document) and what a correct result looks like. If two experienced staff would disagree on the right answer, a model will struggle too.",
  },
  {
    title: "Tolerant of review.",
    body: "A person can check results before they reach a customer or a system of record, and a wrong answer is cheap to catch and fix. Work where one mistake is costly needs more checking, which shows up as review time in the estimate.",
  },
  {
    title: "Measurable today.",
    body: "You already know roughly how long it takes and how many go wrong. Without that, you cannot tell afterwards whether it worked.",
  },
];

export const leavesOut: { title: string; body: string }[] = [
  {
    title: "Data preparation.",
    body: "Documents and records often need cleaning, organising or permission to use before a system can work from them.",
  },
  {
    title: "Change management.",
    body: "People need time to learn the new way of working, and adoption is rarely smooth. The ramp-up input is a rough stand-in, not a plan.",
  },
  {
    title: "Security and privacy review.",
    body: "Sending business or personal information to an outside service raises questions about contracts, residency and what the provider may keep. Answering them takes time and sometimes changes the design.",
  },
  {
    title: "Ongoing maintenance.",
    body: "Systems that depend on models and third-party tools need attention when those change. You can include this in the monthly run cost, but it is easy to underestimate.",
  },
  {
    title: "Provider price and model changes.",
    body: "Prices, limits and model behaviour change over time. The estimator does not know current prices on purpose. Enter your own figure and revisit it.",
  },
  {
    title: "Quality monitoring.",
    body: "Results can drift or fail in new ways. Someone needs to sample the output, track errors and decide when to retrain, re-prompt or switch off.",
  },
  {
    title: "Tax, inflation and the time value of money.",
    body: "The model adds up nominal amounts. It does not discount future savings or account for tax.",
  },
  {
    title: "Whether the freed time is actually used.",
    body: "Hours saved are only savings if they reduce paid hours or are put to work that has value. The growth inputs exist for the second case, and they are optional for a reason.",
  },
];

export const commonMistakes: { title: string; body: string }[] = [
  {
    title: "Counting every saved minute as saved money.",
    body: "Many people each saving a few minutes a day rarely removes a whole position. Decide where the freed time goes before you count it as money.",
  },
  {
    title: "Forgetting review time.",
    body: "If a person checks every AI result, that time reduces the saving. It can remove the saving entirely for short tasks.",
  },
  {
    title: "Using demo accuracy for real work.",
    body: "A demo uses clean, chosen examples. Test on a sample of your own messy, recent tasks before you decide what share AI can handle.",
  },
  {
    title: "Assuming full adoption on day one.",
    body: "Adoption takes time. Set the months-to-full-adoption input to something you believe, and see how much it moves payback.",
  },
  {
    title: "Treating the build as the only cost.",
    body: "Running and maintaining the system costs money every month, and the running cost can be what decides whether the project pays back.",
  },
  {
    title: "Treating growth as certain.",
    body: "Extra capacity does not become extra sales by itself. Keep the share you actually expect to convert low, or leave growth out and judge the project on cost savings alone.",
  },
  {
    title: "Using a wage instead of a fully loaded cost, or the reverse.",
    body: "Pick one on purpose. Fully loaded cost is higher than wages and is the right figure if freed hours reduce what you pay overall.",
  },
  {
    title: "Estimating a workflow that is not stable.",
    body: "If the process changes every quarter, the system will need rework every quarter. Stabilise the process first or include the rework in the run cost.",
  },
];

export const glossary: { term: string; meaning: string }[] = [
  {
    term: "LLM (large language model)",
    meaning:
      "Software trained on a large amount of text so that it can read and write language. It is the engine behind many chat and drafting tools. It can be wrong while sounding sure, which is why review matters.",
  },
  {
    term: "Token",
    meaning:
      "A small piece of text, often a word or part of a word, that model providers count to measure what you send and what comes back. Usage charges are commonly based on token counts, so longer inputs and outputs usually cost more.",
  },
  {
    term: "RAG (retrieval-augmented generation)",
    meaning:
      "A setup where the system first looks up relevant passages in your own documents and gives them to the model, so the answer is based on your material and can point back to it.",
  },
  {
    term: "Fine-tuning",
    meaning:
      "Training an existing model further on your own examples to change how it behaves or writes. It is a different approach from RAG, and many first projects do not need it.",
  },
  {
    term: "Human-in-the-loop",
    meaning:
      "A design where a person reviews or approves what the AI produces before it is used. The review minutes in the estimator represent this.",
  },
];

export const faq: { q: string; a: string }[] = [
  {
    q: "How do I estimate the time AI saves?",
    a: "Time a sample of real tasks as they are done today, then try the AI on the same sample and time it again, including the minutes a person spends checking the result. Multiply the difference by your monthly volume. The estimator separates tasks AI finishes on its own from tasks where it only helps, because the saving is different for each.",
  },
  {
    q: "Does AI always reduce cost?",
    a: "No. If the volume is low, the checking takes nearly as long as the original work, or the build and running costs are large next to the time saved, the net result can be zero or negative. The estimator shows that outcome plainly, with no payback, instead of hiding it.",
  },
  {
    q: "What costs should I include?",
    a: "Include the one-time build and integration cost, the monthly running cost (AI usage, hosting, tools and maintenance), and the human time spent reviewing results. Then think about what the estimator leaves out: data preparation, training your team, security and privacy review, and monitoring quality over time.",
  },
  {
    q: "What does AI automation cost to run?",
    a: "It depends on a few drivers: how many requests you make, how long the inputs and outputs are, which model you use, where the system is hosted, how much monitoring it needs, and how often it must be updated when tools or providers change. Provider prices change, so get current figures from your provider and enter your own monthly number.",
  },
  {
    q: "How long does an AI project take to pay back?",
    a: "It depends on your numbers, so there is no honest single answer. Payback is the first month when the savings you have accumulated cover the build cost. As a rough check, divide the build cost by the net saving per month, then allow extra time for ramp-up. The estimator does this month by month and says when payback does not happen within 36 months.",
  },
  {
    q: "What is the difference between tasks AI fully handles and tasks it assists?",
    a: "A fully handled task is finished by the system, with a person only checking the result. An assisted task is still done by a person, but starts from a draft or a prepared answer and takes less time. Most real workflows have both, and many have a third group AI should not touch.",
  },
  {
    q: "Is anything I enter sent or stored?",
    a: "No. The calculation runs in your browser, and the page does not send your numbers to a server, save them, or add them to the web address. Refreshing the page clears everything. If you copy the summary or download the CSV, that file is only on your device.",
  },
  {
    q: "Can I rely on this estimate to decide on a project?",
    a: "Treat it as a planning aid. It is only as good as the numbers you enter, and it leaves out costs that are hard to estimate in advance. Use it to find which assumptions matter, then test those on a small pilot with real tasks before committing to a larger build.",
  },
];

export const author = {
  name: "Chirag Bansal",
  role: "CEO",
  org: "SideData Technologies",
  place: "Toronto, Ontario",
  credential: "Google Cloud Certified: Generative AI Leader",
  cardPath: "/card/chirag-bansal",
} as const;
