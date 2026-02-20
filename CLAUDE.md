# CLAUDE.md — AI Assistant Guide for tcs-ai-hackathon

## Project Overview

This is the **TCS AI Hackathon** project repository. It is a greenfield codebase — newly initialized with no existing code, frameworks, or CI/CD pipelines yet in place. All structure, tooling, and conventions should be established as development progresses.

## Repository Status

- **Current state**: Empty repository (no source files, no dependencies, no build configuration)
- **Branch strategy**: Feature branches prefixed with `claude/` for AI-assisted development
- **Remote**: GitHub — `Ramanuja-Chanduri/tcs-ai-hackathon`

## Development Guidelines

### Getting Started

Since this is a new project, the first steps for any contributor are:

1. Choose a language/framework appropriate for the hackathon task
2. Initialize the project (e.g., `npm init`, `pip install`, `cargo init`, etc.)
3. Add a `.gitignore` suited to the chosen stack
4. Set up a basic project structure

### Git Workflow

- **Default branch**: `main`
- **Feature branches**: Use descriptive branch names (e.g., `feature/auth`, `fix/parsing-bug`)
- **Commits**: Write clear, concise commit messages describing the "why" not just the "what"
- **Push**: Always use `git push -u origin <branch-name>`

### Code Quality

- Keep code simple and focused — hackathon code should prioritize working solutions
- Add comments only where logic is non-obvious
- Avoid over-engineering; build the minimum viable solution first
- Do not commit secrets, API keys, or credentials — use environment variables

### File Organization (Recommended)

```
tcs-ai-hackathon/
├── CLAUDE.md          # This file — AI assistant context
├── README.md          # Project description, setup instructions, usage
├── .gitignore         # Language/framework-specific ignores
├── src/               # Source code
├── tests/             # Test files
├── docs/              # Documentation (if needed)
└── data/              # Data files (if needed, .gitignore large files)
```

### Security

- Never commit `.env` files, API keys, tokens, or credentials
- Use environment variables for all sensitive configuration
- Validate all external input at system boundaries
- Be cautious with dependencies — only add what is necessary

## Conventions for AI Assistants

- **Read before modifying**: Always read existing files before suggesting changes
- **Minimal changes**: Only modify what is necessary to accomplish the task
- **No speculative features**: Do not add functionality beyond what is requested
- **Preserve existing style**: Match the coding style already present in the file
- **Test awareness**: If tests exist, run them after making changes
- **Update this file**: When significant project structure or tooling decisions are made, update this CLAUDE.md to reflect the current state

## Build & Run Commands

> **Note**: No build system has been configured yet. Update this section once the tech stack is chosen.

<!-- Example entries to fill in later:
- **Install dependencies**: `npm install` / `pip install -r requirements.txt`
- **Run dev server**: `npm run dev` / `python app.py`
- **Run tests**: `npm test` / `pytest`
- **Build for production**: `npm run build`
- **Lint**: `npm run lint` / `flake8 .`
-->

## Tech Stack

> **Note**: No technology stack has been selected yet. Update this section as decisions are made.

<!-- Example:
- **Language**: Python 3.11 / TypeScript 5.x
- **Framework**: FastAPI / Next.js
- **Database**: PostgreSQL / SQLite
- **AI/ML**: Claude API / Anthropic SDK
-->
