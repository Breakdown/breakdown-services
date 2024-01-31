import { Bill, Representative } from "@prisma/client";
import dbClient from "../utils/prisma.js";

class BillsService {
  constructor() {}

  async getBillById(id: string): Promise<Bill | null> {
    const dbResponse = await dbClient.bill.findUnique({
      where: {
        id,
      },
    });
    return dbResponse;
  }

  async getBillSponsor(id: string): Promise<Representative | null | undefined> {
    const dbResponse = await dbClient.bill.findUnique({
      where: {
        id,
      },
      select: {
        sponsor: true,
      },
    });
    return dbResponse?.sponsor;
  }

  async getBillCosponsors(id: string): Promise<Representative[] | undefined> {
    const dbResponse = await dbClient.bill.findUnique({
      where: {
        id,
      },
      select: {
        cosponsors: true,
      },
    });
    return dbResponse?.cosponsors;
  }
}

export default BillsService;
