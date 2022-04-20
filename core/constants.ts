export const COMMENT_UPDATE_COMMENT = '<!-- upissues-update-comment -->'
export const COMMENT_DISABLED = '<!-- upissues-forward-disabled -->'

export const COMMENT_FORWARD_ISSUE = (owner: string, repo: string, number: number) => `<!-- upissues-forward-issue https://github.com/${owner}/${repo}/issues/${number} -->`
export const COMMENT_FORWARD_ISSUE_RE = /<!-- upissues-forward-issue https:\/\/github.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+) -->/
