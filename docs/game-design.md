# Thiết kế game (Luật & Nội dung)

Tài liệu tổng hợp luật chơi, tài sản, chỉ số N và vòng chơi để dev bám theo khi hiện thực hóa.

Số người chơi: tối đa 8. Mỗi người là một "nhóm" độc lập (không còn khái niệm nhiều người/nhóm).

Tài sản và điểm cuối:
- TKL (vàng): 3 điểm/đơn vị, giá trị cố định.
- TG (giấy): 1 điểm/đơn vị, chỉ thay đổi khi có thẻ lạm phát.
- TS (tiền số): 2 điểm/đơn vị; dùng để chơi (hợp tác/ phản bội/ đầu tư).
- C (crypto): 5 điểm/đơn vị nếu không sập; biến động tạm thời theo N.

Chỉ số N – niềm tin thị trường (tạm thời ảnh hưởng giá):
- N tăng (nhiều hợp tác): TS mạnh lên (+1 tạm thời)
- N 0 (ổn định): Không đổi
- N giảm (nhiều phản bội): Crypto mạnh (+1 đến +3 tạm thời)

Niêm yết tham chiếu (tạm thời, dùng trong đàm phán):
- TS = 2 + ( +1 nếu N ≥ +1, −1 nếu N ≤ −1 )
- C  = 5 + ( +1 nếu N ≤ −1, +3 nếu N ≤ −2 )
- TKL = 3 (cố định)
- TG = 1 (trừ khi có lạm phát)

Thẻ hành động:
- Hợp tác: cả hai +5 TS
- Phản bội: bạn +8 TS, đối phương −5 TS
- Đầu tư chung: mỗi bên góp 3 TS; nếu cả hai giữ lời → mỗi bên +5 TS
- Đầu cơ crypto: chọn số C để gamble → tung xu: x2 hoặc mất

Phí giữ vàng (TKL):
- 1–7: không phạt
- 8–11: −1 TS/vòng
- ≥12: −2 TS/vòng

Rủi ro crypto (C):
- Nếu rút thẻ “Sập Sàn Crypto”: nhóm giữ ≥4 C → mất 1 C ngay.

Tài sản ban đầu mỗi nhóm:
- TKL=3, TG=5, TS=6, C=1

Quy trình mỗi vòng (tổng 4 vòng):
1) Rút thẻ sự kiện đầu vòng (xem thêm ở docs/events.md) → cập nhật N và bảng giá tạm thời.
2) Hệ thống tự động ghép cặp 2 người với nhau (nếu lẻ, một người nghỉ vòng).
3) Đồng hồ đếm ngược; mỗi người lock 1 hành động với đối thủ đã ghép.
4) Hết giờ hoặc tất cả đã lock → lật cùng lúc.
5) Áp kết quả: cộng/trừ tài sản theo cặp.
6) Đếm số hợp tác/ phản bội → cập nhật N.
7) Tính phí TKL + rủi ro C (nếu có) → sang vòng sau.

Kết thúc game:
- Đóng băng thị trường, không được đổi nữa.
- Tổng điểm = 3×TKL + 1×TG + 2×TS + 5×C (nếu C không sập)
- Người chơi có điểm cao nhất thắng.
