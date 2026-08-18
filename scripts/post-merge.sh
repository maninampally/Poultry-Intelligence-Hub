#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @murgi-mitra/db push
