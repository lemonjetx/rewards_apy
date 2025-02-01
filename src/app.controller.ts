import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('pools/:poolName/apy')
	async getPoolApyByName(@Param('poolName') poolName: string) {
		return await this.appService.getPoolApyByName(poolName);
	}

	@Get('pools/apy')
	async getPoolsApy() {
		return await this.appService.getPoolsApy();
	}
}
