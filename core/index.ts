import { updateIssue } from './actions/update'
import type { Context } from './types'
export * from './types'

export async function runAction(ctx: Context) {
  const { event } = ctx
  if ('issue' in event)
    await updateIssue(ctx, event.issue)
}
