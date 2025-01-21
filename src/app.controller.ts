import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly supabaseService: SupabaseService,
	) {}

	@Get('apy')
	async getApy() {
		return await this.appService.getApy();
	}
}
