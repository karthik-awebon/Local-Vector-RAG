declare module 'mammoth' {
  export interface ExtractRawTextOptions {
    arrayBuffer: ArrayBuffer;
  }

  export interface ExtractResult {
    value: string;
    messages: unknown[];
  }

  export function extractRawText(input: ExtractRawTextOptions): Promise<ExtractResult>;
}