import type { Octokit } from '@octokit/rest'
import type { Issue, WebhookEvent } from '@octokit/webhooks-types'

export const COMMENT_UPDATE_COMMENT = '<!-- upissues-update-comment -->'
export const COMMENT_FORWARD_ISSUE = '<!-- upissues-forward-issue -->'
export const COMMENT_DISABLED = '<!-- upissues-forward-disabled -->'

const triggerTag = 'upstream'
const reposMap = {
  utils: 'antfu/utils',
}

function info(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(...args)
}

export interface Context {
  octokit: Octokit
  event: WebhookEvent
  source: {
    owner: string
    repo: string
  }
}

export async function runAction(ctx: Context) {
  const { event, octokit } = ctx
  if ('issue' in event) {
    await updateIssue(ctx, event.issue)
  }
  else if ('repository' in event) {
    const [owner, repo] = event.repository.full_name.split('/')
    const { data: issues } = await octokit.rest.search.issuesAndPullRequests({
      owner,
      repo,
      q: `is:issue is:open label:${triggerTag}`,
    })
    info(`${issues.items.length} issues found \n`)
    for (const issue of issues.items)
      await updateIssue(ctx, issue as Issue)
  }
}

async function updateIssue(ctx: Context, issue: Issue) {
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

async function getExistingComment(ctx: Context, number: number) {
  const { data: comments } = await ctx.octokit.rest.issues.listComments({
    ...ctx.source,
    issue_number: number,
  })

  const existing_comment = comments.find(i => i.body?.includes(COMMENT_UPDATE_COMMENT))

  return existing_comment
}

async function updateComment(ctx: Context, number: number, body: string, existing?: Awaited<ReturnType<typeof getExistingComment>>) {
  if (existing) {
    return await ctx.octokit.rest.issues.updateComment({
      ...ctx.source,
      comment_id: existing.id,
      issue_number: number,
      body,
    })
  }
  else {
    return await ctx.octokit.rest.issues.createComment({
      ...ctx.source,
      issue_number: number,
      body,
    })
  }
}
