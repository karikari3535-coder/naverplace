// URL-safe 한 짧은 랜덤 id 생성 (충돌 안전: 64^10 ≈ 1.15e18 경우의 수)
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
export function makeId(size = 10): string {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  let id = ''
  for (let i = 0; i < size; i++) id += ALPHABET[bytes[i] & 63]
  return id
}
