# Theme Archive Notes

Last updated: July 22, 2026

## What Is Live

The public site currently uses the **Midnight Editorial** dark theme introduced
in commit `926dac4`. Light mode remains the default for first-time visitors;
dark mode is available through the site theme control.

## Preserved Dark Themes

Two immutable annotated Git tags preserve the complete site state for each
dark-theme version:

| Theme | Git tag | Commit | Status |
| --- | --- | --- | --- |
| Neutral Dark v1 | `theme/neutral-dark-v1-2026-07-22` | `b37a359` | Archived; not available in the public UI |
| Midnight Editorial v2 | `theme/midnight-editorial-v2-2026-07-22` | `926dac4` | Current production direction |

Cloudflare Pages deploys only `origin/main`. The archived tag is not included in
the production bundle and there is no visitor-facing control that can activate
it. Because the GitHub repository is public, developers can still inspect the
tag's source history.

## Safe Ways to Revisit It

Inspect the former theme without changing the working tree:

```bash
git show theme/neutral-dark-v1-2026-07-22:src/styles.css
```

Compare the two preserved versions:

```bash
git diff theme/neutral-dark-v1-2026-07-22 theme/midnight-editorial-v2-2026-07-22 -- src/styles.css
```

Create a separate review branch from the former theme:

```bash
git switch -c codex/review-neutral-dark theme/neutral-dark-v1-2026-07-22
```

Do not reset `main` to an archive tag. If a former treatment is wanted again,
create a review branch and intentionally port the desired theme changes into a
new commit so current content, compliance, and application work are preserved.

