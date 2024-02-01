import { Bill, Representative } from "@prisma/client";
import dbClient from "../utils/prisma.js";

class RepresentativesService {
  constructor() {}

  async getRepById(id: string): Promise<Representative | null> {
    const dbResponse = await dbClient.representative.findUnique({
      where: {
        id,
      },
    });
    return dbResponse;
  }
}

export default RepresentativesService;
