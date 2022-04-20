import type { Context } from '../types'

export function updateUpstream(ctx: Context) {
  const { octokit, event } = ctx
  if ('action' in event && event.action === 'closed') {
    const { issue } = event
    // TODO: find downstream issue and close
  }
}
