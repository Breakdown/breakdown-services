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
}

export default BillsService;
