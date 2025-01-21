import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase/supabase.service';

@Injectable()
export class AppService {
	private readonly supabase: SupabaseClient;

	constructor(private readonly supabaseService: SupabaseService) {
		this.supabase = supabaseService.getClient();
	}

	async getApy() {
		const { data, error } = await this.supabase.from('apy').select('*').order('id', { ascending: false }).limit(1);

		if (error || data.length === 0) {
			console.log(error);
			return null;
		}

		return data[0].apy as number;
	}
}
