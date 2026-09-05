# Expoline Client Portal

Secure client and HR portal for Expoline Pvt Ltd.

## Current development mode: synthetic data

The portal is currently being developed and tested with **synthetic/demo data only**. Do not enter real client passport numbers, personal information, visa information, medical information, insurance information, or real documents into the development database.

The seed creates a realistic working dataset so the dashboard and workflows can be tested before production data is available:

- 4 demo client companies
- 3 HR users per company
- Expoline demo admin and staff users
- 35 synthetic personnel records
- Visa, work-permit, medical and insurance records with valid, expiring, expired and pending states
- Synthetic document metadata (no real document files)
- 18 sample client requests with different priorities and statuses
- Sample English and Chinese-language company/user preferences
- Notifications and compliance alerts

All test identifiers are clearly marked with `TEST-` or `demo.expoline.example`.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set a local PostgreSQL password in `.env`. Never commit `.env`.
3. Install dependencies with `npm install`.
4. Start PostgreSQL with `npm run db:up`.
5. Push the Prisma schema with `npm run db:push`.
6. Load the synthetic dataset with `npm run db:seed`.
7. Start the portal with `npm run dev`.

The PostgreSQL database uses a Docker named volume so database data persists when the container is stopped and started again. The database port is bound to localhost for the local development setup.

## Resetting test data

The seed is intentionally destructive: it clears the current database records and recreates the complete synthetic dataset. Use `npm run db:seed` only against the local/test database.

For a completely fresh test database, you can remove the Docker volume with:

```text
docker compose down -v
npm run db:up
npm run db:push
npm run db:seed
```

The `-v` option permanently removes the named database volume, so do not use it against a database containing real data.

## Production transition

Before real Expoline data is introduced, the project still needs production authentication, company-level access control, secure document storage, audit logging, validated backups/restore, HTTPS, secret management, and a controlled data-import process. The synthetic seed should remain available for automated development/testing but must never be used to overwrite production data.
