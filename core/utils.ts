import YAML from 'js-yaml'
import { COMMENT_UPDATE_COMMENT } from './constants'
import type { Context } from './types'

export function info(...args: any[]) {
  // eslint-disable-next-line no-console
  console.log(...args)
}

export async function getExistingComment(ctx: Context, number: number) {
  const { data: comments } = await ctx.octokit.rest.issues.listComments({
    ...ctx.source,
    issue_number: number,
  })

  console.log(YAML.dump({ comments }))

  const existing_comment = comments.find(i => i.body?.includes(COMMENT_UPDATE_COMMENT))

  return existing_comment
}

export async function updateComment(ctx: Context, number: number, body: string, existing?: Awaited<ReturnType<typeof getExistingComment>>) {
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
