import { describe, expect, it } from 'vitest';
import { createMcpCapability, type OcrDocument } from '@core/mcp/contracts';
import { InMemoryOcrAdapter, LocalKnowledgeIndex } from '@core/mcp/local-adapters';

describe('MCP and on-device boundaries', () => {
  it('declares capabilities with explicit local-only data policy', () => {
    const capability = createMcpCapability('mcp-ocr-medical', ['extract_text', 'extract_biomarkers']);
    expect(capability.dataPolicy).toBe('ON_DEVICE_ONLY');
    expect(capability.capabilities).toContain('extract_text');
  });

  it('extracts OCR through a local adapter without network assumptions', async () => {
    const document: OcrDocument = { id: 'doc-1', mimeType: 'image/jpeg', bytes: new Uint8Array([1, 2, 3]) };
    const adapter = new InMemoryOcrAdapter({ 'doc-1': 'Informe: hemoglobina 13.2' });
    const result = await adapter.extract(document);
    expect(result.text).toContain('hemoglobina');
    expect(result.source).toBe('ON_DEVICE');
  });

  it('indexes and queries knowledge locally with deterministic ranking', () => {
    const index = new LocalKnowledgeIndex();
    index.add({ id: 'curcuma', title: 'Cúrcuma y precauciones', text: 'Interacciones con anticoagulantes.' });
    index.add({ id: 'respiracion', title: 'Respiración diafragmática', text: 'Relajación y suelo pélvico.' });
    expect(index.search('anticoagulantes')[0]?.id).toBe('curcuma');
    expect(index.search('suelo pélvico')[0]?.id).toBe('respiracion');
  });
});
