import type { Octokit } from '@octokit/rest'
import type { WebhookEvent } from '@octokit/webhooks-types'

export interface Context {
  octokit: Octokit
  event: WebhookEvent
  source: {
    owner: string
    repo: string
  }
}
