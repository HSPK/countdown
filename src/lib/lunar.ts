/* Minimal Chinese lunar calendar (农历) — Gregorian ↔ Lunar.
   Covers 1900-01-31 (lunar 1900-01-01) through end of 2100.
   Algorithm: walk days from the epoch using a packed table where each
   year encodes 12 month sizes + optional leap month + leap month size.
   Encoding (per row):
     bits 0-3:   leap month position (1..12, 0 if no leap)
     bits 4-15:  12 main months (bit 4 = month 12, bit 15 = month 1)
                 1 means 30 days, 0 means 29
     bit 16:     leap month days (0=29, 1=30) when leap exists
*/

const LUNAR_INFO: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090
  0x0d520,                                                                                  // 2100
]

const MIN_YEAR = 1900
const MAX_YEAR = MIN_YEAR + LUNAR_INFO.length - 1

function leapMonth(year: number): number {
  return LUNAR_INFO[year - MIN_YEAR] & 0xf
}
function leapDays(year: number): number {
  if (leapMonth(year) === 0) return 0
  return (LUNAR_INFO[year - MIN_YEAR] & 0x10000) ? 30 : 29
}
function monthDays(year: number, month: number): number {
  // month is 1..12, bit 15 = month 1, bit 4 = month 12
  const bit = 0x10000 >> month
  return (LUNAR_INFO[year - MIN_YEAR] & bit) ? 30 : 29
}
function yearDays(year: number): number {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    if (LUNAR_INFO[year - MIN_YEAR] & i) sum++
  }
  return sum + leapDays(year)
}

export interface LunarDate {
  year: number    // 农历年 (e.g. 2026)
  month: number   // 1..12
  day: number     // 1..30
  isLeap: boolean // whether `month` is the leap month
}

/* Convert a Gregorian date (local time, no timezone math) to its lunar
   equivalent. Returns null if outside the supported range. */
export function solarToLunar(y: number, m: number, d: number): LunarDate | null {
  if (y < MIN_YEAR || y > MAX_YEAR) return null
  const epoch = Date.UTC(1900, 0, 31)
  const target = Date.UTC(y, m - 1, d)
  let offset = Math.floor((target - epoch) / 86400000)
  if (offset < 0) return null

  let ly = MIN_YEAR
  while (ly <= MAX_YEAR && offset >= yearDays(ly)) {
    offset -= yearDays(ly)
    ly++
  }
  if (ly > MAX_YEAR) return null

  const leapM = leapMonth(ly)
  let lm = 1
  let isLeap = false
  while (lm <= 12) {
    let md: number
    if (leapM > 0 && lm === leapM + 1 && !isLeap) {
      // We've passed month `leapM`; now insert the leap version of it.
      lm--
      isLeap = true
      md = leapDays(ly)
    } else {
      md = monthDays(ly, lm)
    }
    if (offset < md) break
    offset -= md
    if (isLeap && lm === leapM) {
      isLeap = false
    }
    lm++
  }
  return { year: ly, month: lm, day: offset + 1, isLeap }
}

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const CN_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const CN_TENS = ['初', '十', '廿', '卅']

function cnYear(y: number): string {
  return String(y).split('').map((c) => CN_DIGITS[+c]).join('')
}
function cnMonth(m: number, isLeap: boolean): string {
  return (isLeap ? '闰' : '') + CN_MONTHS[m - 1] + '月'
}
function cnDay(d: number): string {
  if (d === 10) return '初十'
  if (d === 20) return '二十'
  if (d === 30) return '三十'
  return CN_TENS[Math.floor(d / 10)] + (d % 10 ? CN_DIGITS[d % 10] : '')
}

/** "二〇二六年正月初一" style label. */
export function formatLunar(l: LunarDate): string {
  return `${cnYear(l.year)}年 ${cnMonth(l.month, l.isLeap)}${cnDay(l.day)}`
}

/** Compact "正月初一" — no year. */
export function formatLunarShort(l: LunarDate): string {
  return `${cnMonth(l.month, l.isLeap)}${cnDay(l.day)}`
}
