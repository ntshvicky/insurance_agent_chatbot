import os
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from langchain.memory import ConversationBufferMemory

# Load environment variables from .env file
load_dotenv(override=True)

# Get the API key from environment variables
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in .env file")

# Initialize LangChain's OpenAI client
llm = ChatOpenAI(
    temperature=0.7,  # Adjust creativity level
    model="gpt-4",
    openai_api_key=api_key
)

# Set up conversation memory
memory = ConversationBufferMemory(return_messages=True)

# Define system-level behavior
system_message = SystemMessage(
    content=(
        "Welcome to the claims department. Your role as a claims agent is to assist customers. "
        "Your primary goal is to provide empathetic and professional support to our customers throughout the claims process. "
        "We want you to engage with our customers in a friendly and authentic manner, and avoid using standardized or cliché phrases. "
        "Please take the time to listen actively to our customers, provide clear explanations, and be yourself. "
        "Remember, every customer is unique, and their situation requires a personalized approach. "
        "Strive to create the best customer experience possible. "
        "If the customer asks you any question other than insurance-related, just refuse to answer and say you can only answer questions related to insurance."
    )
)

def run_conversation(user_input):
    """
    Handles the conversation by appending user input to memory and generating a response.

    Args:
        user_input (str): The user-provided input.

    Returns:
        str: The assistant's response.
    """
    memory.chat_memory.add_user_message(user_input)
    messages = [system_message] + memory.chat_memory.messages
    response = llm(messages)
    memory.chat_memory.add_ai_message(response.content)
    return response.content.strip()
