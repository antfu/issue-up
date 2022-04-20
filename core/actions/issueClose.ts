import type { Context } from '../types'
import { COMMENT_FORWARD_ISSUE_RE } from '../constants'
import { getExistingUpdateComment, info } from '../utils'

export async function updateUpstream(ctx: Context) {
  const { octokit, event } = ctx
  if ('action' in event && event.action === 'closed' && 'issue' in event) {
    const body = event.issue.body || await octokit.rest.issues.get({ issue_number: event.issue.number, ...ctx.source }).then(i => i.data.body)
    const match = body?.match(COMMENT_FORWARD_ISSUE_RE)
    // is upstream issue, close downstream one
    if (match) {
      const [, owner, repo, number] = match
      info(`>>> Closing downstream issue: https://github.com/${owner}/${repo}/issues/${number}`)
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: +number,
        state: 'closed',
      })
      return true
    }
    else {
      const comment = await getExistingUpdateComment(ctx, event.issue.number)
      if (comment) {
        info(`>>> Closing upstream issue: https://github.com/${comment.upsteam.owner}/${comment.upsteam.repo}/issues/${comment.upsteam.issue_number}`)
        await octokit.rest.issues.update({
          ...comment.upsteam,
          state: 'closed',
        })
      }
    }
  }
}
