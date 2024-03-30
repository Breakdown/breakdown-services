import { Bill } from "../data/types";

export const getBillTitle = (bill: Bill): string => {
  return (
    bill.humanShortTitle ||
    bill.humanTitle ||
    bill.aiTitle ||
    bill.aiShortTitle ||
    bill.shortTitle ||
    bill.title ||
    ""
  );
};

export const getBillSummary = (bill: Bill): string => {
  return (
    bill.humanShortSummary ||
    bill.humanSummary ||
    bill.aiSummary ||
    bill.aiShortSummary ||
    bill.summaryShort ||
    bill.summary ||
    ""
  );
};
