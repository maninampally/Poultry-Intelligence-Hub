export interface BhashiniRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export class BhashiniClient {
  static async translate(_request: BhashiniRequest): Promise<string> {
    return _request.text;
  }
}
