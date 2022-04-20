export const COMMENT_DISABLED = '<!-- issue-up-forward-disabled -->'

export const COMMENT_FORWARD_ISSUE = (owner: string, repo: string, number: number) => `<!-- issue-up-forward-issue https://github.com/${owner}/${repo}/issues/${number} -->`
export const COMMENT_FORWARD_ISSUE_RE = /<!-- issue-up-forward-issue https:\/\/github.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+) -->/

export const COMMENT_UPDATE_COMMENT = (owner: string, repo: string, number: number) => `<!-- issue-up-update-comment https://github.com/${owner}/${repo}/issues/${number} -->`
export const COMMENT_UPDATE_COMMENT_RE = /<!-- issue-up-update-comment https:\/\/github.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+) -->/

export const SAME_ISSUE_RATE = 10_000
