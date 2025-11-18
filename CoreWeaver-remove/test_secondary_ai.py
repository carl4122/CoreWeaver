
from secondary_ai import run_secondary_task

test_memory = {
    "text": "Makaila and Mike confessed their feelings after a long emotional night. They fell asleep in each other’s arms."
}

result = run_secondary_task("summarize", test_memory)
print("Summary from Secondary AI (Horde):\n", result)
