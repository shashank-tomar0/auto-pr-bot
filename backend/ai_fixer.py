from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

class AIFixer:
    def __init__(self, api_key: str):
        self.llm = ChatGroq(api_key=api_key, model="llama3-70b-8192", temperature=0)

    def fix_code(self, code: str, issue_description: str) -> str:
        sys_msg = SystemMessage(content=(
            "You are an expert software engineer. Your task is to analyze the provided code "
            "and fix the issue described by the user. "
            "You must output ONLY the fixed code. Do not include markdown formatting like ```python, "
            "do not include explanations, just output the raw code that will replace the existing file."
        ))
        
        prompt = f"Issue Description: {issue_description}\n\nCode:\n{code}"
        human_msg = HumanMessage(content=prompt)
        
        response = self.llm.invoke([sys_msg, human_msg])
        
        # Clean up any potential markdown code blocks if the LLM ignores instructions
        fixed_code = response.content.strip()
        if fixed_code.startswith("```"):
            lines = fixed_code.split("\n")
            if len(lines) > 2:
                fixed_code = "\n".join(lines[1:-1])
                
        return fixed_code
    
    def generate_pr_details(self, original_code: str, fixed_code: str, issue_description: str) -> dict:
        sys_msg = SystemMessage(content=(
            "You are an expert software engineer. Generate a Pull Request title and body based on the fix. "
            "Format your response exactly like this:\n"
            "TITLE: <your title>\n"
            "BODY:\n<your body>"
        ))
        
        prompt = f"Issue: {issue_description}\n\nFix applied. Generate PR title and body."
        response = self.llm.invoke([sys_msg, HumanMessage(content=prompt)])
        
        content = response.content
        title = "AI Auto-Fix"
        body = "This PR fixes the described issue."
        
        try:
            if "TITLE:" in content and "BODY:" in content:
                parts = content.split("BODY:")
                title = parts[0].replace("TITLE:", "").strip()
                body = parts[1].strip()
        except Exception as e:
            pass
            
        return {"title": title, "body": body}
