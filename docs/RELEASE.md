# Maintainer: tagging and GitHub Release

## Table of contents

- [Prerequisites](#prerequisites)
- [Version bump](#version-bump)
- [Tag and push](#tag-and-push)
- [GitHub Release](#github-release)
- [Packagist](#packagist)

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
git tag -a v1.2.2 -m "Release 1.2.2 - docs: Twig override freeze rule and form theme table"
git push origin main
git push origin v1.2.2
```

## GitHub Release

1. Open **Releases** → **Draft a new release**.
2. Choose tag `vx.y.z`.
3. Title: `x.y.z` (or `Release x.y.z`).

Current stable target: **v1.2.3**.

### Example for v1.2.3

```bash
make release-check
git add -A
git commit -m "chore(release): prepare 1.2.3"
git tag -a v1.2.3 -m "Release 1.2.3 - demo FrankenPHP vendor wait + GitHub hygiene"
git push origin main
git push origin v1.2.3
```

### Example for v1.2.2

```bash
git tag -a v1.2.2 -m "Release 1.2.2 - docs: Twig override freeze rule and form theme table"
git push origin main
git push origin v1.2.2
```

### Example for v1.2.1 (previous)

```bash
git tag -a v1.2.1 -m "Release 1.2.1 - named asset package, FrankenPHP banner, demo PHP 8.5"
git push origin main
git push origin v1.2.1
```
4. Description: copy the section for `x.y.z` from [`CHANGELOG.md`](CHANGELOG.md) (markdown).

## Packagist

If the package is registered on [Packagist](https://packagist.org/), a new tag is picked up automatically after the push; otherwise hook or update manually.

## Automated releases

Pushing an annotated tag `v*` triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml) to create or update the GitHub Release (tag message + optional excerpt from `CHANGELOG.md`). [`.github/workflows/sync-releases.yml`](../.github/workflows/sync-releases.yml) backfills missing releases on a schedule or via manual dispatch.

After creating the release commit and tag, run `make check-no-cursor-coauthor` again **before** `git push` (REQ-GIT-001). The release commit itself is not covered by an earlier `release-check` run.
