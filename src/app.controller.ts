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
	async getHello() {
		const query = `
			query GetObject {
					object(address: "0x0b8c0ef40d9f27a02fdd7cb323d3e89f50e6cd085730fd36be63c587af7053de") {
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

		const res = fetch('https://sui-testnet.mystenlabs.com/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query,
				// variables,
			}),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				console.log('GraphQL response:', data);
				return data;
			})
			.catch((error) => {
				console.error('Error:', error);
			});

		return res;

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
