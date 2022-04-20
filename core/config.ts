import YAML from 'js-yaml'
import type { Config, Context } from './types'

export async function readConfig(ctx: Context, required: true): Promise<Config>
export async function readConfig(ctx: Context, required?: false): Promise<Config | undefined>
export async function readConfig(ctx: Context, required = false) {
  if (ctx.config)
    return ctx.config
  try {
    const { data: file } = await ctx.octokit.rest.repos.getContent({
      ...ctx.source,
      path: '.github/upissues.yml',
    }) as any
    ctx.config = Object.assign({
      tag: 'upstream',
      upstream: {},
    },
    YAML.load(Buffer.from(file.content!, 'base64').toString('utf8')),
    )
    return ctx.config
  }
  catch (e) {
    console.error(e)
    if (required)
      throw new Error('Missing .github/upissues.yml')
    return undefined
  }
}
