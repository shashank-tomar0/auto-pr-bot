import os
from github import Github
from github.GithubException import GithubException
import time

class GitHubManager:
    def __init__(self, token: str):
        self.github = Github(token)
        
    def get_repo(self, repo_url: str):
        # Parse owner/repo from URL
        parts = repo_url.replace("https://github.com/", "").split("/")
        if len(parts) >= 2:
            repo_name = f"{parts[0]}/{parts[1]}"
            return self.github.get_repo(repo_name)
        raise ValueError("Invalid GitHub Repository URL")

    def get_file_content(self, repo, file_path: str, branch: str = "main"):
        try:
            file_content = repo.get_contents(file_path, ref=branch)
            return file_content.decoded_content.decode('utf-8'), file_content.sha
        except GithubException as e:
            raise Exception(f"Could not read file {file_path}. Ensure it exists on branch {branch}. Error: {e}")

    def create_pr_with_fix(self, repo, file_path: str, new_content: str, commit_message: str, pr_title: str, pr_body: str, source_branch: str = "main"):
        # Create a new branch
        timestamp = int(time.time())
        new_branch_name = f"ai-fix-{timestamp}"
        
        try:
            source_ref = repo.get_git_ref(f"heads/{source_branch}")
            repo.create_git_ref(ref=f"refs/heads/{new_branch_name}", sha=source_ref.object.sha)
        except Exception as e:
            raise Exception(f"Failed to create new branch {new_branch_name}: {e}")

        # Get file sha
        _, file_sha = self.get_file_content(repo, file_path, branch=source_branch)

        # Update the file on the new branch
        try:
            repo.update_file(
                path=file_path,
                message=commit_message,
                content=new_content,
                sha=file_sha,
                branch=new_branch_name
            )
        except Exception as e:
            raise Exception(f"Failed to commit changes: {e}")

        # Create the Pull Request
        try:
            pr = repo.create_pull(
                title=pr_title,
                body=pr_body,
                head=new_branch_name,
                base=source_branch
            )
            return pr.html_url
        except Exception as e:
            raise Exception(f"Failed to create PR: {e}")
