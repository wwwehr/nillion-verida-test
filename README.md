# pushing schema driven payloads into nildb

1. copy the config file and fill in values `cp .env.json.sample .env.json`
2. you need the latest version of [nilql-ts](https://github.com/NillionNetwork/nilql-ts) - I cloned this and built locally
```shell
git clone git@github.com:NillionNetwork/nilql-ts.git
pushd nilql-ts
pnpm i
pnpm build
popd
```
3. install this build
```shell
pnpm i ../nilql-ts
```
4. run example
```shell
pnpm run build
pnpm run test
```
