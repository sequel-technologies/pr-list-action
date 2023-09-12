# pr-list-action

A GitHub action to add a list of merged Pull Requests in a branch to a Pull Request

## Action
```yaml
name: Update PR Body
on:
  pull_request:
    branches: ["main"]

jobs:
  update-pr-body:
    permissions: write-all
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Update PR Body
        uses: sequel-technologies/pr-list-action@v1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          owner: sequel-technologies
          repo: ${{ github.repository_id }}
          head: ${{ github.head_ref }}
          base: ${{ github.base_ref }}
```

## Building

1. Install `vercel/ncc` by running this command in your terminal
    ```shell
    npm run prepare
    ```
