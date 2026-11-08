// Excludes I, L, O, 0 and 1, which are easily confused when read aloud or typed.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;
const VALID_SHAPE = /^[A-Z2-9]{8,16}$/;
// Bytes at or above this value would bias the alphabet, so they are discarded.
const UNBIASED_BYTE_LIMIT = 256 - (256 % ALPHABET.length);

export function generateInviteCode(): string {
  let code = "";
  while (code.length < CODE_LENGTH) {
    const [byte] = crypto.getRandomValues(new Uint8Array(1));
    if (byte < UNBIASED_BYTE_LIMIT) code += ALPHABET[byte % ALPHABET.length];
  }
  return code;
}

export function normalizeInviteCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

export function isValidInviteCode(code: string): boolean {
  return VALID_SHAPE.test(code);
}
