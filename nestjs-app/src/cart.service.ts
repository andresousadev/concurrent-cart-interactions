import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Decimal from 'decimal.js';
import Redis from 'ioredis';
import { Cart } from 'src/types';

@Injectable()
export class CartService implements OnModuleInit, OnModuleDestroy {
  private readonly redisClient: Redis;
  private readonly redisSubscriber: Redis;
  private readonly subscriptionCallbacks = new Map<
    string,
    (cart: Cart) => void
  >();

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT!, 10),
    });
    this.redisSubscriber = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT!, 10),
    });
  }

  onModuleInit() {
    // A single, centralized message handler for ALL channels
    this.redisSubscriber.on('message', (channel, message) => {
      const sessionId = channel.split(':')[1];
      const callback = this.subscriptionCallbacks.get(sessionId);
      if (callback) {
        callback(JSON.parse(message) as Cart);
      }
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
    await this.redisSubscriber.quit();
  }

  async getCart(sessionId: string): Promise<Cart> {
    const cart = await this.redisClient.get(`cart:${sessionId}`);
    return cart
      ? (JSON.parse(cart) as Cart)
      : { id: sessionId, items: [], totalPrice: '0.00' };
  }

  async updateCart(sessionId: string, cart: Cart) {
    await this.redisClient.set(
      `cart:${sessionId}`,
      JSON.stringify(cart),
      'EX',
      3600,
    );
  }

  async publishCartUpdate(sessionId: string, cart: Cart) {
    await this.redisClient.publish(
      `cart-updates:${sessionId}`,
      JSON.stringify(cart),
    );
  }

  async subscribeToUpdates(sessionId: string, callback: (cart: Cart) => void) {
    if (!this.subscriptionCallbacks.has(sessionId)) {
      await this.redisSubscriber.subscribe(
        `cart-updates:${sessionId}`,
        (err) => {
          if (err) console.error('Failed to subscribe to Redis channel', err);
          console.log(`Subscribed to cart-updates:${sessionId}`);
        },
      );
    }

    this.subscriptionCallbacks.set(sessionId, callback);
  }

  async unsubscribeFromUpdates(sessionId: string) {
    if (this.subscriptionCallbacks.has(sessionId)) {
      await this.redisSubscriber.unsubscribe(`cart-updates:${sessionId}`);
      this.subscriptionCallbacks.delete(sessionId);
      console.log(`Unsubscribed from cart-updates:${sessionId}`);
    }
  }

  public calculateTotalPrice(cart: Cart): string {
    let total = new Decimal(0);
    for (const item of cart.items) {
      const itemPrice = new Decimal(item.unitPrice).mul(
        new Decimal(item.quantity),
      );
      total = total.plus(itemPrice);
    }
    return total.toFixed(2);
  }
}
