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

    def discover_main_file(self, repo, branch: str = "main") -> str:
        try:
            contents = repo.get_contents("", ref=branch)
        except Exception as e:
            raise Exception(f"Failed to fetch repository root contents for branch {branch}: {e}")
        
        files = []
        dirs = []
        for c in contents:
            if c.type == "file":
                files.append(c)
            elif c.type == "dir":
                dirs.append(c)
                
        # 1. Look for Python files in root
        py_files = [f.path for f in files if f.path.endswith(".py")]
        
        # Priority list for Python main files
        priority = ["main.py", "app.py", "run.py", "index.py", "server.py", "manage.py"]
        for p in priority:
            if p in py_files:
                return p
                
        if py_files:
            non_setup_test = [f for f in py_files if "setup" not in f.lower() and "test" not in f.lower()]
            if non_setup_test:
                return non_setup_test[0]
            return py_files[0]
            
        # 2. Look in immediate subdirectories
        for d in dirs:
            if d.path.startswith(".") or d.path in ["tests", "test", "venv", "env", "node_modules", "static"]:
                continue
            try:
                sub_contents = repo.get_contents(d.path, ref=branch)
                sub_py_files = [f.path for f in sub_contents if f.type == "file" and f.path.endswith(".py")]
                for p in priority:
                    for sf in sub_py_files:
                        if sf.endswith("/" + p) or sf.endswith("\\" + p):
                            return sf
                if sub_py_files:
                    non_setup_test = [f for f in sub_py_files if "setup" not in f.lower() and "test" not in f.lower()]
                    if non_setup_test:
                        return non_setup_test[0]
                    return sub_py_files[0]
            except Exception:
                continue
                
        # 3. Look for JS/TS files in root
        js_ts_files = [f.path for f in files if f.path.endswith((".js", ".jsx", ".ts", ".tsx"))]
        js_ts_priority = ["index.js", "app.js", "main.js", "index.ts", "server.js", "App.jsx"]
        for p in js_ts_priority:
            if p in js_ts_files:
                return p
        if js_ts_files:
            return js_ts_files[0]
            
        # 4. Fallback to any non-hidden file in the root
        any_files = [f.path for f in files if f.type == "file" and not f.path.startswith(".")]
        if any_files:
            # Prefer README or documentation files
            for f in any_files:
                if f.lower().startswith("readme") or f.lower().startswith("index"):
                    return f
            return any_files[0]
            
        raise Exception("No files could be automatically discovered in the repository's root directory. Ensure the repository has at least one file, or specify the file manually in the Configuration panel.")

    def get_file_content(self, repo, file_path: str, branch: str = "main"):
        try:
            file_content = repo.get_contents(file_path, ref=branch)
            return file_content.decoded_content.decode('utf-8'), file_content.sha
        except GithubException as e:
            raise Exception(f"Could not read file {file_path}. Ensure it exists on branch {branch}. Error: {e}")

    def create_pr_with_fix(self, repo, file_path: str, new_content: str, commit_message: str, pr_title: str, pr_body: str, source_branch: str = "main"):
        # Create a new branch name
        timestamp = int(time.time())
        new_branch_name = f"ai-fix-{timestamp}"
        
        # Check if we have push permissions to the repo. If not, fork it.
        has_push_access = False
        try:
            permissions = repo.permissions
            if permissions and (permissions.push or permissions.admin):
                has_push_access = True
        except Exception:
            # Fallback if permissions aren't readable (e.g. public repo without permission checks)
            pass

        target_repo = repo
        head_name = new_branch_name

        if not has_push_access:
            try:
                print("No write access to target repository. Attempting to fork...")
                user = self.github.get_user()
                # Create fork
                fork = user.create_fork(repo)
                print(f"Fork created successfully: {fork.full_name}. Waiting for initialization...")
                # Sleep a few seconds to let GitHub process the fork
                time.sleep(5)
                target_repo = fork
                # When PRing from a fork, head must be formatted as 'username:branch'
                head_name = f"{user.login}:{new_branch_name}"
            except Exception as e:
                raise Exception(f"Failed to fork repository: {e}")

        # Create branch in target repo (fork or main repo)
        try:
            source_ref = target_repo.get_git_ref(f"heads/{source_branch}")
            target_repo.create_git_ref(ref=f"refs/heads/{new_branch_name}", sha=source_ref.object.sha)
        except Exception as e:
            raise Exception(f"Failed to create new branch {new_branch_name} on {target_repo.full_name}: {e}")

        # Get file sha from the target repo
        try:
            _, file_sha = self.get_file_content(target_repo, file_path, branch=source_branch)
        except Exception:
            # If the file doesn't exist on the fork/branch yet (or has mismatch), try fetching from source repo
            _, file_sha = self.get_file_content(repo, file_path, branch=source_branch)

        # Update the file on the target repo
        try:
            target_repo.update_file(
                path=file_path,
                message=commit_message,
                content=new_content,
                sha=file_sha,
                branch=new_branch_name
            )
        except Exception as e:
            raise Exception(f"Failed to commit changes to {target_repo.full_name}: {e}")

        # Create the Pull Request on the ORIGINAL repository
        try:
            pr = repo.create_pull(
                title=pr_title,
                body=pr_body,
                head=head_name,
                base=source_branch
            )
            return pr.html_url
        except Exception as e:
            raise Exception(f"Failed to create PR from {head_name} to {repo.full_name}: {e}")
