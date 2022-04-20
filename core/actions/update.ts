import type { Issue } from '@octokit/webhooks-types'
import type { Context } from '../types'
import { reposMap, triggerTag } from '../index'
import { getExistingComment, info, updateComment } from '../utils'
import { COMMENT_FORWARD_ISSUE, COMMENT_UPDATE_COMMENT } from '../constants'

/**
 * Check issue labels and create forward issue if needed
 */
export async function updateIssue(ctx: Context, issue: Issue) {
  if (!issue)
    return
  if (issue.state !== 'open')
    return info('>>> The issue is not open')

  const { octokit } = ctx

  const number = issue.number
  const labels: string[] = (issue.labels || [])
    .map((i: any) => i && i.name)
    .filter(Boolean)

  info(`
=== Checkout Issue #${number} ===
title: ${issue.title}
labels: ${labels.join(', ')}
`.trim())

  if (!labels.includes(triggerTag))
    return info(`>>> Non-target issue (no "${triggerTag}" tag)`)

  const targets = Object.keys(reposMap).filter(i => labels.includes(i))
  if (!targets.length)
    return info(`>>> No upstream tag found (supports: ${Object.keys(reposMap).join(', ')})`)
  if (targets.length !== 1)
    return info(`>>> Multiple upstream tags found (${targets.join(', ')}), failed to determine which one to use`)

  const target = targets[0]
  const repoLink = reposMap[target]
  const repoIssueLink = `https://github.com/${repoLink}/issues/`

  info(`
tag:  ${target}
repo: ${repoLink}
`.trim())

  const existing = await getExistingComment(ctx, number)

  info(`---Existing Comment---\n${existing?.html_url}\n`)

  let forwardIssueNo: number | undefined

  const [owner, repo] = repoLink.split('/')
  if (!existing) {
    const { data: forwarded } = await octokit.rest.issues.create({
      owner,
      repo,
      title: issue.title,
      body: `
${COMMENT_FORWARD_ISSUE}
Forwarded from downstream issue:
- ${issue.html_url} by @${issue.user.login}

<h2 align="center"><sub>Original description</sub></h2>

${issue.body || ''}
    `,
    })
    info(`---Issue Created---\n${forwarded.html_url}\n`)
    forwardIssueNo = forwarded.number

    info('---Updating comment---')
    const { data: comment } = await updateComment(ctx, number, `
${COMMENT_UPDATE_COMMENT}
Upstream issue created:
- ${repoIssueLink}${forwardIssueNo}
`.trim(),
    existing)
    info(comment.html_url)
  }

  if (existing?.body) {
    const index = existing.body.indexOf(repoIssueLink)
    if (index) {
      const number = +(existing.body.slice(index + repoIssueLink.length).match(/^\d+/)?.[0] || 0)
      if (number)
        forwardIssueNo = number
    }
  }

  info(`---Forward Issue---\n${repoIssueLink}${forwardIssueNo}\n`)

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
