/**
 * Bijective (1-to-1) reversible ID codec for project IDs.
 * Converts integer database IDs (1, 2, 3...) into short, randomized alphanumeric strings
 * (e.g., "2fkb0m", "2qqepv") so that URLs like /detail/10 are not guessable by typing sequential numbers.
 */

const PRIME = 10000019;
const MULTIPLIER = 48271; // Prime root
const XOR_MASK = 0x3F5E7B;

// Precalculated modular inverse of MULTIPLIER mod PRIME
// (48271 * INVERSE) % 10000019 === 1
function getModInverse(a: number, m: number): number {
  let m0 = m, x0 = 0, x1 = 1;
  while (a > 1) {
    const q = Math.floor(a / m);
    let t = m;
    m = a % m;
    a = t;
    t = x0;
    x0 = x1 - q * x0;
    x1 = t;
  }
  return x1 < 0 ? x1 + m0 : x1;
}

const INVERSE = getModInverse(MULTIPLIER, PRIME);

/**
 * Encode a numeric ID into an unguessable string code with a checksum character.
 */
export function encodeProjectId(id: number | string): string {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  if (isNaN(numId) || numId <= 0) return String(id);

  // Step 1: Modular multiplication
  const step1 = (numId * MULTIPLIER) % PRIME;
  // Step 2: XOR obfuscation
  const step2 = step1 ^ XOR_MASK;
  
  // Convert to base36
  const baseStr = step2.toString(36);
  
  // Compute a simple 1-char checksum (mod 36)
  const checksum = (numId * 17 + 5) % 36;
  const checksumChar = checksum.toString(36);

  return `${baseStr}${checksumChar}`;
}

/**
 * Decode an unguessable string code back to the numeric ID.
 * Returns null if the code is invalid or checksum fails.
 */
export function decodeProjectId(code: string): number | null {
  if (!code || typeof code !== "string" || code.length < 2) {
    return null;
  }

  try {
    const checksumChar = code.slice(-1);
    const baseStr = code.slice(0, -1);

    const step2 = parseInt(baseStr, 36);
    if (isNaN(step2) || step2 < 0) return null;

    const step1 = step2 ^ XOR_MASK;
    const numId = (step1 * INVERSE) % PRIME;

    if (numId <= 0 || numId >= PRIME) return null;

    // Verify checksum
    const expectedChecksum = (numId * 17 + 5) % 36;
    if (expectedChecksum.toString(36) !== checksumChar) {
      return null;
    }

    return numId;
  } catch {
    return null;
  }
}
