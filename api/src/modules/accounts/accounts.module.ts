import { Module } from '@nestjs/common';
import { CommonModule } from '../common/comon.module';
import { AccountService } from './account.service';

@Module({
  imports: [CommonModule],
  controllers: [],
  providers: [AccountService],
  exports: [AccountService]
})
export class AccountsModule {}
