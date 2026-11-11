export type McpDataPolicy = 'ON_DEVICE_ONLY' | 'EDGE_TRANSIENT_ONLY';

export interface McpCapability {
  serverName: string;
  capabilities: string[];
  dataPolicy: McpDataPolicy;
}

export function createMcpCapability(serverName: string, capabilities: string[]): McpCapability {
  return { serverName, capabilities, dataPolicy: 'ON_DEVICE_ONLY' };
}

export interface OcrDocument {
  id: string;
  mimeType: string;
  bytes: Uint8Array;
}

export interface OcrResult {
  documentId: string;
  text: string;
  source: 'ON_DEVICE';
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  text: string;
}
