## Description

Microservice to calculate APY (Annual Percentage Yield). This service periodically queries the blockchain to retrieve
vault data, calculates APY, and saves the results.

## Project Setup

### Install Dependencies

```bash
$ npm install
```

### Create an `.env` File

Provide the necessary environment variables in a `.env` file:

```.dotenv
APPLICATION_PORT=4000
APPLICATION_URL=http://localhost:${APPLICATION_PORT}
APPLICATION_ORIGIN=http://localhost:3000,https://lemonjet.io/

SUPABASE_URL=
SUPABASE_KEY=

SUI_NETWORK=testnet
SUI_GRAPHQL_URL=https://sui-testnet.mystenlabs.com/graphql
```

### Database

The database schema is defined in the `schema.sql` file

#### Required data in the `pools` table

To enable APY and pools data lookup, the `pools` table must contain records.

Example SQL for inserting data samples:

```sql
insert into pools (name, address)
values ('SUI', '0x123...'),
       ('USDC', '0x123...');
```

Without these entries, obtaining pool data and calculating APY will not work.

### Adjust Query Schedule

To change the scheduling period for blockchain queries, edit the `TRACKER_CRON_SCHEDULE` constant in
`src/data/constants.ts`.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Get APY by pool name

- **Endpoint:** `GET /pools/:poolName/apy`
- **Parameters:**
    - `poolName` (string, required) — register is disregarded.
- **Response Example:**

```
24.037792
```

### Get APY from all pools

- **Endpoint:** `GET /pools/apy`
- **Response Example:**

```json
[
  {
    "pool_name": "SUI",
    "pool_address": "0x0...",
    "apy": 32.260836,
    "start_date": "2024-01-01",
    "end_date": "2025-01-01"
  },
  {
    "pool_name": "USDC",
    "pool_address": "0x0...",
    "apy": -1.037792,
    "start_date": "2024-01-01",
    "end_date": "2025-01-01"
  }
]
```