import { sum } from "@/domain/calc"
import type { FarmState } from "@/domain/types"

export function financeOf(state: FarmState) {
  const invoices = sum(
    state.expenses.filter((expense) => expense.kind === "invoice").map((expense) => expense.amountPaise),
  )
  const cash = sum(
    state.expenses.filter((expense) => expense.kind === "cash").map((expense) => expense.amountPaise),
  )
  const payments = sum(state.payments.map((payment) => payment.amountPaise))
  const applied = sum(
    state.contras
      .filter((contra) => contra.status === "applied")
      .map((contra) => contra.amountPaise),
  )
  const sales = sum(state.sales.map((sale) => sale.amountPaise))
  const receipts = sum(state.receipts.map((receipt) => receipt.amountPaise))
  const recordedCost = invoices + cash
  return {
    recordedCost,
    paidCost: payments + cash,
    supplierDue: invoices - payments - applied,
    sales,
    cashReceived: receipts,
    buyerDue: sales - receipts - applied,
    cashPosition: receipts - (payments + cash),
    estimatedNet: sales - recordedCost,
    appliedContra: applied,
  }
}
