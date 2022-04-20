import type { Context } from '../types'
import { getExistingUpdateComment, info, updateComment } from '../utils'
import { COMMENT_FORWARD_ISSUE, COMMENT_UPDATE_COMMENT, SAME_ISSUE_RATE } from '../constants'
import { readConfig } from '../config'

const inProgressMap = new Map<string, number>()

/**
 * Check issue labels and create forward issue if needed
 */
export async function handleIssueLabled(ctx: Context) {
  const { octokit, event } = ctx
  if (!('issue' in event && event.action === 'labeled' && event.label?.name))
    return

  const { issue } = event
  if (issue.state === 'closed')
    return

  // deduplicate
  const key = `${ctx.source.owner}/${ctx.source.repo}/${issue.number}`
  if (Date.now() - (inProgressMap.get(key) || 0) < SAME_ISSUE_RATE)
    return info(`>>> Throttled for ${key}`)
  inProgressMap.set(key, Date.now())

  const labels: string[] = (issue.labels || [])
    .map((i: any) => i && i.name)
    .filter(Boolean)
  const lastLabel = labels[labels.length - 1]
  if (lastLabel !== event.label.name)
    return info('>>> Not the last label, skipping')

  const { tag: triggerTag, upstream: upstreamMap } = await readConfig(ctx, true)

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

  info(`
tag:  ${target}
upstream: ${upstreamName}
`.trim())

  const { comment: existing } = (await getExistingUpdateComment(ctx, issue.number)) || {}

  if (existing) {
    info(`Existing comment: ${existing?.html_url}`)
    return
  }

  const [owner, repo] = upstreamName.split('/')
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
  info(`Upstream issue created: ${forwarded.html_url}`)

  const { data: comment } = await updateComment(ctx, issue.number, `
${COMMENT_UPDATE_COMMENT(owner, repo, forwarded.number)}\n
Upstream issue created:
- ${forwarded.html_url}
`.trim(),
  existing)
  info(`Comment created: ${comment.html_url}`)

  return true
}
