# Save as backend/test_claude.py and run it
import anthropic, os
from dotenv import load_dotenv
load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

try:
    r = client.messages.create(
        model="claude-3-5-haiku-20241022",
        max_tokens=50,
        messages=[{"role": "user", "content": "Say hello"}]
    )
    print("SUCCESS:", r.content[0].text)
except Exception as e:
    print("FAILED:", e)