create table historical_data
(
    id           serial primary key,
    date         date           not null default current_timestamp,
    asset_pool   numeric(30) not null,
    fee_pool     numeric(30) not null,
    total_supply numeric(30) not null,
    token_price  numeric(30, 9) not null
);

create table apy
(
    id          serial primary key,
    apy         numeric(10, 6) not null,
    start_date  date           not null,
    end_date    date           not null
);