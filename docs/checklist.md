# Checklist MVP & công việc

MVP bắt buộc:
- [x] Tạo phòng, tham gia phòng (tên người)
- [x] WS hub + room manager (in‑memory)
- [x] Game Master: tạo + bắt đầu game (xem, không can thiệp)
- [x] PairingEngine: tự động ghép cặp mỗi vòng (xử lý số lượng lẻ)
- [x] Đồng hồ đếm ngược và lock hành động theo người chơi
- [x] Reveal đồng thời, áp luật 4 thẻ (chưa có auto‑reveal theo deadline)
- [~] Cập nhật N, phí TKL, rủi ro C (N + phí TKL đã áp; rủi ro C cần thẻ sự kiện)
- [x] Snapshot & broadcast state, scoreboard cuối game

Chất lượng & vận hành:
- [ ] Rate limit, validate payload, lỗi chuẩn hoá
- [ ] Reconnect + ROOM_SNAPSHOT
- [ ] Log sự kiện vòng, revealLog để kiểm chứng

UI tối thiểu:
- [x] Lobby → Room
- [x] Room List (danh sách phòng + join nhanh)
- [x] Danh sách người chơi và tài sản
- [x] Màn hình cặp đấu (đối thủ hiện tại), úp thẻ, trạng thái lock
- [x] Bảng N và bảng giá tạm thời (minh hoạ giá theo N; inflation hiển thị khi có cờ)
- [x] Game Master view (đọc‑chỉ)

Mở rộng (sau MVP):
- [ ] Redis pub/sub để scale
- [ ] Tùy chỉnh cấu hình game theo phòng
- [ ] Replay/Export CSV
- [ ] Auth nhẹ (mã quản trị phòng)

Ghi chú tiến độ & việc tiếp theo:
- Auto‑reveal theo deadline: cần timer scheduler phía server để lật khi hết giờ kể cả thiếu lock.
- Bộ thẻ sự kiện: cần triển khai rút bài, áp DELTA_N/INFLATION/CRYPTO_CRASH_FLAG để kích hoạt rủi ro C.
- Reconnect giữ danh tính: bổ sung token lưu localStorage và rejoin giữ `playerId` nếu còn hợp lệ.
- Room List: REST `GET /api/rooms` trả danh sách, UI hiển thị để chọn nhanh.
- Bảng giá tạm thời: hiển thị TS/C/TKL/TG theo N và cờ inflation.
- Rate limit & validate payload: thêm middleware và chuẩn hóa mã lỗi theo protocol.
- Log vòng/reveal: ghi `revealLog` trong Room để kiểm chứng.
