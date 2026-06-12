# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately via
[GitHub Security Advisories](https://github.com/bitwise-media-group/setup-evolve/security/advisories/new). Do not open
public issues for security reports.

## Threat model (summary)

This action's job is to ensure the `evolve` binary placed on `PATH` is exactly what `bitwise-media-group/evolve`'s
release workflow built. It defends against:

- **Tampered release assets / CDN swaps** — the API digest, `checksums.txt`, SLSA provenance, and cosign signature all
  verify the downloaded bytes.
- **Forged provenance** — sigstore bundles must chain to the Sigstore public-good trust root, carry Rekor
  transparency-log inclusion, and be signed by the pinned workflow identity (anchored regex over the certificate SAN,
  exact-match OIDC issuer).
- **Actions cache poisoning** — restored cache entries are re-verified against the cosign bundle before use; failures
  evict the entry and fall back to a fresh download.
- **Verification downgrade** — there is no input that skips or weakens verification; the identity policy is code, not
  configuration.

Out of scope: a compromise of evolve's release workflow itself (that identity is the trust anchor), and a compromise of
the runner executing this action.
