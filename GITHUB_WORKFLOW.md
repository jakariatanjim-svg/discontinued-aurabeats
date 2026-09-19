```yaml
name: Build & Release

on:
  push:
    branches: [main, master]
    tags: ["v*"]
  pull_request:
    branches: [main, master]

permissions:
  contents: write

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Resolve version and build number
        id: ver
        run: |
          TAG_VER="${GITHUB_REF_NAME}"
          PKG_VER=$(node -p "try{require('./package.json').version}catch(e){''}")

          if [[ "$TAG_VER" == v* ]]; then
            VER="$TAG_VER"
          elif [ -n "$PKG_VER" ] && [ "$PKG_VER" != "0.0.0" ] && [ "$PKG_VER" != "" ]; then
            VER="v${PKG_VER}"
          else
            BUILD_NUM=${{ github.run_number }}
            VER="build-${BUILD_NUM}"
          fi

          echo "version=$VER" >> "$GITHUB_OUTPUT"
          echo "artifact_name=aurabeats-${VER}" >> "$GITHUB_OUTPUT"
          echo "html_name=aurabeats-${VER}.html" >> "$GITHUB_OUTPUT"

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Production build
        run: npm run build

      - name: Rename output for release
        if: startsWith(github.ref, 'refs/tags/v')
        run: cp dist/index.html "aurabeats-${{ steps.ver.outputs.version }}.html"

      - name: Upload dist artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ steps.ver.outputs.artifact_name }}
          path: dist/index.html
          retention-days: 7

      - name: Create GitHub Release
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          name: "AuraBeats ${{ steps.ver.outputs.version }}"
          body_path: LATEST_RELEASE.md
          files: ${{ steps.ver.outputs.html_name }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
