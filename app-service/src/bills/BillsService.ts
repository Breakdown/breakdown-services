import dbClient from "../utils/prisma.js";

class BillsService {
  constructor() {}

  async getBillById(id: string) {
    const dbResponse = await dbClient.bill.findUnique({
      where: {
        id,
      },
    });
    return dbResponse;
  }

  async getBillSponsor(id: string) {
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
}

export default BillsService;
