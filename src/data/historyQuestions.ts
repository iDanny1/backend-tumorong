export interface HistoryQuestion {
  id: string;
  question: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
}

export const HISTORY_QUESTIONS: HistoryQuestion[] = [
  {
    id: 'hq_1',
    question: 'Chiến thắng lịch sử Điện Biên Phủ "lừng lẫy năm châu, chấn động địa cầu" diễn ra vào năm nào?',
    options: [
      { key: 'A', text: '1945' },
      { key: 'B', text: '1954' },
      { key: 'C', text: '1975' },
      { key: 'D', text: '1968' },
    ],
    correctKey: 'B',
    explanation: 'Chiến thắng Điện Biên Phủ kết thúc thắng lợi vào ngày 07/05/1954.',
  },
  {
    id: 'hq_2',
    question: 'Vùng đất Tu Mơ Rông – nơi sản sinh ra Quốc bảo Sâm Ngọc Linh thuộc tỉnh nào của vùng Tây Nguyên?',
    options: [
      { key: 'A', text: 'Gia Lai' },
      { key: 'B', text: 'Đắk Lắk' },
      { key: 'C', text: 'Kon Tum' },
      { key: 'D', text: 'Lâm Đồng' },
    ],
    correctKey: 'C',
    explanation: 'Huyện Tu Mơ Rông nằm ở phía bắc tỉnh Kon Tum, dưới chân dãy núi Ngọc Linh hùng vĩ.',
  },
  {
    id: 'hq_3',
    question: 'Bác Hồ đọc bản Tuyên ngôn Độc lập khai sinh ra nước Việt Nam Dân chủ Cộng hòa vào ngày tháng năm nào?',
    options: [
      { key: 'A', text: '19/08/1945' },
      { key: 'B', text: '02/09/1945' },
      { key: 'C', text: '30/04/1975' },
      { key: 'D', text: '03/02/1930' },
    ],
    correctKey: 'B',
    explanation: 'Ngày 02/09/1945 tại Quảng trường Ba Đình (Hà Nội), Chủ tịch Hồ Chí Minh đã đọc Tuyên ngôn Độc lập.',
  },
  {
    id: 'hq_4',
    question: 'Đỉnh núi Ngọc Linh – "nóc nhà của miền Trung - Tây Nguyên" có độ cao bao nhiêu mét?',
    options: [
      { key: 'A', text: '2.598 m' },
      { key: 'B', text: '3.143 m' },
      { key: 'C', text: '1.980 m' },
      { key: 'D', text: '2.240 m' },
    ],
    correctKey: 'A',
    explanation: 'Đỉnh Ngọc Linh có độ cao 2.598 mét so với mực nước biển, thuộc khối núi đá cổ Ngọc Linh.',
  },
  {
    id: 'hq_5',
    question: 'Vị vua nào của triều Tây Sơn đã chỉ huy trận đại phá 29 vạn quân Thanh vào dịp Tết Kỷ Dậu 1789?',
    options: [
      { key: 'A', text: 'Vua Quang Trung (Nguyễn Huệ)' },
      { key: 'B', text: 'Vua Đinh Tiên Hoàng' },
      { key: 'C', text: 'Vua Lê Lợi' },
      { key: 'D', text: 'Vua Lý Thái Tổ' },
    ],
    correctKey: 'A',
    explanation: 'Hoàng đế Quang Trung (Nguyễn Huệ) chỉ huy đại quân thần tốc đại phá 29 vạn quân Thanh mùa xuân năm 1789.',
  },
  {
    id: 'hq_6',
    question: 'Sâm Ngọc Linh chính thức được Thủ tướng Chính phủ công nhận là "Quốc bảo Việt Nam" vào năm nào?',
    options: [
      { key: 'A', text: 'Năm 2000' },
      { key: 'B', text: 'Năm 2010' },
      { key: 'C', text: 'Năm 2017' },
      { key: 'D', text: 'Năm 2022' },
    ],
    correctKey: 'C',
    explanation: 'Sâm Ngọc Linh được Thủ tướng Nguyễn Xuân Phúc công nhận là Quốc bảo Việt Nam vào năm 2017.',
  },
  {
    id: 'hq_7',
    question: 'Trận chiến lừng lẫy trên sông Bạch Đằng năm 938 do vị anh hùng dân tộc nào lãnh đạo đánh tan quân Nam Hán?',
    options: [
      { key: 'A', text: 'Ngô Quyền' },
      { key: 'B', text: 'Trần Hưng Đạo' },
      { key: 'C', text: 'Lê Hoàn' },
      { key: 'D', text: 'Lý Thường Kiệt' },
    ],
    correctKey: 'A',
    explanation: 'Ngô Quyền dùng chiến thuật cọc ngầm cắm dưới lòng sông Bạch Đằng đánh tan quân Nam Hán năm 938.',
  },
];
