import { HttpService } from '@nestjs/axios';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly supabaseService: SupabaseService,
		private readonly httpService: HttpService,
	) {}

	@Get()
	async getHello() {
		try {
			const response = await this.httpService.axiosRef.get(
				`https://suiscan.xyz/testnet/object/0x0b8c0ef40d9f27a02fdd7cb323d3e89f50e6cd085730fd36be63c587af7053de/fields`,
			);
			return response.data; // Возвращаем полученные данные
		} catch (error) {
			console.error('Error fetching Sui object:', error);
			throw new Error('Unable to fetch object from Sui');
		}

		return this.appService.getHello();
	}

	@Get('test')
	async getTest() {
		// const { data, error } = await this.supabaseService.supabase.from('table').select('*');
		const { data, error } = await this.supabaseService.supabase.from('table').insert({ text: 'asd' });

		if (error) throw new Error(error.message);
		console.log(data);
		return data;
	}
}
