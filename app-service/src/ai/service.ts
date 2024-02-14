import OpenAI from "openai";
import InternalError from "../utils/errors/InternalError.js";
import dbClient from "../utils/prisma.js";

class AiService {
  openaiInstance: OpenAI;
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalError("OpenAI API key not found");
    }
    this.openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getBillSummary(id: string) {
    const basePrompt =
      "The following text is a Bill active in the House or Senate in the United States. Please provide a succinct summary of the consequences of this bill passing or failing in a vote. Target audience for this summary is the average American. Respond in Markdown.";

    const billFullText = await dbClient.billFullText.findUnique({
      where: {
        billId: id,
      },
      include: {
        bill: true,
      },
    });
    if (!billFullText) {
      throw new InternalError("Bill text not found");
    }
    // For now, no double summarizing bills - can change this later
    if (billFullText?.bill?.aiSummary) {
      return billFullText.bill.aiSummary;
    }

    const prompt = basePrompt + "\n" + billFullText.fullText;
    const response = await this.openaiInstance.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
    });
    const summary = response.choices[0].message.content;
    return summary;
  }
}

export default AiService;
