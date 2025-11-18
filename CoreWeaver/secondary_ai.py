
import json
import openai

def load_secondary_model():
    with open("settings.json") as f:
        config = json.load(f)
    return config.get("secondary_model", "gpt-3.5"), config

def run_secondary_task(task_type, input_data):
    model, config = load_secondary_model()
    if model == "gpt-3.5":
        return run_openai_model(model, input_data, config)
    else:
        raise NotImplementedError(f"Model '{model}' not yet supported.")

def run_openai_model(model_name, input_data, config):
    openai.api_key = config.get("openai_api_key")
    resp = openai.ChatCompletion.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "Summarize the following memory."},
            {"role": "user", "content": input_data["text"]}
        ],
        temperature=0.7,
        max_tokens=150
    )
    return resp.choices[0].message.content.strip()
