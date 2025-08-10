import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CartService } from './cart.service';
import type { Cart, CartItem } from './types';

@WebSocketGateway({ cors: true })
export class CartGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly cartService: CartService) {}

  async handleConnection(client: Socket) {
    const { sessionId } = client.handshake.query as { sessionId: string };

    if (!sessionId) {
      client.disconnect();
      return;
    }

    await this.cartService.subscribeToUpdates(
      sessionId,
      (updatedCart: Cart) => {
        this.server.to(sessionId).emit('cart-updated', updatedCart);
      },
    );

    await client.join(sessionId);

    const currentCart = await this.cartService.getCart(sessionId);
    client.emit('cart-updated', currentCart);
  }

  handleDisconnect(client: Socket) {
    const { sessionId } = client.handshake.query as { sessionId: string };
    if (!sessionId) {
      return;
    }

    // We add a small delay to ensure Socket.IO has fully processed the client's disconnect.
    // This gives an accurate count of remaining clients in the room.
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setTimeout(async () => {
      // Get the number of clients currently connected to this session's room.
      const room = this.server.sockets.adapter.rooms.get(sessionId);
      const remainingClients = room ? room.size : 0;

      // If no other clients are connected, we can safely unsubscribe from Redis.
      if (remainingClients === 0) {
        await this.cartService.unsubscribeFromUpdates(sessionId);
      }
    }, 500); // 500ms delay
  }

  @SubscribeMessage('add-item')
  async handleAddItem(client: Socket, payload: CartItem) {
    const { sessionId } = client.handshake.query as { sessionId: string };

    if (!sessionId) return;

    const currentCart = await this.cartService.getCart(sessionId);

    const existingItem = currentCart.items.find(
      (item) => item.productId === payload.productId,
    );

    if (existingItem) {
      existingItem.quantity += payload.quantity;
    } else {
      currentCart.items.push(payload);
    }

    currentCart.totalPrice = this.cartService.calculateTotalPrice(currentCart);

    await this.cartService.updateCart(sessionId, currentCart);
    await this.cartService.publishCartUpdate(sessionId, currentCart);
  }
}
