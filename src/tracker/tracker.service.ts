import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { SupabaseClient } from '@supabase/supabase-js';
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
		this.query = `
			query GetObject {
					object(address: "${this.vaultAddress}") {
						version
						storageRebate
						asMoveObject {
							contents {
								json
							}
						}
					}
				}
		`;
	}

	@Cron('1 * * * * *')
	async fetchAndSaveTokenPrice() {
		try {
			const query = this.query;
			this.logger.log('Fetching token price...');
			const response = await fetch(this.suiGraphQLUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query,
				}),
			}).then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			});

			const assetPool = response.data.object.asMoveObject.contents.json.asset_pool.value;
			const totalSupply = response.data.object.asMoveObject.contents.json.shares_treasury.total_supply.value;
			const feePool = response.data.object.asMoveObject.contents.json.fee_pool.value;
			console.log(assetPool, totalSupply, feePool, assetPool / totalSupply);
		} catch (error) {
			this.logger.error('Failed to fetch data', error.message);
		}
	}
}
