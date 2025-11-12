# Bảo mật & công bằng (anti‑cheat)

Nguyên tắc:
- Server authoritative: mọi cập nhật tài sản, N, kết quả được tính ở server.
- Xác thực nhẹ: `playerId` ngẫu nhiên; `hostSecret` cho quyền host.
- Ràng buộc phase/deadline ở server; client không tự ý reveal hoặc sửa điểm.

Chống spam/gián đoạn:
- Rate limit theo `playerId` và `ip` cho sự kiện nhạy cảm (LOCK_ACTION, HOST_*).
- Bỏ qua sự kiện trái phase hoặc trễ deadline.
- Debounce cập nhật tên/đội; giới hạn kích thước payload.

Tính đúng đắn JOINT_INVEST/CRYPTO_GAMBLE:
- Xử lý hoàn toàn ở server; random (tung xu) dùng RNG server.
- Ghi lại `revealLog` trong Room để kiểm tra/tranh chấp.

Quyền riêng tư tối thiểu:
- Không lưu dữ liệu cá nhân; chỉ lưu tên hiển thị.
- Ẩn `hostSecret` khỏi broadcast; chỉ hiển thị controls ở client có secret hợp lệ.

Khôi phục tạm thời:
- Nếu client rớt, khi reconnect nhận ROOM_SNAPSHOT để tiếp tục.

