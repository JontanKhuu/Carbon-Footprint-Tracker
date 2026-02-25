# Git Workflow Best Practices

## Overview
This document outlines the recommended Git workflow for this project. Following these practices will help maintain a clean, stable main branch and make collaboration easier.

## Core Workflow

### 1. Always Branch from Main
**NEVER commit directly to `main` branch.**

Before starting any work:
```bash
# Make sure you're on main and it's up to date
git checkout main
git pull origin main

# Create a new branch for your feature/fix
git checkout -b feature/your-feature-name
# OR for bug fixes:
git checkout -b fix/your-fix-name
```

**Branch Naming Conventions:**
- `feature/description` - For new features
- `fix/description` - For bug fixes
- `refactor/description` - For code refactoring
- `docs/description` - For documentation updates

### 2. Work on Your Branch

Make your changes, commit frequently with clear messages:

```bash
# Stage your changes
git add .

# Check what will be committed (VERY IMPORTANT!)
git status

# Verify .gitignore is working - unwanted files shouldn't appear
# If they do, unstage them:
# git restore --staged unwanted-file.txt

# Commit with a clear message
git commit -m "Brief description of changes

- Detail 1
- Detail 2
- Detail 3"
```

**Commit Message Best Practices:**
- Use present tense: "Add feature" not "Added feature"
- Be specific and descriptive
- First line should be a brief summary (50-72 characters)
- Add details in the body if needed
- Reference issue numbers if applicable: "Fix #123"

### 3. Test Your Changes Locally

**Before pushing, always test:**

```bash
# For backend changes:
cd backend
# Run tests if available
python -m pytest  # or your test command

# For frontend changes:
cd frontend
# Run linter
npm run lint
# Run tests if available
npm test

# Test the application manually
# Start services and verify everything works
```

**Checklist before pushing:**
- [ ] Code compiles/builds successfully
- [ ] All tests pass
- [ ] Linter shows no errors
- [ ] Application runs without errors
- [ ] Manual testing completed
- [ ] No console errors in browser
- [ ] No unintended files in `git status`

### 4. Push Your Branch

```bash
# Push your branch to remote
git push origin feature/your-feature-name

# If it's the first push, set upstream:
git push -u origin feature/your-feature-name
```

### 5. Verify on Remote (CI/CD)

After pushing:
- [ ] Check GitHub Actions/CI pipeline
- [ ] Ensure all tests pass in CI
- [ ] Fix any CI failures before merging

### 6. Create Pull Request (PR)

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch to merge into `main`
4. Fill out PR description:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots if UI changes
5. Request review if working with a team
6. Wait for CI/CD to pass

### 7. Merge to Main

**Only merge when:**
- [ ] All CI/CD checks pass
- [ ] Code review approved (if required)
- [ ] All tests pass
- [ ] No merge conflicts
- [ ] You've verified the PR diff is correct

**Merge options:**
- **Squash and merge** (Recommended for feature branches)
  - Combines all commits into one clean commit
  - Keeps main branch history clean
- **Merge commit** (For complex branches with multiple logical commits)
- **Rebase and merge** (For linear history, use carefully)

After merging:
```bash
# Switch back to main
git checkout main

# Pull the latest changes
git pull origin main

# Delete your local branch (optional cleanup)
git branch -d feature/your-feature-name
```

## Best Practices

### General Guidelines

1. **Small, Focused Commits**
   - Each commit should represent one logical change
   - Easier to review, revert, and understand history

2. **Commit Often**
   - Don't wait until everything is done
   - Commit working increments
   - Makes it easier to identify when bugs were introduced

3. **Write Clear Commit Messages**
   - Explain WHAT and WHY, not just what files changed
   - Future you (and teammates) will thank you

4. **Keep Branches Up to Date**
   ```bash
   # Regularly sync your branch with main
   git checkout main
   git pull origin main
   git checkout feature/your-feature-name
   git merge main
   # OR use rebase (be careful with shared branches):
   git rebase main
   ```

5. **Don't Commit**
   - Secrets, API keys, passwords
   - Large binary files
   - Generated files (unless necessary)
   - Files listed in `.gitignore`
   - Temporary/debug code

6. **Use .gitignore Properly**
   - Check `git status` before committing
   - If unwanted files appear, they might be tracked
   - Use `git rm --cached filename` to untrack them

### Before Every Commit

```bash
# 1. Check what will be committed
git status

# 2. Review the actual changes
git diff

# 3. Verify no unwanted files
# Look for:
# - .env files
# - node_modules
# - build artifacts
# - log files
# - Files in .gitignore

# 4. Test your changes
# Run tests, linter, manual testing

# 5. Stage only what you want
git add specific-file.ts
# OR
git add .  # Only if you're sure everything is correct

# 6. Commit
git commit -m "Clear message"
```

### Handling Mistakes

**If you committed to main by accident:**
```bash
# Create a branch from current state
git branch backup-branch
git checkout main
git reset --hard origin/main
git checkout backup-branch
# Now move your changes to a proper branch
```

**If you need to undo a commit (before pushing):**
```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, discard changes
git reset --hard HEAD~1
```

**If you need to fix the last commit message:**
```bash
git commit --amend -m "New message"
```

**If you already pushed and need to fix:**
- Create a new commit with the fix
- Or use `git commit --amend` and force push (ONLY on your own branches, never on main)

## Quick Reference

### Daily Workflow
```bash
# Morning: Get latest changes
git checkout main
git pull origin main

# Start work: Create branch
git checkout -b feature/my-feature

# During work: Commit frequently
git add .
git status  # ALWAYS check first!
git commit -m "Description"

# End of day: Push progress
git push origin feature/my-feature

# When done: Create PR and merge
# Then cleanup:
git checkout main
git pull origin main
git branch -d feature/my-feature
```

### Emergency Hotfix Workflow
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Make fix, test thoroughly
git add .
git commit -m "Fix: Critical bug description"
git push origin hotfix/critical-bug

# Create PR, merge immediately after review
# Also merge back to develop/maintain branches if applicable
```

## Common Mistakes to Avoid

1. ❌ Committing directly to `main`
2. ❌ Pushing without testing locally
3. ❌ Committing files that should be in `.gitignore`
4. ❌ Writing vague commit messages like "fix" or "update"
5. ❌ Committing secrets or sensitive data
6. ❌ Force pushing to `main` or shared branches
7. ❌ Merging without ensuring CI/CD passes
8. ❌ Creating huge commits with many unrelated changes

## Remember

- **Main branch should always be stable and deployable**
- **Test before you push**
- **Review before you merge**
- **When in doubt, create a branch**
- **Small, frequent commits are better than large, infrequent ones**

---

*Last updated: [Auto-updated on commit]*
*This file is in .gitignore to keep it local and personal*

