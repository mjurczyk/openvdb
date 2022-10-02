### Building Examples

- run `npm run build:examples`
- Commit the new docs version
- Run `git subtree push --prefix=examples/dist/ origin gh-pages`, or:

```bash
git push origin `git subtree split --prefix=examples/dist/ main`:gh-pages --force
```
