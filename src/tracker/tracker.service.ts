import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { SupabaseClient } from '@supabase/supabase-js';
import { IVault } from '@/data/abstractions/IVault';
import { TRACKER_CRON_SCHEDULE } from '@/data/constants';
import { getObjectQuery } from '@/data/queries/get-object.query';
import { SupabaseService } from '@/supabase/supabase.service';

@Injectable()
export class TrackerService {
	private readonly logger = new Logger(TrackerService.name);
	private readonly supabase: SupabaseClient;
	private readonly vaultAddress: string;
	private readonly query: string;
	private readonly suiGraphQLUrl: string;

	constructor(
		private readonly supabaseService: SupabaseService,
		private readonly configService: ConfigService,
	) {
		this.supabase = supabaseService.getClient();
		this.suiGraphQLUrl = configService.get<string>('SUI_GRAPHQL_URL');
		this.vaultAddress = configService.get<string>('SUI_VAULT_ADDRESS');
		this.query = getObjectQuery(this.vaultAddress);
	}

	@Cron(TRACKER_CRON_SCHEDULE)
	async fetchVaultDataAndAPY() {
		try {
			this.logger.log('Fetching token price...');

			const response = await this.fetchVaultData();
			const vault = this.processResponse(response);

			await this.saveVaultData(vault);

			await this.calculateAPY(vault.tokenPrice);
		} catch (error) {
			this.logger.error('Failed to fetch data', error.message);
		}
	}

	private async fetchVaultData() {
		const response = await fetch(this.suiGraphQLUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: this.query,
			}),
		});

		if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

		return response.json();
	}

	private processResponse(response: any): IVault {
		const assetPool = response.data.object.asMoveObject.contents.json.asset_pool.value;
		const totalSupply = response.data.object.asMoveObject.contents.json.shares_treasury.total_supply.value;
		const feePool = response.data.object.asMoveObject.contents.json.fee_pool.value;
		const tokenPrice = assetPool / totalSupply;

		return { assetPool, totalSupply, feePool, tokenPrice };
	}

	private async saveVaultData(vault: IVault) {
		const { error } = await this.supabase.from('historical_data').insert({
			asset_pool: vault.assetPool,
			fee_pool: vault.feePool,
			total_supply: vault.totalSupply,
			token_price: vault.tokenPrice,
		});

		if (error) {
			this.logger.error('Failed to save vault data:', error.message);
			throw new Error('Database error');
		} else {
			this.logger.log(`
				Vault data saved!
				asset_pool: ${vault.assetPool},
				fee_pool: ${vault.feePool},
				total_supply: ${vault.totalSupply},
				token_price: ${vault.tokenPrice}.
			`);
		}
	}

	private async calculateAPY(tokenPrice: number) {
		const endDate = new Date();
		const startDateLimit = new Date(endDate);
		startDateLimit.setDate(startDateLimit.getDate() - 365); // Ограничение на 365 дней

		const { data: oldestData, error: oldestError } = await this.supabase
			.from('historical_data')
			.select('date, token_price')
			.gte('date', startDateLimit.toISOString().split('T')[0])
			.order('date', { ascending: true })
			.limit(1)
			.single();

		if (oldestError || !oldestData) {
			this.logger.error(
				'Failed to fetch the oldest data within 365 days:',
				oldestError?.message || 'No data available',
			);
			throw new Error('Insufficient historical data for APY calculation');
		}

		const startDate = new Date(oldestData.date);
		const daysCount = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24); // Количество дней между датами

		const prevTokenPrice = oldestData.token_price;

		if (!prevTokenPrice || prevTokenPrice <= 0) {
			this.logger.error('Invalid previous token price:', prevTokenPrice);
			throw new Error('Invalid token price for APY calculation');
		}

		const growth = (tokenPrice - prevTokenPrice) / prevTokenPrice;

		const apy = (Math.pow(1 + growth / daysCount, daysCount) - 1) * 100;

		this.logger.log(`APY calculated: ${apy.toFixed(6)}% from ${startDate.toISOString()} to ${endDate.toISOString()}`);

		const { error: insertError } = await this.supabase.from('apy').insert({
			apy,
			start_date: startDate.toISOString().split('T')[0],
			end_date: endDate.toISOString().split('T')[0],
		});

		if (insertError) {
			this.logger.error('Failed to save APY:', insertError.message);
			throw new Error('Database error while saving APY');
		}

		return apy;
	}
}
