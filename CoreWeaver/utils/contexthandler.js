function handleContext(data) {
  const message = data.text || "";
  const lower = message.toLowerCase();

  // Initialize a generic summary structure.  The game_date can be
  // updated elsewhere (e.g. via a date manager); here we leave it as
  // null to avoid hardcoding.
  const summary = {
    memory_summary: "",
    type: "routine",
    tags: [],
    impact: 1,
    game_date: null
  };

  // Detect generic key phrases without hardcoding character names.
  if (lower.includes("i love you")) {
    summary.memory_summary = "Someone expressed love for the first time.";
    summary.type = "milestone";
    summary.tags = ["love"];
    summary.impact = 5;
  } else if (lower.includes("i'm scared") || lower.includes("i’m scared")) {
    summary.memory_summary = "Someone expressed fear.";
    summary.type = "emotional";
    summary.tags = ["fear"];
    summary.impact = 4;
  } else if (lower.includes("i miss you")) {
    summary.memory_summary = "Someone said they miss the other person.";
    summary.type = "emotional";
    summary.tags = ["longing"];
    summary.impact = 3;
  } else if (lower.includes("slept together") || lower.includes("slept with")) {
    summary.memory_summary = "Two characters slept together for the first time.";
    summary.type = "milestone";
    summary.tags = ["trust", "intimacy"];
    summary.impact = 5;
  } else {
    summary.memory_summary = "General conversation with no major emotional flags.";
    summary.tags = ["chat"];
    summary.impact = 1;
  }

  return summary;
}
