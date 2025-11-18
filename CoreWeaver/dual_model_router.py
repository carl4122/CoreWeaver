
import json
import openai
from secondary_ai import run_secondary_task

# Load configuration
def load_config():
    with open("settings.json") as f:
        return json.load(f)

# Main model routing function
def route_task(task_type, input_data):
    config = load_config()
    primary_model = config.get("primary_model", "gpt-4o")

    if task_type == "summarize" or task_type == "compress":
        # Route memory-related tasks to secondary
        return run_secondary_task(task_type, input_data)

    elif task_type == "generate" or task_type == "emotional_response":
        return run_openai_primary(primary_model, input_data)

    else:
        raise ValueError(f"Unknown task type: {task_type}")

# OpenAI primary model handler
def run_openai_primary(model_name, input_data):
    config = load_config()
    openai.api_key = config.get("openai_api_key")

    messages = input_data.get("messages", [])
    if not messages:
        messages = [
            {"role": "system", "content": "You are a helpful AI."},
            {"role": "user", "content": input_data["text"]}
        ]

    response = openai.ChatCompletion.create(
        model=model_name,
        messages=messages,
        temperature=0.7,
        max_tokens=300
    )

    return response.choices[0].message.content.strip()
