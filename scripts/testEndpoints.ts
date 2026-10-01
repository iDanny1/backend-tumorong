async function runTests() {
  const BASE_URL = 'http://localhost:8080/api/spin';
  const randSuffix = Math.floor(100000 + Math.random() * 900000);
  const testZaloId = 'test_user_' + randSuffix;
  const testPhone = '098' + randSuffix;
  const testName = 'Khách Test ' + randSuffix;

  console.log('=== BẮT ĐẦU KIỂM THỬ TOÀN BỘ ENDPOINT ===');

  // 1. GET user-info trước khi đăng ký
  console.log('\n1. Test GET /user-info (chưa đăng ký)...');
  let res = await fetch(`${BASE_URL}/user-info?phone=${testPhone}`, {
    headers: { 'x-zalo-id': testZaloId }
  });
  let data = await res.json();
  console.log('-> Kết quả:', JSON.stringify(data));

  // 2. POST register-participant
  console.log('\n2. Test POST /register-participant (Đăng ký thông tin)...');
  res = await fetch(`${BASE_URL}/register-participant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-zalo-id': testZaloId },
    body: JSON.stringify({
      zaloId: testZaloId,
      name: testName,
      phone: testPhone
    })
  });
  data = await res.json();
  console.log('-> Kết quả:', JSON.stringify(data));

  // 3. GET get-quiz (lấy câu hỏi ngày hôm nay)
  console.log('\n3. Test GET /get-quiz (Lấy câu hỏi hôm nay)...');
  res = await fetch(`${BASE_URL}/get-quiz`, {
    headers: { 'x-zalo-id': testZaloId }
  });
  data = await res.json();
  console.log('-> Kết quả:', JSON.stringify(data));
  const questionId = data?.data?.questionId;

  // 4. POST submit-quiz (trả lời câu hỏi)
  console.log('\n4. Test POST /submit-quiz (Trả lời câu hỏi)...');
  res = await fetch(`${BASE_URL}/submit-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-zalo-id': testZaloId },
    body: JSON.stringify({
      zaloId: testZaloId,
      questionId: questionId,
      answerKey: 'A'
    })
  });
  data = await res.json();
  console.log('-> Kết quả:', JSON.stringify(data));

  // 5. POST do-spin (Quay vòng may mắn)
  console.log('\n5. Test POST /do-spin (Thực hiện quay)...');
  res = await fetch(`${BASE_URL}/do-spin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-zalo-id': testZaloId },
    body: JSON.stringify({
      zaloId: testZaloId,
      phone: testPhone
    })
  });
  data = await res.json();
  console.log('-> Kết quả:', JSON.stringify(data));

  // 6. GET my-vouchers (Kiểm tra voucher nhận được)
  console.log('\n6. Test GET /my-vouchers (Danh sách voucher của tôi)...');
  res = await fetch(`${BASE_URL}/my-vouchers?phone=${testPhone}`, {
    headers: { 'x-zalo-id': testZaloId }
  });
  data = await res.json();
  console.log('-> Kết quả:', JSON.stringify(data));

  // 7. Test Admin CRUD Quiz
  console.log('\n7. Test Admin POST /admin/quiz (Tạo/Cập nhật câu hỏi ngày 31)...');
  res = await fetch(`${BASE_URL}/admin/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      day: 31,
      questionId: 'hq_test_31',
      question: 'Câu hỏi test ngày 31?',
      options: [
        { key: 'A', text: 'Đáp án A' },
        { key: 'B', text: 'Đáp án B' }
      ],
      correctKey: 'A',
      explanation: 'Giải thích đáp án A'
    })
  });
  data = await res.json();
  console.log('-> Kết quả tạo:', JSON.stringify(data));

  console.log('\n8. Test Admin DELETE /admin/quiz/31 (Xóa câu hỏi ngày 31)...');
  res = await fetch(`${BASE_URL}/admin/quiz/31`, {
    method: 'DELETE'
  });
  data = await res.json();
  console.log('-> Kết quả xóa:', JSON.stringify(data));

  console.log('\n=== HOÀN TẤT KIỂM THỬ ===');
}

runTests().catch(console.error);

