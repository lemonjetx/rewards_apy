import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase/supabase.service';

@Injectable()
export class AppService {
	private readonly supabase: SupabaseClient;

	constructor(private readonly supabaseService: SupabaseService) {
		this.supabase = supabaseService.getClient();
	}

	async getPoolApyByName(poolName: string) {
		const { data: pool, error: poolError } = await this.supabase
			.from('pools')
			.select('id')
			.ilike('name', poolName)
			.single();

		if (poolError || !pool) {
			console.log(poolError);
			return null;
		}

		const poolId = pool.id;

		const { data: apyData, error: apyError } = await this.supabase
			.from('apy')
			.select('*')
			.eq('pool_id', poolId)
			.order('id', { ascending: false })
			.limit(1)
			.single();

		if (apyError || !apyData) {
			console.log(apyError);
			return null;
		}

		return apyData.apy as number;
	}

	async getPoolsApy() {
		const { data: pools, error: poolsError } = await this.supabase.from('pools').select('*');

		if (poolsError || !pools) {
			console.log(poolsError);
			return null;
		}

		const poolsAPYData = [];

		for (const pool of pools) {
			const { data: apyData, error: apyError } = await this.supabase
				.from('apy')
				.select('*')
				.eq('pool_id', pool.id)
				.order('id', { ascending: false })
				.limit(1)
				.single();

			if (apyError || !apyData) {
				console.log(apyError);
				return null;
			}

			poolsAPYData.push({
				pool_name: pool.name,
				pool_address: pool.address,
				apy: apyData.apy,
				start_date: apyData.start_date,
				end_date: apyData.end_date,
			});
		}

		return poolsAPYData;
	}
}
