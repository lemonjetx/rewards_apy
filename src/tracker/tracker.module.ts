import { Module } from '@nestjs/common';
import { TrackerService } from './tracker.service';

@Module({
  providers: [TrackerService]
})
export class TrackerModule {}
