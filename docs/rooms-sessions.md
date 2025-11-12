# Phòng, phiên và quyền

Tạo/Quản trị phòng:
- Game Master (quản trò) tạo phòng (REST/WS), nhận `roomId` và `gameMasterToken` (lưu client quản trò).
- Tham gia: nhập tên để trở thành người chơi độc lập (mỗi người = 1 nhóm).
- Quyền quản trò: BẮT ĐẦU GAME và xem toàn bộ diễn biến. Không can thiệp kết quả, không force reveal, không ghép cặp.

Quy tắc join:
- Giới hạn tối đa 8 người chơi.
- Người chơi văng kết nối có thể reconnect (giữ `playerId` nếu còn token trong tab; nếu mất, join lại và được gán player mới).

Gắn danh tính nhẹ:
- Không bắt buộc đăng nhập. Tạo `playerId` ngẫu nhiên, lưu ở localStorage.
- `gameMasterToken` lưu ở sessionStorage của quản trò để hiển thị chế độ xem quản trò.

Ghép cặp & khóa hành động:
- Hệ thống tự động ghép cặp mỗi vòng. Nếu số người lẻ, một người nghỉ vòng.
- Mỗi người 1 hành động/vòng với đối thủ đã ghép. Có thể hủy trước deadline nếu cho phép.
- Khi tất cả đã lock hoặc hết thời gian → reveal.

Trao đổi (trade) bằng TS:
- Mỗi vòng có cửa sổ "đàm phán/trao đổi" (trade) đầu vòng, kết thúc tại `tradeUntilTs`.
- Người chơi có thể gửi đề nghị chuyển TS (tiền số) cho người chơi khác; người nhận chấp nhận để hoàn tất.
- Chỉ TS được chuyển trong trade; các tài sản khác không trao đổi ở phiên bản MVP.

Kết thúc game:
- Phase `ENDED`: đóng băng, không đổi nữa; hiển thị bảng điểm.
