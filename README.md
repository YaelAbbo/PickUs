# PickUs
## Description

## Jira
Link your development information to Jira work items
To link branches, commits, and pull requests to Jira, your team must include Jira keys in their development actions.

Find the key for the Jira work item you want to link to, for example “JRA-123”. You can find the key on the board, keys appear at the bottom of a card.

**Use cases:**
1) Check out a new branch in your repo, using the key in the branch name. For example, git checkout -b JRA-123-<branch-name>.

2) When committing changes to your branch, use the key in your commit message to link those commits to the development panel in your Jira work item. For example, git commit -m "JRA-123 <commit-desc>".

3) When you create a pull request, use the key in the pull request title.

After you push your branch, you’ll see development information in your Jira work item. 
