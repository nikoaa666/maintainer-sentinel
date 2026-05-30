import { describe, expect, it } from 'vitest'
import { analyzeSnapshot, bucketIssues } from '../src/analysis.js'
import { fixtureSnapshot } from './fixtures/snapshot.js'

const now = new Date('2026-05-31T10:00:00Z')

describe('bucketIssues', () => {
  it('groups issues by labels and security-like text', () => {
    const buckets = bucketIssues(fixtureSnapshot.issues)

    expect(buckets.bug.map((issue) => issue.number)).toEqual([1])
    expect(buckets.enhancement.map((issue) => issue.number)).toEqual([2])
    expect(buckets.needsTriage.map((issue) => issue.number)).toEqual([3])
    expect(buckets.securityLike.map((issue) => issue.number)).toEqual([3])
  })
})

describe('analyzeSnapshot', () => {
  it('creates actionable maintainer signals', () => {
    const analysis = analyzeSnapshot(fixtureSnapshot, now)

    expect(analysis.pullRequestQueue[0].pullRequest.number).toBe(10)
    expect(analysis.pullRequestQueue[0].reviewState).toBe('stale')
    expect(analysis.releaseReadiness.latestReleaseAgeDays).toBe(46)
    expect(analysis.maintainerActions).toContain('Review 1 security-like issue(s) before routine triage.')
    expect(analysis.maintainerActions.length).toBeLessThanOrEqual(10)
  })
})
