import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { QuizQuestion } from '../src/models/QuizQuestion';

dotenv.config();

const QUESTIONS = [
  {
    day: 1, questionId: 'hq_d01',
    question: 'Chiến thắng lịch sử Điện Biên Phủ "lừng lẫy năm châu, chấn động địa cầu" diễn ra vào năm nào?',
    options: [{ key: 'A', text: '1945' }, { key: 'B', text: '1954' }, { key: 'C', text: '1975' }, { key: 'D', text: '1968' }],
    correctKey: 'B',
    explanation: 'Chiến thắng Điện Biên Phủ kết thúc thắng lợi vào ngày 07/05/1954.',
  },
  {
    day: 2, questionId: 'hq_d02',
    question: 'Vùng đất Tu Mơ Rông – nơi sản sinh ra Quốc bảo Sâm Ngọc Linh thuộc tỉnh nào của vùng Tây Nguyên?',
    options: [{ key: 'A', text: 'Gia Lai' }, { key: 'B', text: 'Đắk Lắk' }, { key: 'C', text: 'Kon Tum' }, { key: 'D', text: 'Lâm Đồng' }],
    correctKey: 'C',
    explanation: 'Huyện Tu Mơ Rông nằm ở phía bắc tỉnh Kon Tum, dưới chân dãy núi Ngọc Linh hùng vĩ.',
  },
  {
    day: 3, questionId: 'hq_d03',
    question: 'Bác Hồ đọc bản Tuyên ngôn Độc lập khai sinh ra nước Việt Nam Dân chủ Cộng hòa vào ngày nào?',
    options: [{ key: 'A', text: '19/08/1945' }, { key: 'B', text: '02/09/1945' }, { key: 'C', text: '30/04/1975' }, { key: 'D', text: '03/02/1930' }],
    correctKey: 'B',
    explanation: 'Ngày 02/09/1945 tại Quảng trường Ba Đình, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập.',
  },
  {
    day: 4, questionId: 'hq_d04',
    question: 'Đỉnh núi Ngọc Linh – "nóc nhà của miền Trung - Tây Nguyên" có độ cao bao nhiêu mét?',
    options: [{ key: 'A', text: '2.598 m' }, { key: 'B', text: '3.143 m' }, { key: 'C', text: '1.980 m' }, { key: 'D', text: '2.240 m' }],
    correctKey: 'A',
    explanation: 'Đỉnh Ngọc Linh cao 2.598 mét so với mực nước biển.',
  },
  {
    day: 5, questionId: 'hq_d05',
    question: 'Vị vua nào đã chỉ huy trận đại phá 29 vạn quân Thanh vào dịp Tết Kỷ Dậu 1789?',
    options: [{ key: 'A', text: 'Vua Quang Trung (Nguyễn Huệ)' }, { key: 'B', text: 'Vua Đinh Tiên Hoàng' }, { key: 'C', text: 'Vua Lê Lợi' }, { key: 'D', text: 'Vua Lý Thái Tổ' }],
    correctKey: 'A',
    explanation: 'Hoàng đế Quang Trung (Nguyễn Huệ) chỉ huy đại quân thần tốc đại phá quân Thanh mùa xuân năm 1789.',
  },
  {
    day: 6, questionId: 'hq_d06',
    question: 'Sâm Ngọc Linh chính thức được Thủ tướng Chính phủ công nhận là "Quốc bảo Việt Nam" vào năm nào?',
    options: [{ key: 'A', text: 'Năm 2000' }, { key: 'B', text: 'Năm 2010' }, { key: 'C', text: 'Năm 2017' }, { key: 'D', text: 'Năm 2022' }],
    correctKey: 'C',
    explanation: 'Sâm Ngọc Linh được công nhận là Quốc bảo Việt Nam vào năm 2017.',
  },
  {
    day: 7, questionId: 'hq_d07',
    question: 'Trận chiến trên sông Bạch Đằng năm 938 do vị anh hùng nào lãnh đạo đánh tan quân Nam Hán?',
    options: [{ key: 'A', text: 'Ngô Quyền' }, { key: 'B', text: 'Trần Hưng Đạo' }, { key: 'C', text: 'Lê Hoàn' }, { key: 'D', text: 'Lý Thường Kiệt' }],
    correctKey: 'A',
    explanation: 'Ngô Quyền dùng chiến thuật cọc ngầm đánh tan quân Nam Hán năm 938.',
  },
  {
    day: 8, questionId: 'hq_d08',
    question: 'Đảng Cộng sản Việt Nam được thành lập vào ngày tháng năm nào?',
    options: [{ key: 'A', text: '03/02/1930' }, { key: 'B', text: '19/08/1945' }, { key: 'C', text: '02/09/1945' }, { key: 'D', text: '30/04/1975' }],
    correctKey: 'A',
    explanation: 'Đảng Cộng sản Việt Nam được thành lập ngày 03/02/1930 tại Hồng Kông.',
  },
  {
    day: 9, questionId: 'hq_d09',
    question: 'Quần đảo Trường Sa thuộc tỉnh nào của Việt Nam?',
    options: [{ key: 'A', text: 'Đà Nẵng' }, { key: 'B', text: 'Khánh Hòa' }, { key: 'C', text: 'Quảng Ngãi' }, { key: 'D', text: 'Bình Thuận' }],
    correctKey: 'B',
    explanation: 'Quần đảo Trường Sa thuộc tỉnh Khánh Hòa, Việt Nam.',
  },
  {
    day: 10, questionId: 'hq_d10',
    question: 'Thủ đô Hà Nội đã có bao nhiêu năm lịch sử tính đến năm 2010 (năm kỷ niệm Thăng Long)?',
    options: [{ key: 'A', text: '500 năm' }, { key: 'B', text: '800 năm' }, { key: 'C', text: '1000 năm' }, { key: 'D', text: '1200 năm' }],
    correctKey: 'C',
    explanation: 'Năm 2010, Hà Nội kỷ niệm 1000 năm Thăng Long – Hà Nội (1010-2010).',
  },
  {
    day: 11, questionId: 'hq_d11',
    question: 'Vịnh Hạ Long được UNESCO công nhận là Di sản Thiên nhiên Thế giới lần đầu tiên vào năm nào?',
    options: [{ key: 'A', text: '1990' }, { key: 'B', text: '1994' }, { key: 'C', text: '2000' }, { key: 'D', text: '2005' }],
    correctKey: 'B',
    explanation: 'Vịnh Hạ Long lần đầu được UNESCO công nhận là Di sản Thiên nhiên Thế giới vào năm 1994.',
  },
  {
    day: 12, questionId: 'hq_d12',
    question: 'Ai là người sáng lập ra chữ Quốc ngữ – hệ thống chữ viết dựa trên bảng chữ cái Latin dùng cho tiếng Việt?',
    options: [{ key: 'A', text: 'Alexandre de Rhodes' }, { key: 'B', text: 'Nguyễn Du' }, { key: 'C', text: 'Huỳnh Thúc Kháng' }, { key: 'D', text: 'Phan Bội Châu' }],
    correctKey: 'A',
    explanation: 'Linh mục Alexandre de Rhodes người Pháp đã hoàn thiện và phổ biến chữ Quốc ngữ vào thế kỷ XVII.',
  },
  {
    day: 13, questionId: 'hq_d13',
    question: 'Đại thi hào Nguyễn Du viết Truyện Kiều bằng thể thơ nào?',
    options: [{ key: 'A', text: 'Thất ngôn tứ tuyệt' }, { key: 'B', text: 'Lục bát' }, { key: 'C', text: 'Song thất lục bát' }, { key: 'D', text: 'Ngũ ngôn' }],
    correctKey: 'B',
    explanation: 'Truyện Kiều được Nguyễn Du viết theo thể thơ lục bát – thể thơ truyền thống đặc sắc của Việt Nam.',
  },
  {
    day: 14, questionId: 'hq_d14',
    question: 'Ngày Giải phóng miền Nam, thống nhất đất nước là ngày nào?',
    options: [{ key: 'A', text: '07/05/1954' }, { key: 'B', text: '02/09/1945' }, { key: 'C', text: '30/04/1975' }, { key: 'D', text: '27/01/1973' }],
    correctKey: 'C',
    explanation: 'Ngày 30/04/1975, xe tăng quân giải phóng tiến vào Dinh Độc Lập, kết thúc chiến tranh thống nhất đất nước.',
  },
  {
    day: 15, questionId: 'hq_d15',
    question: 'Sông nào dài nhất chảy qua lãnh thổ Việt Nam?',
    options: [{ key: 'A', text: 'Sông Hồng' }, { key: 'B', text: 'Sông Đà' }, { key: 'C', text: 'Sông Mê Kông' }, { key: 'D', text: 'Sông Thu Bồn' }],
    correctKey: 'C',
    explanation: 'Sông Mê Kông (Cửu Long) là sông dài nhất chảy qua Việt Nam với chiều dài khoảng 4.880 km.',
  },
  {
    day: 16, questionId: 'hq_d16',
    question: 'Cố đô Huế được UNESCO công nhận là Di sản Văn hóa Thế giới vào năm nào?',
    options: [{ key: 'A', text: '1990' }, { key: 'B', text: '1993' }, { key: 'C', text: '1999' }, { key: 'D', text: '2003' }],
    correctKey: 'B',
    explanation: 'Quần thể di tích Cố đô Huế được UNESCO công nhận là Di sản Văn hóa Thế giới năm 1993.',
  },
  {
    day: 17, questionId: 'hq_d17',
    question: 'Anh hùng dân tộc Trần Hưng Đạo đã 3 lần đánh tan quân xâm lược nào?',
    options: [{ key: 'A', text: 'Quân Minh' }, { key: 'B', text: 'Quân Nguyên – Mông' }, { key: 'C', text: 'Quân Thanh' }, { key: 'D', text: 'Quân Tống' }],
    correctKey: 'B',
    explanation: 'Trần Hưng Đạo 3 lần lãnh đạo quân dân Đại Việt đánh thắng quân Nguyên – Mông (1258, 1285, 1288).',
  },
  {
    day: 18, questionId: 'hq_d18',
    question: 'Phố cổ Hội An được UNESCO công nhận là Di sản Văn hóa Thế giới vào năm nào?',
    options: [{ key: 'A', text: '1993' }, { key: 'B', text: '1999' }, { key: 'C', text: '2005' }, { key: 'D', text: '2010' }],
    correctKey: 'B',
    explanation: 'Phố cổ Hội An được UNESCO công nhận là Di sản Văn hóa Thế giới vào năm 1999.',
  },
  {
    day: 19, questionId: 'hq_d19',
    question: 'Nước Việt Nam hiện nay có bao nhiêu tỉnh, thành phố trực thuộc Trung ương?',
    options: [{ key: 'A', text: '58' }, { key: 'B', text: '63' }, { key: 'C', text: '64' }, { key: 'D', text: '67' }],
    correctKey: 'B',
    explanation: 'Việt Nam hiện có 63 đơn vị hành chính cấp tỉnh (58 tỉnh + 5 thành phố trực thuộc Trung ương).',
  },
  {
    day: 20, questionId: 'hq_d20',
    question: 'Đại tướng Võ Nguyên Giáp là Tổng tư lệnh Quân đội Nhân dân Việt Nam trong chiến dịch lịch sử nào?',
    options: [{ key: 'A', text: 'Chiến dịch Điện Biên Phủ' }, { key: 'B', text: 'Chiến dịch Bạch Đằng' }, { key: 'C', text: 'Chiến dịch Chi Lăng' }, { key: 'D', text: 'Chiến dịch Đống Đa' }],
    correctKey: 'A',
    explanation: 'Đại tướng Võ Nguyên Giáp trực tiếp chỉ huy chiến dịch Điện Biên Phủ năm 1954.',
  },
  {
    day: 21, questionId: 'hq_d21',
    question: 'Núi Fansipan – "nóc nhà Đông Dương" nằm ở tỉnh nào?',
    options: [{ key: 'A', text: 'Lai Châu' }, { key: 'B', text: 'Điện Biên' }, { key: 'C', text: 'Lào Cai' }, { key: 'D', text: 'Hà Giang' }],
    correctKey: 'C',
    explanation: 'Đỉnh Fansipan cao 3.143 m nằm trong dãy Hoàng Liên Sơn thuộc tỉnh Lào Cai.',
  },
  {
    day: 22, questionId: 'hq_d22',
    question: 'Lễ hội nào được UNESCO công nhận là Di sản Văn hóa Phi vật thể của nhân loại vào năm 2011?',
    options: [{ key: 'A', text: 'Lễ hội Katê' }, { key: 'B', text: 'Hội Gióng' }, { key: 'C', text: 'Lễ hội Chùa Hương' }, { key: 'D', text: 'Lễ hội Cồng Chiêng' }],
    correctKey: 'B',
    explanation: 'Hội Gióng tại đền Phù Đổng và đền Sóc được UNESCO công nhận năm 2011.',
  },
  {
    day: 23, questionId: 'hq_d23',
    question: 'Cuộc Cách mạng Tháng Tám 1945 thành công, chính quyền cách mạng giành được từ tay ai?',
    options: [{ key: 'A', text: 'Thực dân Pháp' }, { key: 'B', text: 'Phát xít Nhật' }, { key: 'C', text: 'Triều đình Nhà Nguyễn và Nhật' }, { key: 'D', text: 'Đế quốc Mỹ' }],
    correctKey: 'C',
    explanation: 'Cách mạng Tháng Tám giành chính quyền từ tay triều đình Nhà Nguyễn (bù nhìn) và quân Nhật đầu hàng.',
  },
  {
    day: 24, questionId: 'hq_d24',
    question: 'Vườn Quốc gia Phong Nha – Kẻ Bàng nằm ở tỉnh nào?',
    options: [{ key: 'A', text: 'Hà Tĩnh' }, { key: 'B', text: 'Nghệ An' }, { key: 'C', text: 'Quảng Bình' }, { key: 'D', text: 'Quảng Trị' }],
    correctKey: 'C',
    explanation: 'Vườn Quốc gia Phong Nha – Kẻ Bàng là di sản thiên nhiên thế giới nằm ở tỉnh Quảng Bình.',
  },
  {
    day: 25, questionId: 'hq_d25',
    question: 'Hiệp định Paris về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam được ký kết vào năm nào?',
    options: [{ key: 'A', text: '1968' }, { key: 'B', text: '1972' }, { key: 'C', text: '1973' }, { key: 'D', text: '1975' }],
    correctKey: 'C',
    explanation: 'Hiệp định Paris được ký ngày 27/01/1973 tại Paris, Pháp.',
  },
  {
    day: 26, questionId: 'hq_d26',
    question: 'Đồng tiền tệ của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là gì?',
    options: [{ key: 'A', text: 'Đô la' }, { key: 'B', text: 'Đồng (VND)' }, { key: 'C', text: 'Nhân dân tệ' }, { key: 'D', text: 'Baht' }],
    correctKey: 'B',
    explanation: 'Đơn vị tiền tệ chính thức của Việt Nam là Đồng Việt Nam (VND).',
  },
  {
    day: 27, questionId: 'hq_d27',
    question: 'Nhà thơ nào được mệnh danh là "Thần thơ Thánh chữ" của văn học Việt Nam?',
    options: [{ key: 'A', text: 'Nguyễn Du' }, { key: 'B', text: 'Hồ Xuân Hương' }, { key: 'C', text: 'Cao Bá Quát' }, { key: 'D', text: 'Nguyễn Trãi' }],
    correctKey: 'C',
    explanation: 'Cao Bá Quát nổi tiếng với câu "Văn như Siêu Quát vô tiền Hán", được mệnh danh là Thánh Quát.',
  },
  {
    day: 28, questionId: 'hq_d28',
    question: 'Trận Bạch Đằng nào dưới đây do Trần Hưng Đạo lãnh đạo?',
    options: [{ key: 'A', text: 'Năm 938' }, { key: 'B', text: 'Năm 981' }, { key: 'C', text: 'Năm 1288' }, { key: 'D', text: 'Năm 1427' }],
    correctKey: 'C',
    explanation: 'Trận Bạch Đằng năm 1288 do Trần Hưng Đạo chỉ huy, đánh tan thủy quân Nguyên – Mông.',
  },
  {
    day: 29, questionId: 'hq_d29',
    question: 'Dân số Việt Nam đạt 100 triệu người vào năm nào?',
    options: [{ key: 'A', text: '2018' }, { key: 'B', text: '2020' }, { key: 'C', text: '2023' }, { key: 'D', text: '2025' }],
    correctKey: 'C',
    explanation: 'Việt Nam đạt mốc 100 triệu dân vào ngày 15/04/2023.',
  },
  {
    day: 30, questionId: 'hq_d30',
    question: 'Di sản "Quan họ Bắc Ninh" được UNESCO công nhận là Di sản Văn hóa Phi vật thể đại diện của nhân loại vào năm nào?',
    options: [{ key: 'A', text: '2003' }, { key: 'B', text: '2009' }, { key: 'C', text: '2014' }, { key: 'D', text: '2019' }],
    correctKey: 'B',
    explanation: 'Dân ca Quan họ Bắc Ninh được UNESCO ghi danh vào năm 2009.',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spindb';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  for (const q of QUESTIONS) {
    await QuizQuestion.findOneAndUpdate(
      { day: q.day },
      q,
      { upsert: true, new: true }
    );
    console.log('Seeded day ' + q.day + ': ' + q.question.substring(0, 40) + '...');
  }
  console.log('Seed complete!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
