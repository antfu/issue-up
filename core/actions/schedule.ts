import type { Issue } from '@octokit/webhooks-types'
import type { Context } from '../types'
import { info } from '../utils'
import { updateIssue } from './update'

/**
 * Scan all issues under the repo and update
 */
export async function schedule(ctx: Context) {
  const { octokit } = ctx
  const { data: issues } = await octokit.rest.search.issuesAndPullRequests({
    ...ctx.source,
    q: `is:issue is:open label:${ctx.config.tag}`,
  })
  info(`${issues.items.length} issues found \n`)
  for (const issue of issues.items)
    await updateIssue(ctx, issue as Issue)
}
