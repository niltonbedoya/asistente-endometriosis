import type { KnowledgeEntry, OcrDocument, OcrResult } from './contracts';

export class InMemoryOcrAdapter {
  constructor(private readonly fixture: Record<string, string>) {}

  async extract(document: OcrDocument): Promise<OcrResult> {
    return { documentId: document.id, text: this.fixture[document.id] ?? '', source: 'ON_DEVICE' };
  }
}

export class LocalKnowledgeIndex {
  private readonly entries: KnowledgeEntry[] = [];

  add(entry: KnowledgeEntry): void {
    this.entries.push(entry);
  }

  search(query: string): KnowledgeEntry[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return this.entries
      .map((entry, index) => ({ entry, index, score: terms.reduce((score, term) => score + ((entry.title + ' ' + entry.text).toLowerCase().includes(term) ? 1 : 0), 0) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((result) => result.entry);
  }
}
