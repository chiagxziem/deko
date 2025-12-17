import axios from "axios";

import { env } from "./env";

const axiosClient = axios.create({
  baseURL: `${env.API_URL}/api`,
});

export { axiosClient };
