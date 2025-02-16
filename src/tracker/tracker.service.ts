import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { SupabaseClient } from '@supabase/supabase-js';
import { IPool } from '@/data/abstractions/IPool';
import { IPoolData } from '@/data/abstractions/IPoolData';
import { TRACKER_CRON_SCHEDULE } from '@/data/constants';
import { getObjectQuery } from '@/data/queries/get-object.query';
import { SupabaseService } from '@/supabase/supabase.service';

@Injectable()
export class TrackerService {
	private readonly logger = new Logger(TrackerService.name);
	private readonly supabase: SupabaseClient;
	private readonly suiGraphQLUrl: string;

	constructor(
		private readonly supabaseService: SupabaseService,
		private readonly configService: ConfigService,
	) {
		this.supabase = supabaseService.getClient();
		this.suiGraphQLUrl = configService.get<string>('SUI_GRAPHQL_URL');

		this.fetchPoolsDataAndAPY();
	}

	@Cron(TRACKER_CRON_SCHEDULE)
	async fetchPoolsDataAndAPY() {
		try {
			this.logger.log('Fetching vaults data...');

			const pools = await this.fetchPools();
			if (!pools.length) {
				this.logger.warn('No pools found in the database.');
				return;
			}

			for (const pool of pools) {
				this.logger.log(`Fetching data for pool: ${pool.name} (${pool.address})`);

				try {
					const response = await this.fetchPoolData(pool.address);
					const processResponse = this.processResponse(response);

					await this.savePoolData(pool, processResponse);
					await this.calculateAndSaveAPY(pool, processResponse.tokenPrice);
				} catch (error) {
					this.logger.error(`Failed to fetch data for pool ${pool.name}:`, error);
				}
			}
		} catch (error) {
			this.logger.error('Failed to fetch pools data', error);
		}
	}

	private async fetchPools() {
		const { data, error } = await this.supabase.from('pools').select('*');
		if (error) {
			this.logger.error('Failed to fetch pools:', error.message);
			throw new Error('Database error while fetching pools');
		}

		return data as IPool[];
	}

	private async fetchPoolData(address: string) {
		const query = getObjectQuery(address);
		const response = await fetch(this.suiGraphQLUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query }),
		});

		if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

		return response.json();
	}

	private processResponse(response: any): IPoolData {
		const assetPool = response.data.object.asMoveObject.contents.json.asset_pool.value;
		const totalSupply = response.data.object.asMoveObject.contents.json.shares_treasury.total_supply.value;
		const feePool = response.data.object.asMoveObject.contents.json.fee_pool.value;
		const tokenPrice = assetPool / totalSupply;

		return { assetPool, totalSupply, feePool, tokenPrice };
	}

	private async savePoolData(pool: IPool, vault: IPoolData) {
		const { error } = await this.supabase.from('historical_data').insert({
			pool_id: pool.id,
			asset_pool: vault.assetPool,
			fee_pool: vault.feePool,
			total_supply: vault.totalSupply,
			token_price: vault.tokenPrice,
		});

		if (error) {
			this.logger.error(`Failed to save vault data for pool ${pool.name}:`, error.message);
			throw new Error('Database error');
		} else {
			this.logger.log(`
				Vault data saved for pool ${pool.name}
				asset_pool: ${vault.assetPool},
				fee_pool: ${vault.feePool},
				total_supply: ${vault.totalSupply},
				token_price: ${vault.tokenPrice}.
			`);
		}
	}

	private async calculateAndSaveAPY(pool: IPool, tokenPrice: number) {
		const endDate = new Date();
		const startDateLimit = new Date(endDate);
		startDateLimit.setDate(startDateLimit.getDate() - 365);

		const oldestData = await this.fetchOldestVaultData(pool, startDateLimit);

		const startDate = new Date(oldestData.date);
		const daysCount = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
		const apy = this.calculateAPYValue(oldestData.token_price, tokenPrice, daysCount);

		this.logger.log(
			`APY calculated for pool ${pool.name}: ${apy.toFixed(6)}% 
			from ${startDate.toISOString()} to ${endDate.toISOString()}`,
		);

		await this.saveAPYToDatabase(pool, apy, startDate, endDate);
	}

	private async fetchOldestVaultData(pool: IPool, dateLimit: Date) {
		const { data, error } = await this.supabase
			.from('historical_data')
			.select('date, token_price')
			.eq('pool_id', pool.id)
			.gte('date', dateLimit.toISOString().split('T')[0])
			.order('date', { ascending: true })
			.limit(1)
			.single();

		if (error || !data) {
			this.logger.error(`Failed to fetch oldest data for pool ${pool.name}:`, error?.message || 'No data available');
			throw new Error('Insufficient historical data for APY calculation');
		}

		return data;
	}

	private async saveAPYToDatabase(pool: IPool, apy: number, startDate: Date, endDate: Date) {
		const { error } = await this.supabase.from('apy').insert({
			pool_id: pool.id,
			apy,
			start_date: startDate.toISOString().split('T')[0],
			end_date: endDate.toISOString().split('T')[0],
		});

		if (error) {
			this.logger.error(`Failed to save APY for pool ${pool.name}:`, error.message);
			throw new Error('Database error while saving APY');
		}
	}

	private calculateAPYValue(prevTokenPrice: number, currentTokenPrice: number, daysCount: number) {
		const growth = (currentTokenPrice - prevTokenPrice) / prevTokenPrice;
		return (Math.pow(1 + growth / daysCount, daysCount) - 1) * 100;
	}
}
