import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ShiftsModule } from './shifts/shifts.module';

@Module({
  imports: [PrismaModule, ShiftsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
