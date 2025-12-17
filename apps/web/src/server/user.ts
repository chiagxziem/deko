import type { User } from "@repo/db/schemas/auth.schema";
import type { AxiosHeaders } from "axios";
import { headers } from "next/headers";

import { axiosClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/lib/types";

// Get User
export const getUser = async () => {
  try {
    const response = await axiosClient.get<ApiSuccessResponse<User>>(
      "/user/me",
      {
        headers: (await headers()) as unknown as AxiosHeaders,
      },
    );
    return response.data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
