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
    let session = null;
    if (typeof window === "undefined") {
      const { getServerSession } = await import("next-auth");
      const { authOptions } = await import("./auth");
      session = await getServerSession(authOptions);
    } else {
      const { getSession } = await import("next-auth/react");
      session = await getSession();
    }

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
