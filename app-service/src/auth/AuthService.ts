import bcrypt from "bcryptjs";
import validator from "validator";
import BadRequestError from "../utils/errors/BadRequestError.js";
import dbClient from "../utils/prisma.js";
import { BreakdownSession } from "../utils/express.js";
import UnauthorizedError from "../utils/errors/UnauthorizedError.js";
import SmsService, { MessageType } from "../sms/SmsService.js";
import { redis } from "../utils/redis.js";
import InternalError from "../utils/errors/InternalError.js";

interface RedisPhoneVerificationResponse {
  phone: string;
  code: number;
  type: MessageType;
}
class AuthService {
  session: BreakdownSession;
  constructor(session: BreakdownSession) {
    this.session = session;
  }

  async emailSignup({
    email,
    password,
    receivePromotions,
  }: {
    email: string;
    password: string;
    receivePromotions: boolean;
  }) {
    email = email.trim().toLowerCase();

    // Verify email and password requirements
    if (!validator.isEmail(email)) {
      throw new BadRequestError("Invalid email");
    }

    // Check if user exists
    const existingUser = await dbClient.user.findUnique({
      where: {
        email,
      },
    });
    if (existingUser) {
      throw new BadRequestError("User already exists");
    }

    // Hash password
    const _password = await bcrypt.hash(password, 10);

    const newUser = await dbClient.user.create({
      data: {
        email,
        password: _password,
        receivePromotions,
      },
    });

    this.session.userId = newUser.id;

    return newUser;
  }

  async emailSignin({ email, password }: { email: string; password: string }) {
    email = email.trim().toLowerCase();

    // Find user
    const user = await dbClient.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new UnauthorizedError(
        "User does not exist, please create an account"
      );
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password || "");
    if (!match) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return user;
  }

  async smsSignup({ phone, deviceId }: { phone: string; deviceId: string }) {
    // Verify phone # is real
    if (!validator.isMobilePhone(phone)) {
      throw new BadRequestError("Invalid phone number");
    }

    // Check if user exists
    const existingUser = await dbClient.user.findFirst({
      where: {
        phone,
      },
    });
    if (existingUser) {
      throw new BadRequestError("User already exists");
    }

    // Send signup verification code
    const smsService = new SmsService();
    return await smsService.sendVerificationCodeSms({
      phone,
      deviceId,
      type: MessageType.Signup,
    });
  }

  async smsSignin({ phone, deviceId }: { phone: string; deviceId: string }) {
    // Find user
    const user = await dbClient.user.findFirst({
      where: {
        phone,
      },
    });

    if (!user) {
      throw new UnauthorizedError(
        "User does not exist, please create an account"
      );
    }

    const smsService = new SmsService();
    return await smsService.sendVerificationCodeSms({
      phone,
      deviceId,
      type: MessageType.Signin,
    });
  }

  async verifySmsSignup({
    code,
    deviceId,
  }: {
    code: number;
    deviceId: string;
  }) {
    // Get code from redis for this deviceId
    const response = await redis.get(deviceId);
    if (!response) {
      throw new InternalError("Code expired, please try again");
    }
    const redisData: RedisPhoneVerificationResponse = JSON.parse(response);
    if (!(redisData.type === MessageType.Signup)) {
      throw new InternalError("Invalid code, please try again");
    }
    if (code === redisData.code) {
      // Signup user
      const newUser = await dbClient.user.create({
        data: {
          receivePromotions: false,
          phone: redisData.phone,
        },
      });
      this.session.userId = newUser.id;
      return;
    } else {
      throw new InternalError("Invalid code, please try again");
    }
  }

  async verifySmsSignin({
    code,
    deviceId,
  }: {
    code: number;
    deviceId: string;
  }) {
    // Get code from redis for this deviceId
    const response = await redis.get(deviceId);
    if (!response) {
      throw new InternalError("Code expired, please try again");
    }
    const redisData: RedisPhoneVerificationResponse = JSON.parse(response);
    if (!(redisData.type === MessageType.Signin)) {
      throw new InternalError("Invalid code, please try again");
    }
    if (code === redisData.code) {
      // Signin user
      const user = await dbClient.user.findFirst({
        where: {
          phone: redisData.phone,
        },
      });
      this.session.userId = user?.id;
      return;
    } else {
      throw new InternalError("Invalid code, please try again");
    }
  }
}

export default AuthService;
