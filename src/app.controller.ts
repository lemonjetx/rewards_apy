import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly supabaseService: SupabaseService,
	) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@Get('test')
	async getTest() {
		// const { data, error } = await this.supabaseService.supabase.from('table').select('*');
		const { data, error } = await this.supabaseService.supabase.from('your_table').insert({ text: 'asd' });

		if (error) throw new Error(error.message);
		console.log(data);
		return data;
	}
}
