import { describe, it, expect } from "vitest";
import {
  DemoBroker,
  MystocksBroker,
  MockPaymentProvider,
  DarajaPaymentProvider,
} from "./interfaces";

describe("Broker & Payment Provider Architecture", () => {
  it("DemoBroker places simulated orders with pending or filled status", async () => {
    const broker = new DemoBroker();
    expect(broker.name).toBe("DemoBroker");
    expect(broker.isLive).toBe(false);

    const order = await broker.placeOrder({
      symbol: "SCOM",
      exchange: "NSE",
      side: "buy",
      type: "market",
      quantity: 100,
      currency: "KES",
    });

    expect(order.simulated).toBe(true);
    expect(order.status).toBe("filled");
    expect(order.filledQuantity).toBe(100);
  });

  it("MystocksBroker raises clean Coming Soon error while disabled by flag", async () => {
    const broker = new MystocksBroker();
    expect(broker.name).toBe("mystocks.africa");
    expect(broker.isLive).toBe(false);

    await expect(
      broker.placeOrder({
        symbol: "EQTY",
        exchange: "NSE",
        side: "buy",
        type: "market",
        quantity: 50,
        currency: "KES",
      }),
    ).rejects.toThrow(/coming soon/i);
  });

  it("MockPaymentProvider produces simulated STK push and B2C responses", async () => {
    const payment = new MockPaymentProvider();
    expect(payment.isLive).toBe(false);

    const stk = await payment.initiateSTKPush({
      phoneNumber: "+254712345678",
      amountMinor: 50000n, // KES 500.00
      accountReference: "ACC001",
      description: "Deposit",
    });

    expect(stk.simulated).toBe(true);
    expect(stk.responseCode).toBe("0");

    const b2c = await payment.initiateB2CWithdrawal({
      phoneNumber: "+254712345678",
      amountMinor: 20000n,
      remarks: "Withdrawal",
    });

    expect(b2c.simulated).toBe(true);
    expect(b2c.responseCode).toBe("0");
  });

  it("DarajaPaymentProvider blocks live transactions until compliance sign-off", async () => {
    const daraja = new DarajaPaymentProvider();
    expect(daraja.isLive).toBe(true);

    await expect(
      daraja.initiateSTKPush({
        phoneNumber: "+254712345678",
        amountMinor: 10000n,
        accountReference: "REF",
        description: "Test",
      }),
    ).rejects.toThrow(/disabled pending compliance sign-off/i);
  });
});
