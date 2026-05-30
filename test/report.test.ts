import { describe, expect, it } from 'vitest'
import { analyzeSnapshot } from '../src/analysis.js'
import { renderMarkdownReport } from '../src/report.js'
import { fixtureSnapshot } from './fixtures/snapshot.js'

describe('renderMarkdownReport', () => {
  it('renders the expected maintenance sections', () => {
    const report = renderMarkdownReport(analyzeSnapshot(fixtureSnapshot, new Date('2026-05-31T10:00:00Z')))

    expect(report).toContain('# Maintainer Sentinel Report: example/toolkit')
    expect(report).toContain('## Repo Overview')
    expect(report).toContain('## Open Issue Buckets')
    expect(report).toContain('## PR Queue')
    expect(report).toContain('## Release Readiness')
    expect(report).toContain('## Maintainer Actions')
    expect(report).toContain('Possible token leak in verbose logs')
  })
})
