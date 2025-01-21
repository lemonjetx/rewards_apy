import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { SupabaseClient } from '@supabase/supabase-js';
import { IVault } from '../data/abstractions/IVault';
import { SupabaseService } from '../supabase/supabase.service';

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

	@Cron('1 * * * * *')
	async fetchVaultDataAndAPY() {
		try {
			this.logger.log('Fetching token price...');

			const response = await this.fetchVaultData();
			const vault = this.processResponse(response);

			await this.saveVaultData(vault);
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
		return 0;
	}
}
