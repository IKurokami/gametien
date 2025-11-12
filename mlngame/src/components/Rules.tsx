export default function Rules() {
  return (
    <div className="w-full max-w-3xl bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h1 className="text-3xl font-bold mb-4 text-center">Luật Chơi</h1>
      <p className="opacity-80 mb-4 text-center">
        Trò chơi mô phỏng tâm lý thị trường và niềm tin xã hội qua nhiều vòng.
      </p>
      <div className="space-y-4 text-sm leading-6">
        <section>
          <h2 className="font-semibold mb-1">1) Mục tiêu</h2>
          <p>Tối đa hóa điểm thông qua tương tác với người chơi khác và thị trường.</p>
        </section>
        <section>
          <h2 className="font-semibold mb-1">2) Tài sản</h2>
          <ul className="list-disc pl-5 opacity-90">
            <li>TKL (Vàng), TG (Tiền giấy), TS (Trái phiếu), C (Crypto)</li>
            <li>Giá trị tạm thời của từng loại thay đổi theo chỉ số N và sự kiện.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold mb-1">3) Vòng chơi</h2>
          <ul className="list-disc pl-5 opacity-90">
            <li>Mỗi vòng bạn được ghép cặp và đưa ra hành động.</li>
            <li>Đếm ngược kết thúc: hệ thống khóa hành động và tính điểm/tài sản.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold mb-1">4) Hành động</h2>
          <ul className="list-disc pl-5 opacity-90">
            <li>🤝 Hợp tác hoặc 💣 Phản bội với người chơi cặp.</li>
            <li>🚀 Đầu cơ Crypto bằng C với rủi ro/lợi nhuận cao.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold mb-1">5) Chợ giao dịch</h2>
          <ul className="list-disc pl-5 opacity-90">
            <li>Đăng bán TKL/TG/C để đổi lấy TS (đơn vị thanh toán).</li>
            <li>Giá gợi ý dựa trên giá trị tạm thời vòng hiện tại.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold mb-1">6) Kết thúc</h2>
          <p>Bảng điểm tổng hợp sau cùng dựa trên tài sản bạn đang nắm giữ.</p>
        </section>
      </div>
    </div>
  )
}
