# Điểm hay của game

Game mô phỏng hai lớp tương tác xảy ra đồng thời:
- Lớp xã hội (niềm tin): mỗi vòng bạn đối mặt thế tiến thoái lưỡng nan (Hợp tác/Phản bội), tạo ra động lực tâm lý và chiến thuật giữa người chơi.
- Lớp thị trường (tài sản): sự kiện vĩ mô làm biến động giá trị tài sản; người chơi phải phân bổ TS để mua TKL/Crypto và chịu các loại phí/rủi ro.

Nhờ kết hợp hai lớp này, game khuyến khích người chơi vừa đọc tâm lý đối thủ, vừa quản trị rủi ro và thanh khoản—một cảm giác “đánh đổi đa mục tiêu” rất thực tế.

## Điểm nổi bật
- Quyết định chiến lược kép: cùng lúc cân nhắc hành vi đối tác (hợp tác/ phản bội) và phân bổ vốn (mua TKL, mua Crypto).
- Biến cố thị trường giàu bối cảnh: các sự kiện (lạm phát, sàn sự cố, tin đồn, sóng tự tin, …) làm thay đổi giá vòng, buộc điều chỉnh chiến lược.
- Tính tương hỗ – lặp lại: mỗi vòng ghép cặp mới; hành vi vòng trước ảnh hưởng kỳ vọng vòng sau (cả ở phía đối thủ lẫn chỉ số N của thị trường).
- Rủi ro/Phí có ý nghĩa: phí giữ vàng theo lượng TKL, rủi ro Crypto khi thị trường xấu; tránh lối chơi “all-in” thiếu cân nhắc thanh khoản.
- Minh bạch kết quả: cuối vòng hiển thị nhật ký cho từng người chơi, gồm lựa chọn của bạn và đối thủ, cùng số TS +/- theo kết quả và các khoản phí/rủi ro.
- Nhịp độ nhanh, dễ học: luật đơn giản, vòng chơi ngắn, dễ tổ chức cho nhóm nhỏ 4–8 người.

## Bạn học được gì
- Tư duy trò chơi (game theory):
  - Thế tiến thoái lưỡng nan người tù, lặp lại nhiều vòng và tác động của danh tiếng/nhớ dài.
  - Chiến lược đáp trả (tit-for-tat, luôn hợp tác, luôn phản bội, trừng phạt có điều kiện…).
- Quản trị rủi ro và thanh khoản:
  - Khi nào giữ TS, khi nào chuyển sang TKL/Crypto theo giá vòng và sự kiện.
  - Ảnh hưởng của phí/rủi ro lên hiệu suất dài hạn.
- Ra quyết định dưới bất định: cân bằng giữa lợi thế ngắn hạn (phản bội lấy TS) và lợi ích dài hạn (duy trì hợp tác, ổn định N).

## Vòng chơi (core loop)
1) Mỗi người khóa 1 hành động: 🤝 Hợp tác, 💣 Phản bội, 🚀 Mua Crypto, 🥇 Mua TKL.
2) Sự kiện thị trường xác lập giá vòng; ghép cặp để tính kết quả xã hội (TS +/-).
3) Áp dụng phí/rủi ro (giữ vàng, rủi ro Crypto) và auto-quy đổi để đảm bảo tối thiểu TS.
4) Công bố kết quả: hiển thị log chi tiết cho từng người và ghi chú vòng (notes).
5) Chuyển vòng tiếp theo cho đến khi hết tổng số vòng.

## Gợi ý chiến thuật
- Đừng bỏ qua giá vòng: cùng một lượng TS có thể mua được số TKL/C khác nhau tùy sự kiện.
- Danh tiếng quan trọng: log công khai kết quả cặp giúp người khác suy đoán chiến lược của bạn ở vòng sau.
- Đa dạng hóa: tránh ôm quá nhiều TKL để không chịu phí nặng; cũng tránh giữ quá nhiều C khi rủi ro crypto bật.
- Giao dịch P2P (nếu mở Marketplace): cân nhắc định giá theo TS và sự kiện để tối ưu hoán đổi.

## Tổ chức buổi chơi (cho host)
- Số người: 4–8 là lý tưởng. Game cân với người lẻ (ai đó có thể đứng lẻ 1 vòng).
- Thời lượng: 3–5 phút/vòng x 4 vòng. Có thể điều chỉnh trong cấu hình phòng.
- Vai trò GM (tùy chọn): điều phối, giải thích luật, nhấn mạnh ý nghĩa sự kiện và cách đọc log.

## Trải nghiệm minh bạch (UI)
- Bảng giá vòng: hiển thị giá TS, TKL, TG, C theo sự kiện.
- Hành động: chọn Hợp tác/Phản bội hoặc nhập số lượng để mua Crypto/TKL.
- Nhật ký vòng (per-player):
  - “Kết quả với A: Bạn BETRAY, A COOPERATE → +8 TS …”
  - “Mua vàng (TKL): +2 TKL với giá 3 TS”
  - “Phí giữ vàng: -1 TS”, “Rủi ro Crypto: -1 C”

## Vì sao phù hợp cho workshop/lớp học
- Dễ hướng dẫn, xây dựng nhanh sự tham gia của cả nhóm.
- Minh họa sinh động quan hệ giữa niềm tin xã hội và biến động thị trường.
- Kết thúc mỗi vòng có điểm dừng tự nhiên để thảo luận: vì sao bạn chọn thế? sự kiện ảnh hưởng ra sao? nếu lặp lại bạn sẽ làm gì khác?

---
Mẹo: bạn có thể sửa thời lượng vòng, số vòng, và tài sản khởi đầu trong cấu hình phòng để phù hợp với bối cảnh (đào tạo, team-building, hay thi đấu nhanh).

