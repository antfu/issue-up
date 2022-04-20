import type { Octokit } from '@octokit/rest'
import YAML from 'js-yaml'
import type { Config } from './types'

export async function readConfig(octokit: Octokit, owner: string, repo: string): Promise<Config | undefined> {
  try {
    const { data: file } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '.github/upissues.yml',
    }) as any
    return Object.assign({
      tag: 'upstream',
      upstream: {},
    },
    YAML.load(Buffer.from(file.content!, 'base64').toString('utf8')),
    )
  }
  catch (e) {
    console.error(e)
  }
}
