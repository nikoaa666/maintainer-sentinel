#!/usr/bin/env node
import { Command } from 'commander'
import { analyzeSnapshot } from './analysis.js'
import { GitHubClient, parseRepositoryRef } from './github.js'
import { renderMarkdownReport } from './report.js'

const program = new Command()

program
  .name('maintainer-sentinel')
  .description('Generate actionable maintenance reports for public GitHub repositories.')
  .version('0.1.0')

program
  .command('scan')
  .argument('<owner/repo>', 'GitHub repository in owner/repo format')
  .description('Fetch public GitHub maintenance signals as JSON.')
  .action(async (repository: string) => {
    await runWithErrors(async () => {
      const snapshot = await fetchRepositorySnapshot(repository)
      process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`)
    })
  })

program
  .command('report')
  .argument('<owner/repo>', 'GitHub repository in owner/repo format')
  .description('Generate a Markdown maintenance report.')
  .action(async (repository: string) => {
    await runWithErrors(async () => {
      const snapshot = await fetchRepositorySnapshot(repository)
      const report = renderMarkdownReport(analyzeSnapshot(snapshot))
      process.stdout.write(report)
    })
  })

program
  .command('action')
  .argument('[owner/repo]', 'GitHub repository in owner/repo format. Defaults to GITHUB_REPOSITORY.')
  .description('Generate a GitHub Action-friendly Markdown maintenance report.')
  .action(async (repository?: string) => {
    await runWithErrors(async () => {
      const targetRepository = repository ?? process.env.GITHUB_REPOSITORY

      if (!targetRepository) {
        throw new Error('Pass owner/repo or set GITHUB_REPOSITORY.')
      }

      const snapshot = await fetchRepositorySnapshot(targetRepository)
      const report = renderMarkdownReport(analyzeSnapshot(snapshot))
      process.stdout.write(report)
    })
  })

program.parseAsync(process.argv)

async function fetchRepositorySnapshot(repository: string) {
  const ref = parseRepositoryRef(repository)
  const client = new GitHubClient({ token: process.env.GITHUB_TOKEN })

  return client.fetchSnapshot(ref)
}

async function runWithErrors(callback: () => Promise<void>): Promise<void> {
  try {
    await callback()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    process.stderr.write(`maintainer-sentinel: ${message}\n`)
    process.exitCode = 1
  }
}
