# Contributing

Thanks for helping improve Maintainer Sentinel.

## Local setup

```bash
npm install
npm test
npm run build
```

## Project principles

- Keep the default workflow read-only.
- Prefer clear maintainer-facing reports over hidden automation.
- Do not add features that mutate issues, PRs, or labels without an explicit opt-in design.
- Keep tests fixture-based when GitHub API calls are not required.

## Pull requests

Please include:

- A short summary of the maintainer workflow being improved.
- Tests for parsing, analysis, or report rendering changes.
- Documentation updates for new commands or report sections.
