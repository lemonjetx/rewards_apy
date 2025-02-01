create table pools
(
    id      serial primary key,
    name    text not null unique,
    address text not null unique
);

create table historical_data
(
    id           serial primary key,
    pool_id      int            not null,
    date         date           not null default current_timestamp,
    asset_pool   numeric(30)    not null,
    fee_pool     numeric(30)    not null,
    total_supply numeric(30)    not null,
    token_price  numeric(30, 9) not null,

    foreign key (pool_id) references pools (id) on delete cascade
);

create table apy
(
    id         serial primary key,
    pool_id    int            not null,
    apy        numeric(10, 6) not null,
    start_date date           not null,
    end_date   date           not null,

    foreign key (pool_id) references pools (id) on delete cascade
);