# Tổng quan & Mục tiêu kỹ thuật

Mục tiêu: Vận hành game real‑time. Ưu tiên triển khai đơn giản (một tiến trình)
Yêu cầu chính:
- Nhiều phòng (rooms), mỗi phòng là một trận game độc lập.
- 4–8 đội, mỗi đội 3–8 người; mỗi vòng 1–2 phút đàm phán, 4 vòng tổng cộng.
- Đồng bộ real‑time: đàm phán, chọn hành động, lật thẻ cùng lúc, cập nhật chỉ số N, áp phí và rủi ro.
- Máy chủ là nguồn sự thật (server authoritative) để chống gian lận.
- Không đổi tài sản ở cuối game; điểm chốt tính theo trạng thái đóng băng.

Phạm vi MVP (khuyến nghị):
1) Tạo/Tham gia phòng, đặt tên đội, thêm người chơi (không bắt buộc đăng nhập).
2) Chủ phòng (host) bắt đầu game, điều khiển tiến trình vòng, bốc thẻ sự kiện tự động.
3) Giao diện chọn đối tác và úp thẻ hành động, lật đồng thời theo đồng hồ đếm ngược.
4) Cập nhật tài sản, tính chỉ số N, tính phí TKL, rủi ro C, broadcast trạng thái.
5) Kết thúc game, đóng băng, tính điểm và hiển thị bảng xếp hạng.

Lộ trình mở rộng:
- Nhiều instance: thêm Redis Pub/Sub cho WebSocket fan‑out và kho trạng thái bền.
- Tùy chỉnh luật: tham số hóa tài sản đầu kỳ, số vòng, thời lượng.
- Xem lại (replay), thống kê, export CSV.
- Xác thực nhẹ qua magic link hoặc mã phòng + mã quản trị.

