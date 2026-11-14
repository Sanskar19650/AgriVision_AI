import zlib from 'node:zlib';

export interface SatbaraExtractedFields {
  satbaraNumber: string;
  surveyNumber: string;
  gatNumber: string;
  village: string;
  taluka: string;
  district: string;
  areaHectares: string;
}

function extractPdfTextLiterals(rawText: string): string[] {
  const chunks: string[] = [];
  const literalRegex = /\(([^()]{2,240})\)/g;
  let match: RegExpExecArray | null;
  while ((match = literalRegex.exec(rawText)) !== null) {
    const unescaped = match[1]
      .replace(/\\([()\\])/g, '$1')
      .replace(/[^\x20-\x7E\u0900-\u097F]/g, ' ')
      .trim();
    if (unescaped.length >= 2) {
      chunks.push(unescaped);
    }
  }
  return chunks;
}

/**
 * Extracts readable literal strings from uncompressed and FlateDecode-compressed
 * PDF streams alongside plain UTF-8 lines for offline 7/12 PDF fallback parsing.
 */
export function extractTextFromPdfBuffer(pdfBuffer: Buffer): string {
  const raw = pdfBuffer.toString('latin1');
  const chunks: string[] = extractPdfTextLiterals(raw);

  // Attempt to inflate compressed PDF stream blocks (e.g. FlateDecode streams)
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let streamMatch: RegExpExecArray | null;
  while ((streamMatch = streamRegex.exec(raw)) !== null) {
    const streamBytes = Buffer.from(streamMatch[1], 'latin1');
    try {
      const inflated = zlib.inflateSync(streamBytes).toString('latin1');
      chunks.push(...extractPdfTextLiterals(inflated));
    } catch {
      // Ignore non-zlib or encrypted streams
    }
  }

  // Include UTF-8 readable lines when PDF text is directly embedded
  const utf8Lines = pdfBuffer
    .toString('utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      /(survey|gat|village|taluka|district|7\/12|satbara|hectare|गा|तालुका|जिल्हा|गट)/i.test(line)
    );

  return [...chunks, ...utf8Lines].join('\n');
}

export function extractSatbaraFieldsFromText(text: string): SatbaraExtractedFields {
  const src = text || '';
  const satbaraMatch =
    /(?:7\/12[ \t]*(?:no\.?|number)[ \t:#-]+|satbara[ \t]*(?:no\.?|number)?[ \t:#-]+|7\/12[ \t]*[:#-][ \t]*)(?=[A-Za-z0-9\/\-]*\d)([A-Za-z0-9\/\-]{2,40})/i.exec(
      src
    );
  const surveyMatch =
    /(?:survey(?:[ \t]*no\.?)?|s\.?[ \t]*no\.?)[ \t:#-]+(?=[0-9\/A-Za-z\-]*\d)([0-9\/A-Za-z\-]{1,25})/i.exec(
      src
    );
  const gatMatch =
    /(?:gat(?:[ \t]*no\.?)?|गट[ \t]*क्र\.?)[ \t:#-]+(?=[0-9\/A-Za-z\-]*\d)([0-9\/A-Za-z\-]{1,25})/i.exec(
      src
    );
  const villageMatch =
    /(?:village|गाव)[ \t:#-]+([A-Za-z\s]{2,40}?)(?=\r?\n|,|taluka|district|$)/i.exec(src);
  const talukaMatch =
    /(?:taluka|तालुका)[ \t:#-]+([A-Za-z\s]{2,40}?)(?=\r?\n|,|district|$)/i.exec(src);
  const districtMatch =
    /(?:district|जिल्हा)[ \t:#-]+([A-Za-z\s]{2,40}?)(?=\r?\n|,|state|$)/i.exec(src);
  const areaMatch =
    /(?:area|hectares?|क्षेत्र)[ \t:#-]+([0-9]+(?:\.[0-9]+)?)/i.exec(src);

  return {
    satbaraNumber: satbaraMatch?.[1]?.trim() || '',
    surveyNumber: surveyMatch?.[1]?.trim() || '',
    gatNumber: gatMatch?.[1]?.trim() || '',
    village: villageMatch?.[1]?.trim() || '',
    taluka: talukaMatch?.[1]?.trim() || '',
    district: districtMatch?.[1]?.trim() || '',
    areaHectares: areaMatch?.[1]?.trim() || '',
  };
}
