import { images } from "./images";

export const ourStoryContent = {
  hero: {
    eyebrow: "Our Story",
    title: "Hospitality before technology",
    description:
      "We started with a question: what would a neighbourhood kitchen look like if it were built on patience? That question is still the answer.",
    image: images.story.hero,
  },

  philosophy: {
    label: "The Philosophy",
    title: "Cooking for the long table",
    paragraphs: [
      "We don't believe in shortcuts, and we don't believe in spectacle. We believe in the long table — the one that fits family, friends, and the friend-of-friend who just arrived. We cook for that table.",
      "Every decision — what we buy, who we hire, what we charge — starts with hospitality. Technology should make the experience quieter, not louder.",
    ],
  },

  standards: {
    eyebrow: "Kitchen Standards",
    title: "What we hold ourselves to",
    body: "These are the standards we set, and the ones we hold each other to. They are not aspirational. They are how we work.",
    image: images.story.foundersKitchen,
    items: [
      "Every dish is finished to order.",
      "Every ingredient is logged. We can trace it back.",
      "Every member of the kitchen team has a voice on the menu.",
      "Every guest is greeted by name, where possible.",
    ],
  },

  values: {
    label: "Values",
    title: "What we believe",
    items: [
      { title: "Hospitality first", body: "We treat every guest like a friend at the table.", image: images.story.hospitality },
      { title: "Honest sourcing", body: "We work with farms and suppliers we can name. We pay them properly.", image: images.story.ingredients },
      { title: "Patient cooking", body: "We don't rush. The kitchen is built around time, not convenience.", image: images.story.foodPrep },
      { title: "Editorial presentation", body: "Food deserves to be seen, not just eaten. We plate for the camera, too.", image: images.story.presentation },
    ],
  },

  timeline: {
    eyebrow: "Timeline",
    title: "How we got here",
    description: "A short version of the long story.",
    entries: [
      { year: "2018", label: "A small kitchen", body: "Celjoe began as a weekend kitchen for friends, family, and the occasional office lunch." },
      { year: "2020", label: "First supper club", body: "We hosted our first ticketed supper. Every seat sold within a weekend." },
      { year: "2022", label: "A permanent home", body: "The kitchen grew up. We took on a permanent home and built the team around it." },
      { year: "2024", label: "The Smokehouse", body: "We added an offset hardwood smoker. The Smokehouse became its own experience." },
      { year: "Today", label: "Still small on purpose", body: "We still cook in small batches. We still answer the phone." },
    ],
  },

  invitation: {
    label: "An Invitation",
    title: "Come eat with us",
    description: "The kitchen is open most days, and the door is always the same.",
    backgroundImage: images.story.ctaBg,
  },
} as const;
