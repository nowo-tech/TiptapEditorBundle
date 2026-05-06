# Maintainer: tagging and GitHub Release

## Prerequisites

- [`CHANGELOG.md`](CHANGELOG.md) updated with the new version and date under `[Unreleased]` moved to a numbered section.
- [`UPGRADING.md`](UPGRADING.md) updated if there are migration notes.
- CI green on `main` ([workflow](../.github/workflows/ci.yml)).
- [Release security checklist (12.4.1)](SECURITY.md#release-security-checklist-1241) reviewed.

## Version bump

1. Decide the next version (`MAJOR.MINOR.PATCH`, semver).
2. Edit [`CHANGELOG.md`](CHANGELOG.md): rename `[Unreleased]` content into `[x.y.z] - YYYY-MM-DD`, add empty `[Unreleased]` at the top.
3. Commit on `main`, e.g. `docs: prepare release x.y.z`.

## Tag and push

Replace `x.y.z` with the real version (no `v` inside Composer; the Git tag uses `v` prefix).

```bash
git checkout main
git pull origin main
git tag -a vx.y.z -m "Release x.y.z"
git push origin main
git push origin vx.y.z
```

## GitHub Release

1. Open **Releases** → **Draft a new release**.
2. Choose tag `vx.y.z`.
3. Title: `x.y.z` (or `Release x.y.z`).
4. Description: copy the section for `x.y.z` from [`CHANGELOG.md`](CHANGELOG.md) (markdown).

## Packagist

If the package is registered on [Packagist](https://packagist.org/), a new tag is picked up automatically after the push; otherwise hook or update manually.

## Automated releases

Pushing an annotated tag `v*` triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml) to create or update the GitHub Release (tag message + optional excerpt from `CHANGELOG.md`). [`.github/workflows/sync-releases.yml`](../.github/workflows/sync-releases.yml) backfills missing releases on a schedule or via manual dispatch.
