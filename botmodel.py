import os
import openai

from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv('OPENAI_API_KEY')


conversation_history = [
    {
        "role": "system",
        "content": "Welcome to the claims department. Your role as a claims agent is to assist customers. Your primary goal is to provide empathetic and professional support to our customers throughout the claims process. We want you to engage with our customers in a friendly and authentic manner, and avoid using standardized or cliché phrases. Please take the time to listen actively to our customers, provide clear explanations, and be yourself. Remember, every customer is unique, and their situation requires a personalized approach. Strive to create the best customer experience possible. If customer will ask you any question other than insurance related just refuse to answer and say you can only answer questions related to insurance."
    }
]

def validate_content(content):
    # Step 1: send the conversation and available functions to GPT
    messages = [{"role": "user", "content": "Is this question is related to insurance? \""+ content + "\". Return result True or False only."}]
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        messages=messages
    )
    response_message = response["choices"][0]["message"]
    return response_message

def conversation_summary(content):
    # Step 1: send the conversation and available functions to GPT
    messages = [{"role": "user", "content": "summarize this conversation array, {}".format(content)}]
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        messages=messages
    )
    response_message = response["choices"][0]["message"]
    return response_message

def run_conversation(content):
    print(content)
    global conversation_history
    # Step 1: send the conversation and available functions to GPT
    messages = {
            "role": "user",
            "content": content
        }
    conversation_history.append(messages)
    print("question", conversation_history)
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=conversation_history
    )
    response_message = response["choices"][0]["message"]
    print("response", response_message)
    conversation_history.append(response_message)
    return response_message

