import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
	private readonly supabase: SupabaseClient;

	constructor(private readonly configService: ConfigService) {
		const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
		const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

		this.supabase = createClient(supabaseUrl, supabaseKey);
		// this.logger.log('Supabase client initialized');
	}

	public getClient() {
		return this.supabase;
	}
}
