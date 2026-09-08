import { inflateRawSync, inflateSync } from "node:zlib";
import { stripNul } from "../db/pg-json";

function finish(text: string) {
  return stripNul(text)
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readU16(buf: Buffer, offset: number) {
  return buf.readUInt16LE(offset);
}

function readU32(buf: Buffer, offset: number) {
  return buf.readUInt32LE(offset);
}

function extractZipEntry(buf: Buffer, fileName: string): Buffer | null {
  const minEocd = 22;
  let eocd = -1;
  const start = Math.max(0, buf.length - 65557);
  for (let i = buf.length - minEocd; i >= start; i -= 1) {
    if (
      buf[i] === 0x50 &&
      buf[i + 1] === 0x4b &&
      buf[i + 2] === 0x05 &&
      buf[i + 3] === 0x06
    ) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const cdEntries = readU16(buf, eocd + 10);
  let offset = readU32(buf, eocd + 16);
  for (let n = 0; n < cdEntries && offset + 46 <= buf.length; n += 1) {
    if (readU32(buf, offset) !== 0x02014b50) break;
    const method = readU16(buf, offset + 10);
    const compSize = readU32(buf, offset + 20);
    const nameLen = readU16(buf, offset + 28);
    const extraLen = readU16(buf, offset + 30);
    const commentLen = readU16(buf, offset + 32);
    const localOff = readU32(buf, offset + 42);
    const name = buf.subarray(offset + 46, offset + 46 + nameLen).toString("utf8");
    if (name === fileName) {
      if (localOff + 30 > buf.length) return null;
      const localNameLen = readU16(buf, localOff + 26);
      const localExtra = readU16(buf, localOff + 28);
      const dataStart = localOff + 30 + localNameLen + localExtra;
      const data = buf.subarray(dataStart, dataStart + compSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      return null;
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function stripXml(xml: string) {
  return xml
    .replace(/<w:tab\b[^/]*\/>/g, " ")
    .replace(/<w:br\b[^/]*\/>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const FONT_NOISE =
  /\b(font|basefont|encoding|identity[- ]?h|cidfont|cmap|glyph|truetype|opentype|type0|type1|fontdescriptor|tounicode|descendantfonts|fontname|fontfile|fontbbox|widths|firstchar|lastchar)\b/i;

const SUBSET_FONT = /^[A-Z]{5,6}\+[A-Za-z0-9-]+$/;

function letterRatio(text: string) {
  const compact = text.replace(/\s+/g, "");
  if (!compact.length) return 0;
  return (compact.match(/[A-Za-z]/g) ?? []).length / compact.length;
}

function looksLikeReadable(text: string) {
  const stripped = text.replace(/\s+/g, " ").trim();
  if (stripped.length < 2) return false;
  if (SUBSET_FONT.test(stripped)) return false;
  if (FONT_NOISE.test(stripped)) return false;
  const letters = (stripped.match(/[A-Za-z]/g) ?? []).length;
  return letters >= 2 && letterRatio(stripped) >= 0.4;
}

function decodeLiteral(inner: string) {
  return inner
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\b/g, "")
    .replace(/\\f/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_, oct: string) => {
      const code = Number.parseInt(oct, 8);
      return code ? String.fromCharCode(code) : "";
    });
}

function utf16be(bytes: Buffer) {
  const chars: string[] = [];
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = bytes.readUInt16BE(i);
    if (!code) continue;
    chars.push(String.fromCharCode(code));
  }
  return chars.join("");
}

function parseHexInt(hex: string) {
  return Number.parseInt(hex.replace(/\s+/g, ""), 16);
}

function parseToUnicode(content: string) {
  const map = new Map<number, string>();

  const addPair = (srcHex: string, destHex: string) => {
    const src = parseHexInt(srcHex);
    if (!Number.isFinite(src)) return;
    const clean = destHex.replace(/[^0-9a-fA-F]/g, "");
    if (clean.length < 2) return;
    const padded = clean.length % 2 ? `${clean}0` : clean;
    map.set(src, utf16be(Buffer.from(padded, "hex")));
  };

  for (const block of content.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const pair of block[1]!.matchAll(/<([0-9A-Fa-f\s]+)>\s*<([0-9A-Fa-f\s]+)>/g)) {
      addPair(pair[1]!, pair[2]!);
    }
  }

  for (const block of content.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const range of block[1]!.matchAll(
      /<([0-9A-Fa-f\s]+)>\s*<([0-9A-Fa-f\s]+)>\s*<([0-9A-Fa-f\s]+)>/g,
    )) {
      const start = parseHexInt(range[1]!);
      const end = parseHexInt(range[2]!);
      const dest = parseHexInt(range[3]!);
      if (![start, end, dest].every(Number.isFinite) || end < start) continue;
      for (let cid = start, uni = dest; cid <= end; cid += 1, uni += 1) {
        const hex = uni.toString(16).padStart(4, "0");
        map.set(cid, utf16be(Buffer.from(hex, "hex")));
      }
    }
  }

  return map;
}

function hexToText(hex: string, cmap: Map<number, string>) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  if (clean.length < 2) return "";
  const padded = clean.length % 2 ? `${clean}0` : clean;
  const bytes = Buffer.from(padded, "hex");

  if (cmap.size) {
    const width = [...cmap.keys()].every((key) => key <= 0xff) ? 1 : 2;
    let mapped = "";
    for (let i = 0; i < bytes.length; i += width) {
      const cid =
        width === 1
          ? bytes[i]!
          : i + 1 < bytes.length
            ? bytes.readUInt16BE(i)
            : bytes[i]!;
      mapped += cmap.get(cid) ?? "";
    }
    if (looksLikeReadable(mapped)) return mapped;
  }

  if (bytes.length >= 2 && bytes.length % 2 === 0) {
    const asUtf16 = utf16be(bytes);
    if (looksLikeReadable(asUtf16)) return asUtf16;
  }

  const latin = bytes.toString("latin1");
  return looksLikeReadable(latin) ? latin : "";
}

function collectLiterals(body: string) {
  return [...body.matchAll(/\((?:\\.|[^\\)])*\)/g)].map((match) =>
    decodeLiteral(match[0].slice(1, -1)),
  );
}

function shownStrings(content: string, cmap: Map<number, string>) {
  const out: string[] = [];

  for (const match of content.matchAll(/\((?:\\.|[^\\)])*\)\s*(?:Tj|'|")/g)) {
    out.push(decodeLiteral(match[0].replace(/\)\s*(?:Tj|'|")$/, "").slice(1)));
  }
  for (const match of content.matchAll(/<([0-9A-Fa-f \t\r\n]+)>\s*(?:Tj|'|")/g)) {
    out.push(hexToText(match[1]!, cmap));
  }
  for (const match of content.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
    const body = match[1]!;
    out.push(...collectLiterals(body));
    for (const hex of body.matchAll(/<([0-9A-Fa-f \t\r\n]+)>/g)) {
      out.push(hexToText(hex[1]!, cmap));
    }
  }

  return out.filter(looksLikeReadable);
}

function inflatePdfStreams(buffer: Buffer) {
  const latin = buffer.toString("latin1");
  const parts = [latin];
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRe.exec(latin))) {
    const raw = Buffer.from(match[1]!, "latin1");
    const candidates = [raw];
    if (raw.length) candidates.push(raw.subarray(0, raw.length - 1));
    for (const candidate of candidates) {
      try {
        parts.push(inflateSync(candidate).toString("latin1"));
        break;
      } catch {
        try {
          parts.push(inflateRawSync(candidate).toString("latin1"));
          break;
        } catch {
          // Not a Flate stream.
        }
      }
    }
  }
  return parts.join("\n");
}

function extractPdf(buffer: Buffer) {
  const content = inflatePdfStreams(buffer);
  const cmap = parseToUnicode(content);
  const text = shownStrings(content, cmap).join(" ");
  return finish(text).slice(0, 20000);
}

function extractDocx(buffer: Buffer) {
  try {
    const xml = extractZipEntry(buffer, "word/document.xml");
    if (!xml) return "";
    return finish(stripXml(xml.toString("utf8"))).slice(0, 20000);
  } catch {
    return "";
  }
}

export function extractResumeText(
  buffer: Buffer,
  fileName: string,
  mimeType = "",
) {
  const lower = fileName.toLowerCase();
  const mime = mimeType.toLowerCase();
  if (lower.endsWith(".docx") || mime.includes("wordprocessingml")) {
    return extractDocx(buffer);
  }
  if (lower.endsWith(".doc") && !lower.endsWith(".docx")) {
    return finish(
      buffer.toString("utf8").replace(/[^\x09\x0a\x0d\x20-\x7e]/g, " "),
    ).slice(0, 20000);
  }
  if (lower.endsWith(".pdf") || mime.includes("pdf")) {
    return extractPdf(buffer);
  }
  return finish(buffer.toString("utf8")).slice(0, 20000);
}
