import os
from langchain import LLMChain, PromptTemplate
from langchain.llms import DeepInfra
from langchain.memory import ConversationBufferWindowMemory

from dotenv import load_dotenv

load_dotenv()

DEEPINFRA_API_TOKEN = os.getenv('DEEPINFRA_API_TOKEN')


template = """Welcome to the claims department. Your role as a claims agent is to assist customers. 
Your primary goal is to provide empathetic and professional support to our customers throughout the claims process. 
We want you to engage with our customers in a friendly and authentic manner, and avoid using standardized or cliché phrases. 
Please take the time to listen actively to our customers, provide clear explanations, and be yourself. 
Remember, every customer is unique, and their situation requires a personalized approach. Strive to create the best customer experience possible. 
If customer will ask you any question other than insurance related just refuse to answer and say you can only answer questions related to insurance.

{history}
Human: {human_input}
Assistant:"""




prompt = PromptTemplate(input_variables=["history", "human_input"], template=template)


chatgpt_chain = LLMChain(
    llm=DeepInfra(model_id="meta-llama/Llama-2-70b-chat-hf"),
    prompt=prompt,
    verbose=False,
    memory=ConversationBufferWindowMemory(k=2),
    llm_kwargs={"max_length": 4096}
)

def run_conversation(content):
    print(content)
    global chatgpt_chain
        
    output = chatgpt_chain.predict(
        human_input=content
    )

    return output

