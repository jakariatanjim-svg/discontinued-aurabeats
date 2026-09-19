```yaml
name: Build & Release

on:
  push:
    branches: [main, master]
    tags: ["v*"]

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

      - name: Resolve version
        id: ver
        run: |
          TAG_VER="${GITHUB_REF_NAME}"
          PKG_VER=$(node -p "try{require('./package.json').version}catch(e){''}")

          if [[ "$TAG_VER" == v* ]]; then
            VER="$TAG_VER"
          elif [ -n "$PKG_VER" ] && [ "$PKG_VER" != "0.0.0" ] && [ "$PKG_VER" != "" ]; then
            VER="v${PKG_VER}"
          else
            VER="build-${{ github.run_number }}"
          fi

          echo "version=$VER" >> "$GITHUB_OUTPUT"

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Production build
        run: npm run build

      - name: Prepare release file
        run: cp dist/index.html "aurabeats-${{ steps.ver.outputs.version }}.html"

      - name: Push to Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ steps.ver.outputs.version }}
          name: "AuraBeats ${{ steps.ver.outputs.version }}"
          body_path: LATEST_RELEASE.md
          files: aurabeats-${{ steps.ver.outputs.version }}.html
          make_latest: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
