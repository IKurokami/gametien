# Bộ thẻ Sự kiện (rút đầu vòng/đầu game)

Mục đích: điều chỉnh tâm lý thị trường (N) và bối cảnh vòng chơi. Mỗi thẻ có thể tác động đến 1 loại tài sản (TKL/TG/TS/C) hoặc nhiều loại đồng thời.

Thời điểm rút:
- Mặc định: rút ĐẦU MỖI VÒNG (khuyến nghị cho trải nghiệm động).
- Tuỳ chọn: rút MỘT LẦN ở đầu game để cố định bối cảnh (cấu hình phòng xác định `eventsMode = 'PER_ROUND' | 'ONCE'`).

Định dạng (gợi ý TypeScript):
```ts
interface EventCard {
  id: string;
  name: string;
  description: string;
  group: 'SENTIMENT' | 'POLICY_MACRO' | 'CRYPTO_TECH' | 'COMMODITIES_FIAT' | 'LIQUIDITY_VOL';
  effects: Array<
    | { type: 'DELTA_N'; value: -2 | -1 | 0 | 1 | 2 }
    | { type: 'INFLATION'; enabled: boolean } // TG chịu ảnh hưởng giảm tạm thời
    | { type: 'CRYPTO_CRASH_FLAG'; enabled: boolean } // rủi ro C kích hoạt trong vòng
    | { type: 'BONUS_TS_ON_COOP'; value: number } // +TS thêm khi hợp tác vòng này
    | { type: 'PENALTY_TS_ON_BETRAY'; value: number }
    // Mở rộng (tác động trực tiếp niêm yết nhiều tài sản cùng lúc; chỉ ảnh hưởng tạm thời trong vòng)
    | { type: 'PRICE_BUMP'; bump: { TS?: number; C?: number; TKL?: number; TG?: number } }
    // Mở rộng (điều chỉnh phí TKL tính vào TS ở cuối vòng; +1 nghĩa là nặng hơn 1 TS)
    | { type: 'TKL_FEE_TS_DELTA'; delta: -2 | -1 | 1 | 2 }
  >;
}
```

Phân nhóm bộ thẻ (mỗi nhóm ≥ 10 thẻ)

1) Nhóm SENTIMENT — Niềm tin & Tâm lý thị trường
- CONFIDENCE_WAVE — DELTA_N +1; description: Hợp tác lan tỏa.
- TRUST_SURGE — DELTA_N +2; PRICE_BUMP { TS:+1 }.
- STABLE_MOOD — DELTA_N 0; PRICE_BUMP {}.
- RUMOR_SPREAD — DELTA_N -1; PRICE_BUMP { C:+1 }.
- PANIC_SELLING — DELTA_N -2; PRICE_BUMP { C:+3 }.
- OPTIMISM_RETURN — DELTA_N +1; BONUS_TS_ON_COOP +1.
- SKEPTICISM — DELTA_N -1; PENALTY_TS_ON_BETRAY +1.
- COOP_FEST — DELTA_N +2; BONUS_TS_ON_COOP +2.
- TIT_FOR_TAT — DELTA_N 0; PENALTY_TS_ON_BETRAY +2.
- QUIET_SESSION — DELTA_N 0.
- FOLLOW_THE_TREND — DELTA_N -1; PRICE_BUMP { C:+1, TS:-1 }.

2) Nhóm POLICY_MACRO — Chính sách & Vĩ mô
- SURPRISE_INFLATION — INFLATION true; DELTA_N 0.
- RATE_CUT — DELTA_N +1; PRICE_BUMP { TS:+1, TKL:-1 }.
- RATE_HIKE — DELTA_N -1; PRICE_BUMP { TKL:+1, TS:-1 }.
- FISCAL_STIMULUS — DELTA_N +1; BONUS_TS_ON_COOP +2.
- AUSTERITY — DELTA_N -1; PENALTY_TS_ON_BETRAY +1.
- CAPITAL_CONTROL — DELTA_N -1; PRICE_BUMP { TKL:+1, C:-1 }.
- PAPER_SHORTAGE — INFLATION true; PRICE_BUMP { TG:-1 }.
- SAFE_HAVEN_RUSH — DELTA_N -1; PRICE_BUMP { TKL:+1, C:+1 }.
- MACRO_STABILITY — DELTA_N 0; PRICE_BUMP { TS:+1, TG:+1 }.
- TAX_ON_GOLD — TKL_FEE_TS_DELTA +1; DELTA_N 0.
- WAGE_GROWTH — DELTA_N +1; PRICE_BUMP { TG:+1 }.

3) Nhóm CRYPTO_TECH — Công nghệ & Crypto
- TECH_BREAKTHROUGH — DELTA_N +1; PRICE_BUMP { C:+1 }.
- EXCHANGE_OUTAGE — CRYPTO_CRASH_FLAG true; DELTA_N -1.
- CHAIN_CONGESTION — DELTA_N -1; PRICE_BUMP { C:+1 }.
- INSTITUTIONAL_ADOPTION — DELTA_N -1; PRICE_BUMP { C:+2 }.
- AIRDROP_SEASON — DELTA_N 0; PRICE_BUMP { C:+1, TS:+1 }.
- HACK_RUMOR — DELTA_N -2; CRYPTO_CRASH_FLAG true.
- PROTOCOL_UPGRADE — DELTA_N +1; PRICE_BUMP { C:+1, TG:+1 }.
- MINING_DIFFICULTY_DROP — DELTA_N 0; PRICE_BUMP { C:-1 }.
- REGULATORY_SCARE — DELTA_N -1; PRICE_BUMP { C:-1, TKL:+1 }.
- MEGABULL_MEME — DELTA_N -1; PRICE_BUMP { C:+3 }.
- SIDECHAIN_BOOM — DELTA_N 0; PRICE_BUMP { C:+1, TS:+1 }.

4) Nhóm COMMODITIES_FIAT — Hàng hoá & tiền giấy
- GOLD_RALLY — DELTA_N -1; PRICE_BUMP { TKL:+1 }.
- GOLD_TAX_CUT — TKL_FEE_TS_DELTA -1; DELTA_N 0.
- PAPER_GLUT — INFLATION false; PRICE_BUMP { TG:+1 }.
- SUPPLY_SHOCK_PAPER — INFLATION true; PRICE_BUMP { TG:-1 }.
- HOARDING_WAVE — DELTA_N -1; PRICE_BUMP { TKL:+1, TG:-1 }.
- SAFE_BOX_FULL — DELTA_N 0; PRICE_BUMP { TKL:+1 }.
- INDUSTRIAL_BOOM — DELTA_N +1; PRICE_BUMP { TS:+1, TG:+1 }.
- DEFENSIVE_MOVE — DELTA_N -1; PRICE_BUMP { TKL:+1, TS:-1 }.
- CASH_IS_KING — DELTA_N -1; PRICE_BUMP { TG:+1, TS:-1 }.
- RECYCLING_PUSH — DELTA_N 0; PRICE_BUMP { TG:+1 }.
- SILENT_ACCUMULATION — DELTA_N 0; PRICE_BUMP { TKL:+1 }.

5) Nhóm LIQUIDITY_VOL — Thanh khoản & Biến động
- DEEP_LIQUIDITY — DELTA_N +1; PRICE_BUMP { TS:+1, C:+1 }.
- THIN_ORDERBOOK — DELTA_N -1; PRICE_BUMP { C:+2 }.
- CIRCUIT_BREAKER — DELTA_N 0; CRYPTO_CRASH_FLAG true.
- SHORT_SQUEEZE — DELTA_N 0; PRICE_BUMP { C:+2, TS:+1 }.
- LONG_SQUEEZE — DELTA_N 0; PRICE_BUMP { C:-2, TS:-1 }.
- QUIET_TAPE — DELTA_N 0.
- RISK_ON — DELTA_N +1; PRICE_BUMP { TS:+1, C:+1, TG:-1 }.
- RISK_OFF — DELTA_N -1; PRICE_BUMP { TKL:+1, C:+1, TS:-1 }.
- CROSS_ASSET_SPILLOVER — DELTA_N 0; PRICE_BUMP { C:+1, TS:-1, TG:+1 }.
- FLIGHT_TO_QUALITY — DELTA_N -1; PRICE_BUMP { TKL:+1, TG:+1 }.
- MEAN_REVERSION — DELTA_N 0; PRICE_BUMP { TS:+1, C:-1 }.

Niêm yết tác động (nhắc lại):
- TS = 2 + ( +1 nếu N ≥ +1, −1 nếu N ≤ −1 )
- C  = 5 + ( +1 nếu N ≤ −1, +3 nếu N ≤ −2 )
- TKL = 3 (cố định)
- TG = 1 (trừ khi có lạm phát)
- PRICE_BUMP (nếu có) sẽ cộng trực tiếp vào niêm yết tạm thời của từng tài sản trong vòng đó.
- TKL_FEE_TS_DELTA (nếu có) cộng/trừ trực tiếp vào mức phí TS áp cuối vòng.

Gợi ý triển khai rút bài:
- Khởi tạo bộ bài theo group + trọng số: ví dụ `SENTIMENT:40%`, `POLICY_MACRO:20%`, `CRYPTO_TECH:20%`, `COMMODITIES_FIAT:10%`, `LIQUIDITY_VOL:10%`.
- Shuffle khi tạo phòng; mỗi vòng pop 1 thẻ (PER_ROUND) hoặc pop 1 thẻ đầu game (ONCE).
- Khi rút thẻ, cập nhật `market`: N (cộng DELTA_N trong khung −2..+2), cờ `inflation`, `cryptoCrashFlag`, và bảng PRICE_BUMP tạm thời (nếu dùng mở rộng).
- Broadcast `ROUND_STARTED` kèm `market` đã cập nhật theo thẻ.
