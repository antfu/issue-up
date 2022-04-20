import { updateIssue } from './actions/update'
import { updateUpstream } from './actions/issueClose'
import { readConfig } from './config'
import type { Context } from './types'
import { info } from './utils'
export * from './types'

export async function runAction(ctx: Context) {
  const { event } = ctx

  if (await updateUpstream(ctx))
    return

  const config = await readConfig(ctx)
  if (!config)
    return info('No config found')

  if ('issue' in event)
    await updateIssue(ctx, event.issue)
}
