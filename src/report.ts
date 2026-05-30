import type { GitHubIssue, MaintenanceAnalysis, PullRequestSignal } from './types.js'

export function renderMarkdownReport(analysis: MaintenanceAnalysis): string {
  const { snapshot, issueBuckets, pullRequestQueue, releaseReadiness } = analysis

  return [
    `# Maintainer Sentinel Report: ${snapshot.repo.full_name}`,
    '',
    `Generated: ${analysis.generatedAt}`,
    '',
    '## Repo Overview',
    '',
    `- Repository: [${snapshot.repo.full_name}](${snapshot.repo.html_url})`,
    `- Description: ${snapshot.repo.description ?? 'No description provided.'}`,
    `- Stars: ${snapshot.repo.stargazers_count}`,
    `- Forks: ${snapshot.repo.forks_count}`,
    `- Open issues count from GitHub: ${snapshot.repo.open_issues_count}`,
    `- Default branch: ${snapshot.repo.default_branch}`,
    `- Last push: ${snapshot.repo.pushed_at ?? 'Unknown'}`,
    '',
    '## Open Issue Buckets',
    '',
    renderIssueBucket('Bug', issueBuckets.bug),
    renderIssueBucket('Enhancement', issueBuckets.enhancement),
    renderIssueBucket('Question', issueBuckets.question),
    renderIssueBucket('Needs triage', issueBuckets.needsTriage),
    renderIssueBucket('Security-like', issueBuckets.securityLike),
    '',
    '## PR Queue',
    '',
    renderPullRequestQueue(pullRequestQueue),
    '',
    '## Release Readiness',
    '',
    releaseReadiness.latestRelease
      ? `- Latest release: [${releaseReadiness.latestRelease.tag_name}](${releaseReadiness.latestRelease.html_url}) (${releaseReadiness.latestReleaseAgeDays} days old)`
      : '- Latest release: none found',
    `- Merged PRs since latest release: ${releaseReadiness.mergedPullRequestsSinceRelease.length}`,
    '',
    '## Maintainer Actions',
    '',
    analysis.maintainerActions.length > 0
      ? analysis.maintainerActions.map((action, index) => `${index + 1}. ${action}`).join('\n')
      : 'No urgent maintainer actions detected from the available public metadata.',
    '',
  ].join('\n')
}

function renderIssueBucket(title: string, issues: GitHubIssue[]): string {
  const lines = [`### ${title} (${issues.length})`, '']

  if (issues.length === 0) {
    return [...lines, 'No matching issues.'].join('\n')
  }

  return [
    ...lines,
    ...issues
      .slice(0, 5)
      .map((issue) => `- #${issue.number} [${escapeMarkdown(issue.title)}](${issue.html_url}) (${issue.comments} comments)`),
    ...(issues.length > 5 ? [`- ...and ${issues.length - 5} more`] : []),
  ].join('\n')
}

function renderPullRequestQueue(signals: PullRequestSignal[]): string {
  if (signals.length === 0) {
    return 'No open pull requests found.'
  }

  return signals
    .slice(0, 10)
    .map((signal) => {
      const hints = signal.mergeRiskHints.length > 0 ? `; ${signal.mergeRiskHints.join(', ')}` : ''

      return `- #${signal.pullRequest.number} [${escapeMarkdown(signal.pullRequest.title)}](${signal.pullRequest.html_url}) - ${signal.reviewState}, ${signal.ageDays} days old${hints}`
    })
    .join('\n')
}

function escapeMarkdown(input: string): string {
  return input.replaceAll('[', '\\[').replaceAll(']', '\\]')
}
