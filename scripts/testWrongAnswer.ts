async function runWrongAnswerTest() {
  const BASE_URL = 'http://localhost:8080/api/spin';
  const randSuffix = Math.floor(100000 + Math.random() * 900000);
  const testZaloId = 'test_wrong_' + randSuffix;
  const testPhone = '097' + randSuffix;
  const testName = 'Khách Trả Lời Sai ' + randSuffix;

  console.log('=== TEST TRƯỜNG HỢP TRẢ LỜI SAI ===');

  // Đăng ký
  await fetch(`${BASE_URL}/register-participant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-zalo-id': testZaloId },
    body: JSON.stringify({ zaloId: testZaloId, name: testName, phone: testPhone })
  });

  // Lấy câu hỏi hôm nay
  const quizRes = await (await fetch(`${BASE_URL}/get-quiz`, { headers: { 'x-zalo-id': testZaloId } })).json();
  const qId = quizRes?.data?.questionId;

  // Trả lời SAI (chọn đáp án sai: D)
  const submitRes = await (await fetch(`${BASE_URL}/submit-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-zalo-id': testZaloId },
    body: JSON.stringify({ zaloId: testZaloId, questionId: qId, answerKey: 'D' })
  })).json();
  console.log('-> Kết quả nộp câu trả lời sai:', JSON.stringify(submitRes));

  // Thử quay khi trả lời sai (phải bị chặn)
  const spinRes = await (await fetch(`${BASE_URL}/do-spin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-zalo-id': testZaloId },
    body: JSON.stringify({ zaloId: testZaloId, phone: testPhone })
  })).json();
  console.log('-> Kết quả quay khi trả lời sai (bị từ chối):', JSON.stringify(spinRes));
}

runWrongAnswerTest().catch(console.error);
