/**
 * Core broker, market data and payment provider interfaces.
 * Swappable implementations without touching UI code.
 */

export interface NormalizedQuote {
  symbol: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  currency: string;
  timestamp: number;
  isDelayed: boolean;
  provider: string;
}

export interface NormalizedCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataProvider {
  name: string;
  getQuote(symbol: string, exchange: string): Promise<NormalizedQuote>;
  getCandles(
    symbol: string,
    exchange: string,
    range: string,
  ): Promise<NormalizedCandle[]>;
}

export interface OrderRequest {
  symbol: string;
  exchange: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  quantity: number;
  limitPrice?: number;
  currency: string;
}

export interface OrderResponse {
  orderId: string;
  status: "pending" | "filled" | "rejected" | "cancelled";
  filledQuantity: number;
  filledPrice?: number;
  errorMessage?: string;
  simulated: boolean;
  placedAt: Date;
}

export interface BrokerPosition {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  currency: string;
}

export interface BrokerOrderRecord {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price?: number;
  status: "pending" | "filled" | "failed" | "cancelled";
  createdAt: Date;
}

export interface BrokerProvider {
  name: string;
  isLive: boolean;
  placeOrder(order: OrderRequest): Promise<OrderResponse>;
  cancelOrder(orderId: string): Promise<boolean>;
  getPositions(): Promise<BrokerPosition[]>;
  getOrders(): Promise<BrokerOrderRecord[]>;
}

/**
 * 1. DemoBroker: default simulated broker fulfilling orders against quoted bid/ask.
 */
export class DemoBroker implements BrokerProvider {
  name = "DemoBroker";
  isLive = false;

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    const id = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      orderId: id,
      status: "filled",
      filledQuantity: order.quantity,
      filledPrice: order.limitPrice ?? 100.0,
      simulated: true,
      placedAt: new Date(),
    };
  }

  async cancelOrder(_orderId: string): Promise<boolean> {
    return true;
  }

  async getPositions(): Promise<BrokerPosition[]> {
    return [];
  }

  async getOrders(): Promise<BrokerOrderRecord[]> {
    return [];
  }
}

/**
 * 2. MystocksBroker: partner API adapter for 8 African exchanges.
 * Disabled by flag until partner credentials and integration are active.
 */
export class MystocksBroker implements BrokerProvider {
  name = "mystocks.africa";
  isLive = false;

  async placeOrder(_order: OrderRequest): Promise<OrderResponse> {
    throw new Error(
      "mystocks.africa order execution is coming soon. Real order routing is currently disabled.",
    );
  }

  async cancelOrder(_orderId: string): Promise<boolean> {
    throw new Error("mystocks.africa integration coming soon.");
  }

  async getPositions(): Promise<BrokerPosition[]> {
    return [];
  }

  async getOrders(): Promise<BrokerOrderRecord[]> {
    return [];
  }
}

/**
 * Payment Provider interface with mock and daraja implementations.
 */
export interface STKPushRequest {
  phoneNumber: string;
  amountMinor: bigint;
  accountReference: string;
  description: string;
}

export interface STKPushResponse {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  customerMessage: string;
  simulated: boolean;
}

export interface B2CWithdrawalRequest {
  phoneNumber: string;
  amountMinor: bigint;
  remarks: string;
}

export interface B2CWithdrawalResponse {
  conversationId: string;
  originatorConversationId: string;
  responseCode: string;
  responseDescription: string;
  simulated: boolean;
}

export interface PaymentProvider {
  name: string;
  isLive: boolean;
  initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse>;
  initiateB2CWithdrawal(request: B2CWithdrawalRequest): Promise<B2CWithdrawalResponse>;
}

export class MockPaymentProvider implements PaymentProvider {
  name = "MockPaymentProvider";
  isLive = false;

  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    return {
      checkoutRequestId: `ws_CO_${Date.now()}_mock`,
      merchantRequestId: `req_${Date.now()}`,
      responseCode: "0",
      customerMessage: "Success. Request accepted for processing (simulated PIN prompt sent).",
      simulated: true,
    };
  }

  async initiateB2CWithdrawal(request: B2CWithdrawalRequest): Promise<B2CWithdrawalResponse> {
    return {
      conversationId: `AG_${Date.now()}_mock`,
      originatorConversationId: `orig_${Date.now()}`,
      responseCode: "0",
      responseDescription: "Accept the service request successfully (simulated payout).",
      simulated: true,
    };
  }
}

export class DarajaPaymentProvider implements PaymentProvider {
  name = "DarajaPaymentProvider";
  isLive = true;

  async initiateSTKPush(_request: STKPushRequest): Promise<STKPushResponse> {
    throw new Error("Daraja live payment gate is disabled pending compliance sign-off.");
  }

  async initiateB2CWithdrawal(_request: B2CWithdrawalRequest): Promise<B2CWithdrawalResponse> {
    throw new Error("Daraja live payout gate is disabled pending compliance sign-off.");
  }
}
