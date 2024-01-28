import { Twilio } from "twilio";
import InternalError from "../utils/errors/InternalError.js";
import { redis } from "../utils/redis.js";

export enum MessageType {
  Signup,
  Signin,
}
class SmsService {
  twilioClient?: Twilio;
  constructor() {
    if (
      !process.env.TWILIO_ACCOUNT_ID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      throw new InternalError("Missing Twilio environment variables");
    }
    const newTwilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_ID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.twilioClient = newTwilioClient;
  }

  async sendVerificationCodeSms({
    phone,
    deviceId,
    type,
  }: {
    phone: string;
    deviceId: string;
    type: MessageType;
  }) {
    // Create and set verification code in Redis
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    await redis.set(
      deviceId,
      JSON.stringify({
        code: randomCode,
        phone,
        type,
      })
    );
    // Determine text of message based on message type
    let messageText = "";
    switch (type) {
      case MessageType.Signin:
        messageText = `Your Breakdown verification code is: ${randomCode}. This code will expire in 10 minutes.`;
        break;
      case MessageType.Signup:
        messageText = `Welcome to Breakdown! Your verification code is: ${randomCode}. This code will expire in 10 minutes.`;
        break;
      default:
        messageText = `Your Breakdown verification code is: ${randomCode}. This code will expire in 10 minutes.`;
        break;
    }
    this.twilioClient?.messages.create({
      body: messageText,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return true;
  }
}

export default SmsService;
