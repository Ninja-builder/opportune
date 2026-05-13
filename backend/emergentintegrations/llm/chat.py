from pydantic import BaseModel

class UserMessage(BaseModel):
    text: str

class LlmChat:
    def __init__(self, api_key: str, session_id: str, system_message: str):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        self.provider = "mock"
        self.model = "mock"

    def with_model(self, provider: str, model: str):
        self.provider = provider
        self.model = model
        return self

    async def send_message(self, message: UserMessage) -> str:
        # Mock response since we don't have the real emergentintegrations package
        return "This is a mock response from the AI. To use real AI, you need the actual `emergentintegrations` package installed."
