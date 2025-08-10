import { Module } from '@nestjs/common';
import { CartGateway } from './cart.gateway';
import { CartService } from './cart.service';

@Module({
  imports: [],
  controllers: [],
  providers: [CartGateway, CartService],
})
export class AppModule {}
