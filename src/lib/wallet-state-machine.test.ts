import { describe, it, expect } from "vitest";
import {
  transitionTransaction,
  type StateMachineContext,
} from "./wallet-state-machine";

describe("Wallet Deposit/Withdrawal State Machine", () => {
  const createInitialDeposit = (): StateMachineContext => ({
    id: "tx-123",
    type: "deposit",
    state: "initiated",
    amountMinor: 500000n, // KES 5,000.00
    phoneNumber: "+254712345678",
    initiatedAt: new Date(),
    updatedAt: new Date(),
  });

  it("transitions smoothly through happy path: initiated -> pin_pending -> confirmed -> settled", () => {
    let tx = createInitialDeposit();
    expect(tx.state).toBe("initiated");

    // 1. Send STK Push
    tx = transitionTransaction(tx, { type: "SEND_STK_PUSH" });
    expect(tx.state).toBe("pin_pending");

    // 2. PIN entered / Daraja STK callback received
    tx = transitionTransaction(tx, {
      type: "CALLBACK_CONFIRMED",
      reference: "QGH1234567",
    });
    expect(tx.state).toBe("confirmed");
    expect(tx.reference).toBe("QGH1234567");

    // 3. Settle funds into ledger
    tx = transitionTransaction(tx, { type: "SETTLE_LEDGER" });
    expect(tx.state).toBe("settled");
  });

  it("handles user timeout in pin_pending state -> expired", () => {
    let tx = createInitialDeposit();
    tx = transitionTransaction(tx, { type: "SEND_STK_PUSH" });
    expect(tx.state).toBe("pin_pending");

    tx = transitionTransaction(tx, { type: "TIMEOUT_EXPIRE" });
    expect(tx.state).toBe("expired");
    expect(tx.failureReason).toContain("PIN");
  });

  it("handles STK push failure / cancellation -> failed", () => {
    let tx = createInitialDeposit();
    tx = transitionTransaction(tx, { type: "SEND_STK_PUSH" });

    tx = transitionTransaction(tx, {
      type: "FAIL",
      reason: "Request cancelled by user",
    });
    expect(tx.state).toBe("failed");
    expect(tx.failureReason).toBe("Request cancelled by user");
  });

  it("handles reversal from settled state -> reversed", () => {
    let tx = createInitialDeposit();
    tx = transitionTransaction(tx, { type: "SEND_STK_PUSH" });
    tx = transitionTransaction(tx, {
      type: "CALLBACK_CONFIRMED",
      reference: "QGH999",
    });
    tx = transitionTransaction(tx, { type: "SETTLE_LEDGER" });
    expect(tx.state).toBe("settled");

    tx = transitionTransaction(tx, {
      type: "REVERSE",
      reason: "M-Pesa reversal notice received",
    });
    expect(tx.state).toBe("reversed");
  });

  it("disallows invalid transitions from terminal states", () => {
    let tx = createInitialDeposit();
    tx = transitionTransaction(tx, { type: "FAIL", reason: "Invalid phone" });
    expect(tx.state).toBe("failed");

    expect(() =>
      transitionTransaction(tx, { type: "SEND_STK_PUSH" }),
    ).toThrow(/terminal state/);
  });
});
