CREATE TABLE historical_data
(
    id           SERIAL PRIMARY KEY,                                 -- Уникальный идентификатор записи
    date         DATE            NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Дата данных
    asset_pool   NUMERIC(30, 10) NOT NULL,                           -- Объем пула активов
    fee_pool     NUMERIC(30, 10) NOT NULL,                           -- Объем пула комиссий
    total_supply NUMERIC(30, 10) NOT NULL,                           -- Общее количество выпущенных токенов
    token_price  NUMERIC(30, 10) GENERATED ALWAYS AS
        (asset_pool / NULLIF(total_supply, 0)) STORED,               -- Цена токена (вычисляемое поле)
);

CREATE TABLE apy_calculations
(
    id               SERIAL PRIMARY KEY,                 -- Уникальный идентификатор записи
    start_date       DATE           NOT NULL,            -- Дата начала расчетного периода
    end_date         DATE           NOT NULL,            -- Дата окончания расчетного периода
    apr              NUMERIC(10, 6) NOT NULL,            -- Рассчитанный APR
    apy              NUMERIC(10, 6) NOT NULL,            -- Рассчитанный APY
    times_compounded INT            NOT NULL,            -- Количество начислений в год
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Время расчета
);
