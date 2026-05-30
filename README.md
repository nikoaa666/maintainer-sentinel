# Maintainer Sentinel

A GitHub maintainer assistant that turns issues, PRs, releases, and repo health signals into actionable maintenance reports.

Maintainer Sentinel is intentionally read-only in its first release. It does not comment, label, close issues, or mutate repositories. It fetches public GitHub metadata and produces a Markdown report a maintainer can review before taking action.

## Why this exists

Small and mid-sized open source maintainers often carry the whole maintenance loop: issue triage, PR review, release planning, documentation updates, and security follow-up. Maintainer Sentinel helps make that work visible and repeatable without replacing maintainer judgment.

## Install

```bash
npm install -g maintainer-sentinel
```

Or run without installing:

```bash
npx maintainer-sentinel report owner/repo
```

## Usage

Generate raw public GitHub metadata:

```bash
maintainer-sentinel scan openai/openai-node
```

Generate a Markdown maintenance report:

```bash
maintainer-sentinel report openai/openai-node
```

Use a token for a higher GitHub API rate limit:

```bash
GITHUB_TOKEN=ghp_your_token maintainer-sentinel report owner/repo
```

## Report Sections

- Repo overview
- Open issue buckets: bugs, enhancements, questions, needs triage, security-like
- PR queue: age, review state, and merge-risk hints
- Release readiness
- Maintainer actions, capped at 10 suggestions

## GitHub Action Example

```yaml
name: Maintainer Sentinel

on:
  schedule:
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  report:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: read
      pull-requests: read
    steps:
      - uses: actions/setup-node@v5
        with:
          node-version: 20
      - run: npx maintainer-sentinel action "$GITHUB_REPOSITORY" > maintainer-report.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v5
        with:
          name: maintainer-sentinel-report
          path: maintainer-report.md
```

## OpenAI API Roadmap

Maintainer Sentinel can be useful without AI. API-powered features will stay optional and reviewable:

- Summarize long issue threads.
- Draft PR review checklists.
- Draft release notes from merged work.
- Highlight security-like issue patterns for maintainer review.

## Codex for Open Source Application Note

This project is designed as an honest early-stage open source maintainer tool. Any application for Codex for Open Source should report real project signals only: stars, npm downloads, feedback, demo repositories, and maintainer activity. Do not fabricate adoption or usage.

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
