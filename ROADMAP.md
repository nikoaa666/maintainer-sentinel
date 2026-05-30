# Roadmap

Maintainer Sentinel is scoped around one principle: help maintainers make better decisions without surprising repository mutations.

## v0.1.x - Read-only report quality

- Improve issue and PR classification rules with real maintainer feedback.
- Add more fixture coverage for large repos, empty repos, archived repos, and repositories with no releases.
- Publish the npm package and keep the install path stable.
- Collect feedback from maintainers of 3-5 small or mid-sized open source projects.

## v0.2.x - Reviewable AI assistance

- Add optional OpenAI-powered issue thread summaries.
- Add optional PR review checklist drafts.
- Add optional release note drafts from merged PRs and issue references.
- Keep all AI output reviewable and disabled by default.

## v0.3.x - Maintainer workflow integrations

- Add a first-class GitHub Action configuration file.
- Add optional report issue creation behind an explicit opt-in flag.
- Add JSON output for dashboards and downstream automation.
- Add documentation for safe use in community-maintained repositories.

## Not planned by default

- Auto-closing issues.
- Auto-labeling issues or PRs without maintainer opt-in.
- Sending repository data to third-party APIs without explicit configuration.
