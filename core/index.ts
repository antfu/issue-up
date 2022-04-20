import { updateIssue } from './actions/update'
import { updateUpstream } from './actions/upstreamClose'
import type { Context } from './types'
export * from './types'

export async function runAction(ctx: Context) {
  const { event } = ctx

  if (await updateUpstream(ctx))
    return

  if ('issue' in event)
    await updateIssue(ctx, event.issue)
}
