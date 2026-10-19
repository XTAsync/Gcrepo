/**
 * M-Pesa deposit & withdrawal state machine.
 * States:
 *   initiated -> pin_pending -> confirmed -> settled
 * Terminal / error states:
 *   failed | expired | reversed
 */

export type TransactionState =
  | "initiated"
  | "pin_pending"
  | "confirmed"
  | "settled"
  | "failed"
  | "expired"
  | "reversed";

export type TransactionType = "deposit" | "withdrawal";

export interface StateMachineContext {
  id: string;
  type: TransactionType;
  state: TransactionState;
  amountMinor: bigint;
  phoneNumber: string;
  reference?: string;
  initiatedAt: Date;
  updatedAt: Date;
  failureReason?: string;
}

export type TransactionEvent =
  | { type: "SEND_STK_PUSH" }
  | { type: "PIN_ENTERED_SUCCESS"; reference: string }
  | { type: "CALLBACK_CONFIRMED"; reference: string }
  | { type: "SETTLE_LEDGER" }
  | { type: "FAIL"; reason: string }
  | { type: "TIMEOUT_EXPIRE" }
  | { type: "REVERSE"; reason: string };

export function transitionTransaction(
  current: StateMachineContext,
  event: TransactionEvent,
): StateMachineContext {
  const now = new Date();

  switch (current.state) {
    case "initiated":
      if (event.type === "SEND_STK_PUSH") {
        return {
          ...current,
          state: "pin_pending",
          updatedAt: now,
        };
      }
      if (event.type === "FAIL") {
        return {
          ...current,
          state: "failed",
          failureReason: event.reason,
          updatedAt: now,
        };
      }
      break;

    case "pin_pending":
      if (event.type === "PIN_ENTERED_SUCCESS" || event.type === "CALLBACK_CONFIRMED") {
        return {
          ...current,
          state: "confirmed",
          reference: event.reference,
          updatedAt: now,
        };
      }
      if (event.type === "FAIL") {
        return {
          ...current,
          state: "failed",
          failureReason: event.reason,
          updatedAt: now,
        };
      }
      if (event.type === "TIMEOUT_EXPIRE") {
        return {
          ...current,
          state: "expired",
          failureReason: "User took too long to enter PIN",
          updatedAt: now,
        };
      }
      break;

    case "confirmed":
      if (event.type === "SETTLE_LEDGER") {
        return {
          ...current,
          state: "settled",
          updatedAt: now,
        };
      }
      if (event.type === "REVERSE") {
        return {
          ...current,
          state: "reversed",
          failureReason: event.reason,
          updatedAt: now,
        };
      }
      break;

    case "settled":
      if (event.type === "REVERSE") {
        return {
          ...current,
          state: "reversed",
          failureReason: event.reason,
          updatedAt: now,
        };
      }
      break;

    case "failed":
    case "expired":
    case "reversed":
      // Terminal states cannot transition further
      throw new Error(`Cannot transition from terminal state: ${current.state}`);
  }

  throw new Error(`Invalid transition: event ${event.type} not allowed in state ${current.state}`);
}
