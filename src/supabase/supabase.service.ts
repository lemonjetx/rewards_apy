import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
	public readonly supabase: SupabaseClient;

	constructor(private readonly configService: ConfigService) {
		const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
		const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

		this.supabase = createClient(supabaseUrl, supabaseKey);
		// this.logger.log('Supabase client initialized');
	}
}
