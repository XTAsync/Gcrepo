// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import React, { useState } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AmountInput } from "./AmountInput";

afterEach(() => {
  cleanup();
});

function TestWrapper({
  initialMinor = 0n,
  minMinor = 0n,
  maxMinor,
}: {
  initialMinor?: bigint;
  minMinor?: bigint;
  maxMinor?: bigint;
}) {
  const [val, setVal] = useState(initialMinor);
  return (
    <AmountInput
      valueMinor={val}
      onChangeMinor={setVal}
      minMinor={minMinor}
      maxMinor={maxMinor}
      label="Deposit Amount"
    />
  );
}

describe("AmountInput Component", () => {
  it("renders with currency prefix and proper label", () => {
    render(<TestWrapper />);
    expect(screen.getByText("KES")).toBeDefined();
    expect(screen.getByLabelText("Deposit Amount")).toBeDefined();
  });

  it("converts input decimal strings to exact integer cents without floats", () => {
    render(<TestWrapper />);
    const input = screen.getByLabelText("Deposit Amount") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "150.75" } });
    expect(input.value).toBe("150.75");
  });

  it("displays validation error when amount is below minMinor", () => {
    render(<TestWrapper initialMinor={5000n} minMinor={10000n} />); // KES 50.00 vs min KES 100.00
    expect(screen.getByRole("alert").textContent).toContain("Minimum amount is KES 100.00");
  });

  it("displays validation error when amount exceeds maxMinor", () => {
    render(<TestWrapper initialMinor={20000000n} maxMinor={15000000n} />); // KES 200k vs max KES 150k
    expect(screen.getByRole("alert").textContent).toContain("Maximum amount is KES 150000.00");
  });
});
