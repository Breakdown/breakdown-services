import { BreakdownBill } from "../types/api";

export const getBillTitle = (bill: BreakdownBill) => {
  return (
    bill.human_short_title || bill.human_title || bill.short_title || bill.title
  );
};
export const getBillSummary = (bill: BreakdownBill) => {
  console.log(bill);
  return (
    bill.human_short_summary ||
    bill.human_summary ||
    bill.summary_short ||
    bill.summary
  );
};
