class GeneralFunction {
  private backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  getBackendUrl() {
    if (this.backendUrl === undefined) {
      throw new Error("Backend URL is not defined");
    }
    return this.backendUrl;
  }

  createUrl(path: string): string {
    if (this.backendUrl === undefined) {
      throw new Error("Backend URL is not defined");
    }
    return this.backendUrl + path;
  }
}

export const generalFunctions = new GeneralFunction();
