# Luật chơi (Game Rules)

Tài liệu này mô tả đầy đủ luật chơi hiện tại của game, bao gồm vòng chơi, hành động, sự kiện thị trường, giao dịch và cách tính điểm cuối game.

## 1) Mục tiêu
- Tối đa hóa tổng giá trị danh mục tài sản của bạn sau các vòng chơi.
- Giá trị danh mục được tính theo BẢNG GIÁ hiện hành ở thời điểm kết thúc (do sự kiện chi phối theo từng vòng).

## 2) Tài sản và đơn vị
- TKL (Vàng)
- TG (Tiền giấy)
- TS (Tiền số) — đơn vị thanh toán trong chợ và khi đầu tư Crypto
- C (Crypto)

Mỗi người chơi bắt đầu với danh mục KHÁC NHAU về cơ cấu (TKL/TG/TS/C) nhưng có cùng tổng giá trị khởi điểm, tính theo BẢNG GIÁ NỀN (TS=5, TG=5, TKL=20, C=60). Điều này đảm bảo công bằng nhưng khuyến khích chiến lược đa dạng.

## 3) Vòng chơi và pha
Mỗi game gồm nhiều vòng. Mỗi vòng có các pha:
- Lật sự kiện + cập nhật thị trường: hệ thống bốc 1 thẻ sự kiện để điều chỉnh chỉ số N và các cờ (ví dụ lạm phát, sự cố sàn). Từ đó tính ra BẢNG GIÁ chính thức cho vòng: `prices = { TKL, TG, TS, C }`.
- Đàm phán + chọn hành động: người chơi bị ghép cặp và chọn 1 hành động cho vòng (chi tiết ở mục 4). Có thời gian đếm ngược. Có thể giao dịch trên chợ trong thời gian này.
- Công bố kết quả (reveal): áp dụng kết quả hành động, tính phí/cuối vòng và ghi nhật ký.

## 4) Hành động trong cặp
Khi kết thúc đếm ngược, hệ thống xét kết quả cho từng cặp người chơi A–B. Các hành động:

- COOPERATE (Hợp tác)
- BETRAY (Phản bội)
- CRYPTO_GAMBLE (Đầu tư Crypto bằng TS)

Kết quả theo tổ hợp hành động của hai người trong cặp:
- A: COOPERATE, B: COOPERATE → A: +5 TS, B: +5 TS
- A: BETRAY, B: BETRAY → Không đổi TS trực tiếp (các phí/cuối vòng vẫn áp dụng riêng)
- A: BETRAY, B: COOPERATE → A: +8 TS, B: -5 TS
- A: COOPERATE, B: BETRAY → B: +8 TS, A: -5 TS

Với CRYPTO_GAMBLE (đầu tư Crypto bằng TS):
- Người chọn hành động này sẽ mua một lượng C theo payload `amountC` (số C muốn mua) với chi phí TS = `priceTS(C, amountC)` dựa trên BẢNG GIÁ hiện hành của vòng.
- Điều kiện: phải đủ TS để chi. Khi hợp lệ: trừ TS tương ứng và cộng C tương ứng. Không phụ thuộc vào hành động của đối phương.
- Nếu cả hai cùng chọn CRYPTO_GAMBLE thì mỗi người được xử lý riêng theo quy tắc trên.

Trường hợp một người bị lẻ cặp (không có đối tác):
- Không có tương tác COOPERATE/BETRAY.
- Nếu chọn CRYPTO_GAMBLE thì vẫn mua C bằng TS như mô tả.

## 5) Sự kiện và BẢNG GIÁ
- Mỗi vòng bốc 1 sự kiện từ bộ bài đơn giản: ví dụ “Làn sóng tự tin”, “Tin đồn lan rộng”, “Bán tháo hoảng loạn”, “Lạm phát bất ngờ”, “Sàn giao dịch gặp sự cố”, v.v.
- Sự kiện điều chỉnh chỉ số tâm lý N và cờ thị trường như `inflation` (lạm phát), `cryptoCrashFlag`.
- Từ N và các cờ, hệ thống tính ra BẢNG GIÁ chính thức cho vòng (authoritative):
- TS: 1 (cơ bản), điều chỉnh theo N: +1 nếu N ≥ 1, -1 nếu N ≤ -1, nhưng không thấp hơn 1
  - C: 5, tăng thêm khi N thấp (≤ -1) và mạnh hơn khi N ≤ -2
  - TKL: 3 (ổn định trong phiên bản hiện tại)
  - TG: 1 (giữ giá trị 1 để tránh trường hợp phi thực tế)
- Client nhận `indicative` từ API chính là `market.prices` (BẢNG GIÁ) của vòng hiện tại.

## 6) Chợ giao dịch (P2P)
- Người bán có thể đăng bán TKL/TG/C để đổi lấy TS (TS là đơn vị thanh toán).
- Hệ thống gợi ý/định giá dựa trên BẢNG GIÁ hiện hành của vòng.
- Khi khớp lệnh: người mua trừ TS và cộng tài sản; người bán nhận TS. Tài sản đăng bán sẽ được “giữ chỗ” (reserve) khi tạo offer và trả lại nếu hủy.
- Chợ reset mỗi vòng (offer không kéo dài sang vòng tiếp theo).

## 7) Phí và điều chỉnh cuối vòng
- Phí giữ vàng (TKL):
  - Nắm 8–11 TKL: -1 TS
  - Nắm ≥12 TKL: -2 TS
- Rủi ro Crypto (khi sự kiện “sự cố sàn” kích hoạt):
  - Ai nắm ≥4 C bị -1 C ngay cuối vòng.
- Cập nhật N sau vòng: nếu tổng lựa chọn COOPERATE trong phòng > BETRAY → N tăng 1; nếu BETRAY > COOPERATE → N giảm 1; bằng nhau → không đổi.
 - Quy tắc tối thiểu TS: Nếu TS của một người về 0 sau các điều chỉnh, hệ thống sẽ tự động quy đổi tài sản khác sang TS theo thứ tự TG → TKL → C, mỗi lần 1 đơn vị đến khi TS ≥ 1 (dựa trên bảng giá hiện hành). Nhật ký sẽ ghi rõ các quy đổi này.

## 8) Tính điểm / Giá trị danh mục
- Trong suốt game, BẢNG GIÁ có thể thay đổi sau mỗi vòng do sự kiện.
- Khi hiển thị bảng điểm cuối game, giá trị danh mục của mỗi người chơi =
  - `TKL * price.TKL + TG * price.TG + TS * price.TS + C * price.C`
  - Trong đó `price.*` lấy từ `market.prices` (BẢNG GIÁ) ở thời điểm kết thúc.

## 9) Lưu ý thiết kế & công bằng
- CRYPTO_GAMBLE giờ là hành động “đầu tư Crypto bằng TS”, không còn cơ chế may–rủi x2/-x như trước.
- Toàn bộ định giá và giao dịch thống nhất dùng BẢNG GIÁ của vòng, tránh "giá mặc định" cố định.
- Nhật ký vòng (per-player logs) ghi lại hành động và các khoản phí/thay đổi quan trọng.

## 10) Gợi ý chiến lược
- Theo dõi N và các sự kiện để dự đoán biến động giá TS/C.
- Dùng chợ để tái cân bằng danh mục theo kỳ vọng của bạn.
- Cân nhắc giữa hợp tác để nhận TS ổn định và phản bội khi cơ hội/đối thủ phù hợp, vì N sau vòng cũng ảnh hưởng giá vòng sau.
