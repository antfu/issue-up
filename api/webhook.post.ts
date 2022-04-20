import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'
import type { WebhookEvent } from '@octokit/webhooks-types'
import type Connect from 'connect'
import { defineEventHandler, useBody } from 'h3'
import { runAction } from '../core'
import type { Context } from '../core'

function createOctokit(installationId: number | string) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.UPISSUES_APP_ID,
      privateKey: Buffer.from(process.env.UPISSUES_PRIVATE_KEY!, 'base64').toString('ascii'),
      clientId: process.env.UPISSUES_CLIENT_ID,
      clientSecret: process.env.UPISSUES_CLIENT_SECRET,
      installationId: +installationId,
    },
  })
}

export default defineEventHandler<any>(async(event) => {
  const req = event.req as Connect.IncomingMessage
  const body = await useBody<WebhookEvent>(event)

  if (!body || !('installation' in body) || !('repository' in body))
    throw new Error('Bad')

  console.log('------------')
  console.log(body)

  // TODO: remove hard corded
  const octokit = createOctokit(body.installation!.id)
  const [owner, repo] = body.repository!.full_name.split('/')
  const context: Context = {
    octokit,
    event: body,
    source: {
      owner,
      repo,
    },
  }
  await runAction(context)
  const data = {
    url: req.url,
    method: req.method,
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(data, null, 2))
  return data
})
