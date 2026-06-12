import * as github from '@actions/github'
import { EVOLVE_OWNER, EVOLVE_REPO } from './constants'

export type Octokit = ReturnType<typeof github.getOctokit>

export interface ReleaseAsset {
  name: string
  // API asset URL (api.github.com/...): downloads work for public and private
  // repos when requested with `Accept: application/octet-stream`.
  url: string
  // `sha256:<hex>` digest computed by GitHub at upload time.
  digest: string | null
}

export interface Release {
  tag: string
  prerelease: boolean
  assets: ReleaseAsset[]
}

export function createOctokit(token: string): Octokit {
  return github.getOctokit(token)
}

// biome-ignore lint/suspicious/noExplicitAny: GitHub API payloads are mapped defensively
function toRelease(r: any): Release {
  return {
    tag: r.tag_name,
    prerelease: Boolean(r.prerelease),
    // biome-ignore lint/suspicious/noExplicitAny: see above
    assets: (r.assets ?? []).map((a: any) => ({
      name: a.name,
      url: a.url,
      digest: a.digest ?? null,
    })),
  }
}

// Lists all non-draft releases. Drafts never appear for the workflow token,
// but filter anyway in case a broader token is supplied.
export async function listReleases(octokit: Octokit): Promise<Release[]> {
  const releases = await octokit.paginate(octokit.rest.repos.listReleases, {
    owner: EVOLVE_OWNER,
    repo: EVOLVE_REPO,
    per_page: 100,
  })
  // biome-ignore lint/suspicious/noExplicitAny: GitHub API payloads are mapped defensively
  return releases.filter((r: any) => !r.draft).map(toRelease)
}

export async function getReleaseByTag(octokit: Octokit, tag: string): Promise<Release> {
  try {
    const { data } = await octokit.rest.repos.getReleaseByTag({
      owner: EVOLVE_OWNER,
      repo: EVOLVE_REPO,
      tag,
    })
    return toRelease(data)
  } catch (err) {
    if (err instanceof Error && 'status' in err && err.status === 404) {
      throw new Error(`no evolve release found for tag ${tag}`)
    }
    throw err
  }
}

export function findAsset(release: Release, name: string): ReleaseAsset {
  const asset = release.assets.find((a) => a.name === name)
  if (!asset) {
    const available = release.assets.map((a) => a.name).join(', ')
    throw new Error(`release ${release.tag} has no asset named ${name} (available: ${available})`)
  }
  return asset
}

// Fetches sigstore bundles attested for the given subject digest, filtered
// server-side by predicate type. Returns the raw serialized bundles.
// NOTE: GitHub has marked this endpoint deprecated with removal scheduled for
// 2028-03-10; gh CLI still uses it. Revisit when a successor API is announced.
export async function fetchAttestations(
  octokit: Octokit,
  digestHex: string,
  predicateType: string,
): Promise<unknown[]> {
  const res = await octokit.request('GET /repos/{owner}/{repo}/attestations/{subject_digest}', {
    owner: EVOLVE_OWNER,
    repo: EVOLVE_REPO,
    subject_digest: `sha256:${digestHex}`,
    predicate_type: predicateType,
    per_page: 100,
  })
  // biome-ignore lint/suspicious/noExplicitAny: GitHub API payloads are mapped defensively
  return (res.data.attestations ?? []).map((a: any) => a.bundle)
}
