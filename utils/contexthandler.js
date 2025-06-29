function handleContext(data) {
  const message = data.text || "";
  const summary = {};
  
  // Normalize and prep message
  const lower = message.toLowerCase();

  // Initialize metadata
  summary.memory_summary = "";
  summary.type = "routine";
  summary.tags = [];
  summary.impact = 1;
  summary.game_date = "6/29/2025"; // Temporary static value

  // Detect key phrases
  if (lower.includes("i love you")) {
    summary.memory_summary = "Makaila said she loves Mike for the first time.";
    summary.type = "milestone";
    summary.tags = ["Makaila", "love"];
    summary.impact = 5;
  } else if (lower.includes("i'm scared") || lower.includes("i’m scared")) {
    summary.memory_summary = "Makaila expressed fear.";
    summary.type = "emotional";
    summary.tags = ["Makaila", "fear"];
    summary.impact = 4;
  } else if (lower.includes("i miss you")) {
    summary.memory_summary = "Makaila said she misses Mike.";
    summary.type = "emotional";
    summary.tags = ["Makaila", "longing"];
    summary.impact = 3;
  } else if (lower.includes("slept together") || lower.includes("slept with")) {
    summary.memory_summary = "Mike and Makaila slept together for the first time.";
    summary.type = "milestone";
    summary.tags = ["Makaila", "trust", "intimacy"];
    summary.impact = 5;
  } else {
    summary.memory_summary = "General conversation with no major emotional flags.";
    summary.tags.push("chat");
    summary.impact = 1;
  }

  return summary;
}
