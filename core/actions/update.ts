import type { Issue } from '@octokit/webhooks-types'
import type { Context } from '../types'
import { getExistingUpdateComment, info, updateComment } from '../utils'
import { COMMENT_FORWARD_ISSUE, COMMENT_UPDATE_COMMENT, SAME_ISSUE_RATE } from '../constants'
import { readConfig } from '../config'

const inProgressMap = new Map<string, number>()

/**
 * Check issue labels and create forward issue if needed
 */
export async function updateIssue(ctx: Context, issue: Issue) {
  if (!issue)
    return
  if (issue.state !== 'open')
    return info('>>> The issue is not open')

  const key = `${ctx.source.owner}/${ctx.source.repo}/${issue.number}`
  if (Date.now() - (inProgressMap.get(key) || 0) < SAME_ISSUE_RATE)
    return info(`>>> Throttled for ${key}`)
  inProgressMap.set(key, Date.now())

  const { octokit } = ctx
  const { tag: triggerTag, upstream: upstreamMap } = await readConfig(ctx, true)

  const number = issue.number
  const labels: string[] = (issue.labels || [])
    .map((i: any) => i && i.name)
    .filter(Boolean)

  info('-------')
  info(`Checkout issue: ${issue.html_url} [${labels.join(', ')}]`)

  if (!labels.includes(triggerTag))
    return info(`>>> Non-target issue (no "${triggerTag}" tag)`)

  const targets = Object.keys(upstreamMap).filter(i => labels.includes(i))
  if (!targets.length)
    return info(`>>> No upstream tag found (supports: ${Object.keys(upstreamMap).join(', ')})`)
  if (targets.length !== 1)
    return info(`>>> Multiple upstream tags found (${targets.join(', ')}), failed to determine which one to use`)

  const target = targets[0]
  const upstreamName = upstreamMap[target]
  const upstreamIssueLink = `https://github.com/${upstreamName}/issues/`

  info(`
tag:  ${target}
upstream: ${upstreamName}
`.trim())

  let forwardIssueNo: number | undefined
  const { comment: existing } = (await getExistingUpdateComment(ctx, number)) || {}

  info(`Existing Comment: ${existing?.html_url}`)

  const [owner, repo] = upstreamName.split('/')
  if (!existing) {
    const { data: forwarded } = await octokit.rest.issues.create({
      owner,
      repo,
      title: issue.title,
      body: `
${COMMENT_FORWARD_ISSUE(ctx.source.owner, ctx.source.repo, issue.number)}

<table><td><img width="760" height="0" src="${issue.html_url}">

&nbsp;&nbsp;&nbsp;Forwarded from downstream issue:
- ${issue.html_url} by @${issue.user.login}

</td></table><br>

${issue.body || ''}
    `,
    })
    info(`Issue Created: ${forwarded.html_url}`)
    forwardIssueNo = forwarded.number

    const { data: comment } = await updateComment(ctx, number, `
${COMMENT_UPDATE_COMMENT(owner, repo, forwardIssueNo)}\n
Upstream issue created:
- ${upstreamIssueLink}${forwardIssueNo}
`.trim(),
    existing)
    info(`Updating comment: ${comment.html_url}`)
  }

  if (existing?.body) {
    const index = existing.body.indexOf(upstreamIssueLink)
    if (index) {
      const number = +(existing.body.slice(index + upstreamIssueLink.length).match(/^\d+/)?.[0] || 0)
      if (number)
        forwardIssueNo = number
    }
  }

  info(`Forward Issue: ${upstreamIssueLink}${forwardIssueNo}\n`)

  if (forwardIssueNo) {
    const { data: issue } = await octokit.rest.issues.get({
      repo,
      owner,
      issue_number: forwardIssueNo,
    })

    if (issue.state === 'closed') {
      info('---Close---')
      await octokit.rest.issues.update({
        ...ctx.source,
        issue_number: number,
        state: 'closed',
      })
    }
  }
}
