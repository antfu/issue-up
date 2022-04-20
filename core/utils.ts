import type { IssueComment } from '@octokit/webhooks-types'
import { COMMENT_UPDATE_COMMENT_RE } from './constants'
import type { Context } from './types'

export function info(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(...args)
}

export async function getExistingUpdateComment(ctx: Context, number: number) {
  const { data: comments } = await ctx.octokit.rest.issues.listComments({
    ...ctx.source,
    issue_number: number,
  })

  let match: RegExpMatchArray | null | undefined
  const comment = comments.find((i) => {
    match = i.body?.match(COMMENT_UPDATE_COMMENT_RE)
    return match
  })

  if (!comment || !match)
    return undefined

  return {
    comment,
    upsteam: {
      owner: match[1],
      repo: match[2],
      issue_number: +match[3],
    },
  }
}

export async function updateComment(ctx: Context, number: number, body: string, existing?: IssueComment) {
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
