import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
class GeneralFunction {
  private BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  get backendUrl(): string {
    if (this.BACKEND_URL === undefined) {
      throw new Error("Backend URL is not defined");
    }
    return this.BACKEND_URL;
  }

  createUrl(path: string): string {
    return this.backendUrl + path;
  }

  async createRequest(
    path: string,
    init: RequestInit = {},
  ): Promise<{
    url: string;
    options: RequestInit;
  }> {
    const session = await getServerSession(authOptions);

    const headers = new Headers(init.headers);

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    }

    return {
      url: this.backendUrl + path,
      options: {
        ...init,
        headers,
      },
    };
  }
}

export const generalFunctions = new GeneralFunction();
