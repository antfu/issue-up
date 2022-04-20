import YAML from 'js-yaml'
import type { Config, Context } from './types'
import { info } from './utils'

export async function readConfig(ctx: Context, required: true): Promise<Config>
export async function readConfig(ctx: Context, required?: false): Promise<Config | undefined>
export async function readConfig(ctx: Context, required = false) {
  if (ctx.config)
    return ctx.config
  try {
    const { data: file } = await ctx.octokit.rest.repos.getContent({
      ...ctx.source,
      path: '.github/issue-up.yml',
    }) as any
    ctx.config = Object.assign(
      {
        tag: 'upstream',
        upstream: {},
      },
      YAML.load(Buffer.from(file.content!, 'base64').toString('utf8')),
    )
    info('Read config', ctx.config)
    return ctx.config
  }
  catch (e) {
    if (required) {
      console.error(e)
      throw new Error('Missing .github/issue-up.yml')
    }
    return undefined
  }
}
