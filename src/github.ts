import type {
  GitHubIssue,
  GitHubPullRequest,
  GitHubRelease,
  GitHubRepo,
  RepositoryRef,
  RepositorySnapshot,
} from './types.js'

const GITHUB_API_BASE_URL = 'https://api.github.com'

export function parseRepositoryRef(input: string): RepositoryRef {
  const match = input.trim().match(/^([^/\s]+)\/([^/\s]+)$/)

  if (!match) {
    throw new Error('Repository must be in owner/repo format, for example openai/openai-node.')
  }

  return {
    owner: match[1],
    repo: match[2],
  }
}

export interface GitHubClientOptions {
  token?: string
  fetchImpl?: typeof fetch
}

export class GitHubClient {
  private readonly token?: string
  private readonly fetchImpl: typeof fetch

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async fetchSnapshot(ref: RepositoryRef): Promise<RepositorySnapshot> {
    const [repo, issuesAndPullRequests, pullRequests, releases] = await Promise.all([
      this.request<GitHubRepo>(`/repos/${ref.owner}/${ref.repo}`),
      this.request<GitHubIssue[]>(`/repos/${ref.owner}/${ref.repo}/issues?state=open&per_page=100`),
      this.request<GitHubPullRequest[]>(`/repos/${ref.owner}/${ref.repo}/pulls?state=open&per_page=100`),
      this.request<GitHubRelease[]>(`/repos/${ref.owner}/${ref.repo}/releases?per_page=20`),
    ])

    return {
      repo,
      issues: issuesAndPullRequests.filter((issue) => !issue.pull_request),
      pullRequests,
      releases,
    }
  }

  private async request<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(`${GITHUB_API_BASE_URL}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'maintainer-sentinel',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    })

    if (!response.ok) {
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
      const rateLimitReset = response.headers.get('x-ratelimit-reset')
      const rateLimitMessage =
        response.status === 403 && rateLimitRemaining === '0' && rateLimitReset
          ? ` GitHub rate limit exceeded. Retry after ${new Date(Number(rateLimitReset) * 1000).toISOString()} or set GITHUB_TOKEN.`
          : ''

      throw new Error(`GitHub API ${response.status} ${response.statusText} for ${path}.${rateLimitMessage}`)
    }

    return (await response.json()) as T
  }
}
