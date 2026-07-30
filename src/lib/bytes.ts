import { deflateSync, inflateSync } from 'fflate';

/** Minimal byte writer with LEB128 varints and length-prefixed utf8 strings. */
export class ByteWriter {
  private bytes: number[] = [];

  u8(v: number): this {
    this.bytes.push(v & 0xff);
    return this;
  }

  /** unsigned LEB128 */
  varint(v: number): this {
    let n = v >>> 0;
    while (n >= 0x80) {
      this.bytes.push((n & 0x7f) | 0x80);
      n >>>= 7;
    }
    this.bytes.push(n);
    return this;
  }

  string(s: string): this {
    const enc = new TextEncoder().encode(s);
    this.varint(enc.length);
    for (const b of enc) this.bytes.push(b);
    return this;
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/** Reader counterpart to ByteWriter. */
export class ByteReader {
  private pos = 0;
  constructor(private data: Uint8Array) {}

  get done(): boolean {
    return this.pos >= this.data.length;
  }

  u8(): number {
    if (this.pos >= this.data.length) throw new RangeError('unexpected end of data');
    return this.data[this.pos++];
  }

  varint(): number {
    let result = 0;
    let shift = 0;
    for (;;) {
      const byte = this.u8();
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }
    return result >>> 0;
  }

  string(): string {
    const len = this.varint();
    const slice = this.data.subarray(this.pos, this.pos + len);
    this.pos += len;
    return new TextDecoder().decode(slice);
  }
}

/*
 * Compression container.
 *
 * Payloads are deflated before base64 so share links stay short. Raw deflate
 * rather than gzip: same algorithm, without the 18 bytes of gzip framing, and
 * both ends are ours. Compression is only kept when it actually wins — on a
 * tiny grid the deflate overhead can exceed the savings.
 *
 * A compressed payload is prefixed with COMPRESSED_TAG. Uncompressed payloads
 * start with their own format's version byte (currently 5-8 for boards, or the
 * `[`/`{` of JSON), so old links keep decoding untouched.
 */
const COMPRESSED_TAG = 0xc0;

/** Deflate `raw`, tagged, or return it as-is when compression doesn't help. */
export function packBytes(raw: Uint8Array): Uint8Array {
  const packed = deflateSync(raw, { level: 9 });
  if (packed.length + 1 >= raw.length) return raw;
  const out = new Uint8Array(packed.length + 1);
  out[0] = COMPRESSED_TAG;
  out.set(packed, 1);
  return out;
}

/** Inverse of packBytes; passes uncompressed payloads straight through. */
export function unpackBytes(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 0 || bytes[0] !== COMPRESSED_TAG) return bytes;
  return inflateSync(bytes.subarray(1));
}

/** URL-safe base64 (no padding) for a byte array. */
export function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
