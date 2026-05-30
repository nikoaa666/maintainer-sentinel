import type {
  GitHubIssue,
  GitHubPullRequest,
  GitHubRelease,
  IssueBuckets,
  MaintenanceAnalysis,
  PullRequestSignal,
  ReleaseReadiness,
  RepositorySnapshot,
} from './types.js'

const DAY_IN_MS = 24 * 60 * 60 * 1000
const SECURITY_TERMS = [
  'security',
  'vulnerability',
  'cve',
  'xss',
  'csrf',
  'rce',
  'injection',
  'secret',
  'token',
  'credential',
  'leak',
]

export function analyzeSnapshot(snapshot: RepositorySnapshot, now = new Date()): MaintenanceAnalysis {
  const issueBuckets = bucketIssues(snapshot.issues)
  const pullRequestQueue = snapshot.pullRequests
    .map((pullRequest) => analyzePullRequest(pullRequest, now))
    .sort((left, right) => right.ageDays - left.ageDays)
  const releaseReadiness = analyzeReleaseReadiness(snapshot.releases, snapshot.pullRequests, now)
  const maintainerActions = buildMaintainerActions(issueBuckets, pullRequestQueue, releaseReadiness)

  return {
    snapshot,
    generatedAt: now.toISOString(),
    issueBuckets,
    pullRequestQueue,
    releaseReadiness,
    maintainerActions,
  }
}

export function bucketIssues(issues: GitHubIssue[]): IssueBuckets {
  return {
    bug: issues.filter((issue) => hasLabel(issue, ['bug', 'type: bug'])),
    enhancement: issues.filter((issue) => hasLabel(issue, ['enhancement', 'feature', 'type: feature'])),
    question: issues.filter((issue) => hasLabel(issue, ['question', 'support'])),
    needsTriage: issues.filter((issue) => issue.labels.length === 0 || hasLabel(issue, ['needs triage', 'triage'])),
    securityLike: issues.filter(isSecurityLikeIssue),
  }
}

export function analyzePullRequest(pullRequest: GitHubPullRequest, now = new Date()): PullRequestSignal {
  const ageDays = daysBetween(pullRequest.created_at, now)
  const staleDays = daysBetween(pullRequest.updated_at, now)
  const mergeRiskHints = [
    ...(pullRequest.draft ? ['Draft PR'] : []),
    ...(ageDays >= 14 ? [`Open for ${ageDays} days`] : []),
    ...(staleDays >= 7 ? [`No update for ${staleDays} days`] : []),
    ...(pullRequest.requested_reviewers.length === 0 && !pullRequest.draft ? ['No requested reviewers'] : []),
  ]

  return {
    pullRequest,
    ageDays,
    reviewState: getReviewState(pullRequest, ageDays, staleDays),
    mergeRiskHints,
  }
}

export function analyzeReleaseReadiness(
  releases: GitHubRelease[],
  pullRequests: GitHubPullRequest[],
  now = new Date(),
): ReleaseReadiness {
  const latestRelease = releases
    .filter((release) => !release.draft && release.published_at)
    .sort((left, right) => Date.parse(right.published_at ?? '') - Date.parse(left.published_at ?? ''))[0] ?? null
  const latestReleaseTime = latestRelease?.published_at ? Date.parse(latestRelease.published_at) : null
  const mergedPullRequestsSinceRelease =
    latestReleaseTime === null
      ? []
      : pullRequests.filter((pullRequest) => {
          if (!pullRequest.merged_at) {
            return false
          }

          return Date.parse(pullRequest.merged_at) > latestReleaseTime
        })

  return {
    latestRelease,
    latestReleaseAgeDays: latestRelease?.published_at ? daysBetween(latestRelease.published_at, now) : null,
    mergedPullRequestsSinceRelease,
  }
}

function buildMaintainerActions(
  issueBuckets: IssueBuckets,
  pullRequestQueue: PullRequestSignal[],
  releaseReadiness: ReleaseReadiness,
): string[] {
  const actions = [
    ...(issueBuckets.securityLike.length > 0
      ? [`Review ${issueBuckets.securityLike.length} security-like issue(s) before routine triage.`]
      : []),
    ...(issueBuckets.needsTriage.length > 0
      ? [`Triage ${issueBuckets.needsTriage.length} unlabeled or needs-triage issue(s).`]
      : []),
    ...(pullRequestQueue.filter((signal) => signal.reviewState === 'stale').length > 0
      ? [`Refresh ${pullRequestQueue.filter((signal) => signal.reviewState === 'stale').length} stale PR(s).`]
      : []),
    ...(pullRequestQueue.filter((signal) => signal.reviewState === 'waiting-for-review').length > 0
      ? [`Assign reviewers for ${pullRequestQueue.filter((signal) => signal.reviewState === 'waiting-for-review').length} PR(s).`]
      : []),
    ...(releaseReadiness.latestReleaseAgeDays !== null && releaseReadiness.latestReleaseAgeDays >= 30
      ? [`Consider a release; latest release is ${releaseReadiness.latestReleaseAgeDays} days old.`]
      : []),
    ...(issueBuckets.bug.length > 0 ? [`Prioritize the top ${Math.min(issueBuckets.bug.length, 5)} open bug issue(s).`] : []),
    ...(issueBuckets.enhancement.length > 0
      ? [`Group ${issueBuckets.enhancement.length} enhancement request(s) into a roadmap pass.`]
      : []),
  ]

  return actions.slice(0, 10)
}

function getReviewState(
  pullRequest: GitHubPullRequest,
  ageDays: number,
  staleDays: number,
): PullRequestSignal['reviewState'] {
  if (pullRequest.draft) {
    return 'draft'
  }

  if (ageDays >= 14 || staleDays >= 7) {
    return 'stale'
  }

  if (pullRequest.requested_reviewers.length === 0) {
    return 'waiting-for-review'
  }

  return 'active'
}

function isSecurityLikeIssue(issue: GitHubIssue): boolean {
  const labels = issue.labels.map((label) => label.name.toLowerCase())
  const title = issue.title.toLowerCase()

  return SECURITY_TERMS.some((term) => title.includes(term) || labels.some((label) => label.includes(term)))
}

function hasLabel(issue: GitHubIssue, expectedLabels: string[]): boolean {
  const issueLabels = issue.labels.map((label) => label.name.toLowerCase())

  return expectedLabels.some((expectedLabel) => issueLabels.includes(expectedLabel))
}

function daysBetween(dateInput: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(dateInput)) / DAY_IN_MS))
}
