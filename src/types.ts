export interface RepositoryRef {
  owner: string
  repo: string
}

export interface GitHubLabel {
  name: string
}

export interface GitHubUser {
  login: string
}

export interface GitHubIssue {
  number: number
  title: string
  state: 'open' | 'closed'
  html_url: string
  created_at: string
  updated_at: string
  labels: GitHubLabel[]
  user: GitHubUser | null
  comments: number
  pull_request?: {
    html_url: string
  }
}

export interface GitHubPullRequest {
  number: number
  title: string
  state: 'open' | 'closed'
  html_url: string
  created_at: string
  updated_at: string
  draft: boolean
  user: GitHubUser | null
  requested_reviewers: GitHubUser[]
  labels?: GitHubLabel[]
  merged_at?: string | null
}

export interface GitHubRelease {
  tag_name: string
  name: string | null
  html_url: string
  published_at: string | null
  draft: boolean
  prerelease: boolean
}

export interface GitHubRepo {
  full_name: string
  html_url: string
  description: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  pushed_at: string | null
}

export interface RepositorySnapshot {
  repo: GitHubRepo
  issues: GitHubIssue[]
  pullRequests: GitHubPullRequest[]
  releases: GitHubRelease[]
}

export interface IssueBuckets {
  bug: GitHubIssue[]
  enhancement: GitHubIssue[]
  question: GitHubIssue[]
  needsTriage: GitHubIssue[]
  securityLike: GitHubIssue[]
}

export interface PullRequestSignal {
  pullRequest: GitHubPullRequest
  ageDays: number
  reviewState: 'draft' | 'waiting-for-review' | 'stale' | 'active'
  mergeRiskHints: string[]
}

export interface ReleaseReadiness {
  latestRelease: GitHubRelease | null
  latestReleaseAgeDays: number | null
  mergedPullRequestsSinceRelease: GitHubPullRequest[]
}

export interface MaintenanceAnalysis {
  snapshot: RepositorySnapshot
  generatedAt: string
  issueBuckets: IssueBuckets
  pullRequestQueue: PullRequestSignal[]
  releaseReadiness: ReleaseReadiness
  maintainerActions: string[]
}
