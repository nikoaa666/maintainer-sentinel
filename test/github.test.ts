import { describe, expect, it, vi } from 'vitest'
import { GitHubClient, parseRepositoryRef } from '../src/github.js'

describe('parseRepositoryRef', () => {
  it('accepts owner/repo input', () => {
    expect(parseRepositoryRef('openai/openai-node')).toEqual({ owner: 'openai', repo: 'openai-node' })
  })

  it('rejects invalid repository input', () => {
    expect(() => parseRepositoryRef('not-a-repo')).toThrow('owner/repo')
  })
})

describe('GitHubClient', () => {
  it('filters pull requests out of the issues response', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      const body = getMockBody(url)

      return new Response(JSON.stringify(body), { status: 200 })
    }) as unknown as typeof fetch
    const client = new GitHubClient({ fetchImpl, token: 'test-token' })
    const snapshot = await client.fetchSnapshot({ owner: 'example', repo: 'toolkit' })

    expect(snapshot.issues).toHaveLength(1)
    expect(snapshot.issues[0].number).toBe(1)
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('surfaces rate limit guidance', async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response('{}', {
        status: 403,
        statusText: 'Forbidden',
        headers: {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1780000000',
        },
      })
    }) as unknown as typeof fetch
    const client = new GitHubClient({ fetchImpl })

    await expect(client.fetchSnapshot({ owner: 'example', repo: 'toolkit' })).rejects.toThrow('set GITHUB_TOKEN')
  })
})

function getMockBody(url: string): unknown {
  if (url.includes('/issues?')) {
    return [
      {
        number: 1,
        title: 'Bug',
        state: 'open',
        html_url: 'https://github.com/example/toolkit/issues/1',
        created_at: '2026-05-01T10:00:00Z',
        updated_at: '2026-05-02T10:00:00Z',
        labels: [],
        user: { login: 'alice' },
        comments: 0,
      },
      {
        number: 2,
        title: 'PR',
        state: 'open',
        html_url: 'https://github.com/example/toolkit/issues/2',
        created_at: '2026-05-01T10:00:00Z',
        updated_at: '2026-05-02T10:00:00Z',
        labels: [],
        user: { login: 'alice' },
        comments: 0,
        pull_request: { html_url: 'https://github.com/example/toolkit/pull/2' },
      },
    ]
  }

  if (url.includes('/pulls?')) {
    return []
  }

  if (url.includes('/releases?')) {
    return []
  }

  return {
    full_name: 'example/toolkit',
    html_url: 'https://github.com/example/toolkit',
    description: null,
    stargazers_count: 0,
    forks_count: 0,
    open_issues_count: 1,
    default_branch: 'main',
    pushed_at: null,
  }
}
