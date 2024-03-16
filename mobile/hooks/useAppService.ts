import { useState } from "react";
import AppService from "../data/appService";

export default function useAppService(): AppService {
  const [appService] = useState(() => new AppService());

  return appService;
}
