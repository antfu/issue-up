/* eslint-disable no-useless-return */
import { handleIssueLabled } from './actions/label'
import { handleIssueClosed } from './actions/close'
import type { Context } from './types'
export * from './types'

export async function runAction(ctx: Context) {
  if (await handleIssueClosed(ctx))
    return

  if (await handleIssueLabled(ctx))
    return
}
