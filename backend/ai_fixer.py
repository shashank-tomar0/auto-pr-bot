from groq import Groq

class AIFixer:
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"

    def fix_code(self, code: str, issue_description: str) -> str:
        sys_msg = (
            "You are an expert software engineer. Your task is to analyze the provided code "
            "and fix the issue described by the user. "
            "You must output ONLY the fixed code. Do not include markdown formatting like ```python, "
            "do not include explanations, just output the raw code that will replace the existing file."
        )
        
        prompt = f"Issue Description: {issue_description}\n\nCode:\n{code}"
        
        response = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            temperature=0
        )
        
        # Clean up any potential markdown code blocks if the LLM ignores instructions
        fixed_code = response.choices[0].message.content.strip()
        if fixed_code.startswith("```"):
            lines = fixed_code.split("\n")
            if len(lines) > 2:
                fixed_code = "\n".join(lines[1:-1])
                
        return fixed_code
    
    def generate_pr_details(self, original_code: str, fixed_code: str, issue_description: str) -> dict:
        sys_msg = (
            "You are an expert software engineer. Generate a Pull Request title and body based on the fix. "
            "Format your response exactly like this:\n"
            "TITLE: <your title>\n"
            "BODY:\n<your body>"
        )
        
        prompt = f"Issue: {issue_description}\n\nFix applied. Generate PR title and body."
        
        response = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            temperature=0
        )
        
        content = response.choices[0].message.content
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

    def analyze_and_fix(self, code: str) -> dict:
        sys_msg = (
            "You are an expert software engineer and code reviewer.\n"
            "Your task is to analyze the provided code, identify any bugs, vulnerabilities, code smells, "
            "inefficiencies, or style/documentation issues (like missing docstrings or type hints).\n"
            "Then, you must fix the issues and output your analysis and the fixed code in a structured format.\n"
            "Format your response EXACTLY like this:\n\n"
            "EXPLANATION:\n"
            "<Write a brief explanation of the issue(s) you found and how you fixed them>\n\n"
            "PR_TITLE:\n"
            "<Write a short, descriptive pull request title>\n\n"
            "PR_BODY:\n"
            "<Write a brief description of the changes for the pull request body>\n\n"
            "FIXED_CODE:\n"
            "```\n"
            "<Complete fixed code file here>\n"
            "```"
        )
        
        prompt = f"Analyze and improve this code:\n\n{code}"
        
        response = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            temperature=0
        )
        
        content = response.choices[0].message.content
        
        explanation = "Identified and improved code quality."
        pr_title = "Refactor and optimize code structure"
        pr_body = "This PR automatically analyzes the source file and applies optimizations."
        fixed_code = code
        
        try:
            if "EXPLANATION:" in content:
                parts = content.split("EXPLANATION:")
                rest = parts[1]
                
                if "PR_TITLE:" in rest:
                    exp_part, rest = rest.split("PR_TITLE:", 1)
                    explanation = exp_part.strip()
                    
                if "PR_BODY:" in rest:
                    title_part, rest = rest.split("PR_BODY:", 1)
                    pr_title = title_part.strip()
                    
                if "FIXED_CODE:" in rest:
                    body_part, code_part = rest.split("FIXED_CODE:", 1)
                    pr_body = body_part.strip()
                    
                    code_str = code_part.strip()
                    if "```" in code_str:
                        lines = code_str.split("\n")
                        start_idx = -1
                        end_idx = -1
                        for idx, line in enumerate(lines):
                            if line.startswith("```"):
                                if start_idx == -1:
                                    start_idx = idx
                                else:
                                    end_idx = idx
                                    break
                        if start_idx != -1 and end_idx != -1:
                            fixed_code = "\n".join(lines[start_idx+1:end_idx])
                        elif start_idx != -1:
                            fixed_code = "\n".join(lines[start_idx+1:])
                        else:
                            fixed_code = code_str
                    else:
                        fixed_code = code_str
        except Exception as e:
            pass
            
        return {
            "explanation": explanation,
            "pr_title": pr_title,
            "pr_body": pr_body,
            "fixed_code": fixed_code
        }
