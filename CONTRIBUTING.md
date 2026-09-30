# Contributing

## Feature ownership

The application is split so four people can work with minimal overlap:

| Workstream              | Branch                  | Primary directory                            |
| ----------------------- | ----------------------- | -------------------------------------------- |
| Shell and summary       | `feature/summary-shell` | `src/features/shell`, `src/features/summary` |
| Dual calendar           | `feature/calendars`     | `src/features/calendars`                     |
| Actions and filters     | `feature/action-list`   | `src/features/actions`                       |
| Dialog and interactions | `feature/action-dialog` | `src/features/action-dialog`                 |

Shared contracts live in `src/types`, shared state in `src/state`, and data transforms in `src/data`. Discuss shared-file changes in the team before editing them.

## Starting work

```bash
git switch main
git pull --ff-only
git switch -c feature/your-feature
npm install
npm run dev
```

Commit only the files belonging to your feature where possible. Before opening a pull request:

```bash
npm run format
npm run lint
npm test
npm run build
```

## Integration order

1. Agree on changes to types and shared state first.
2. Merge small contract changes before feature implementations.
3. Rebase or merge the latest `main` into each feature branch before its pull request.
4. Merge one feature at a time and run the full validation suite after every merge.

Do not develop directly on `main`.
