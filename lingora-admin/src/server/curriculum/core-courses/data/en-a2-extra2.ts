import type { UnitSpec } from '../types.ts';

/** English A2 — extension units (8–10): experiences and rules, technology and conditions, social life. */
export const EN_A2_EXTRA2_UNITS: UnitSpec[] = [
  {
    level: 'A2',
    names: { vi: 'Kinh nghiệm và quy tắc', en: 'Experience and Rules' },
    lessons: [
      {
        title: { vi: 'Bao lâu rồi? (for và since)', en: 'How Long? For and Since' },
        intro: 'Bạn nói mình đã sống, học hoặc làm việc ở đâu được bao lâu. Bài này dạy hiện tại hoàn thành với for / since và câu hỏi How long…?',
        vocab: [
          ['since', '/sɪns/', 'preposition', 'từ khi', 'I have lived here since 2020.', 'Tôi sống ở đây từ năm 2020.'],
          ['for', '/fɔː/', 'preposition', 'trong (khoảng thời gian)', 'She has studied English for two years.', 'Cô ấy đã học tiếng Anh được hai năm.'],
          ['already', '/ɔːlˈredi/', 'adverb', 'đã … rồi', 'I have already eaten.', 'Tôi đã ăn rồi.'],
          ['yet', '/jet/', 'adverb', 'chưa (câu phủ định/hỏi)', 'Have you finished yet?', 'Bạn xong chưa?'],
          ['recently', '/ˈriːsntli/', 'adverb', 'gần đây', 'I have recently changed my job.', 'Gần đây tôi đã đổi việc.'],
          ['member', '/ˈmembə/', 'noun', 'thành viên', 'He has been a member of the club for a year.', 'Anh ấy là thành viên câu lạc bộ được một năm.'],
          ['club', '/klʌb/', 'noun', 'câu lạc bộ', 'I joined a chess club.', 'Tôi đã tham gia một câu lạc bộ cờ vua.'],
          ['join', '/dʒɔɪn/', 'verb', 'tham gia, cùng', 'Why do not you join us?', 'Sao bạn không tham gia cùng chúng tôi?'],
          ['move', '/muːv/', 'verb', 'chuyển nhà, di chuyển', 'We moved to Hanoi last year.', 'Năm ngoái chúng tôi chuyển đến Hà Nội.'],
          ['married', '/ˈmærid/', 'adjective', 'đã kết hôn', 'They have been married for five years.', 'Họ đã kết hôn được năm năm.'],
          ['neighbourhood', '/ˈneɪbəhʊd/', 'noun', 'khu phố', 'I like this neighbourhood.', 'Tôi thích khu phố này.'],
          ['own', '/əʊn/', 'adjective', 'của riêng', 'He has his own business.', 'Anh ấy có công việc kinh doanh riêng.'],
        ],
        grammar: {
          title: 'Hiện tại hoàn thành với for và since',
          explain: 'Dùng have/has + quá khứ phân từ cho việc bắt đầu trong quá khứ và còn liên quan đến hiện tại. “For” + khoảng thời gian (for two years, for a month). “Since” + mốc thời gian (since 2020, since Monday). Hỏi: How long have you lived here? – I have lived here for three years / since 2024.',
          examples: [
            ['I have lived here for three years.', 'Tôi đã sống ở đây được ba năm.'],
            ['She has worked here since 2021.', 'Cô ấy làm việc ở đây từ năm 2021.'],
            ['How long have you studied English?', 'Bạn học tiếng Anh được bao lâu rồi?'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'How long have you lived in Hanoi, Linh?', 'Bạn sống ở Hà Nội bao lâu rồi, Linh?'],
            ['Linh', 'I have lived here since 2022. I moved here for work.', 'Mình sống ở đây từ năm 2022. Mình chuyển đến vì công việc.'],
            ['Anna', 'Do you like the neighbourhood?', 'Bạn có thích khu phố này không?'],
            ['Linh', 'Yes. I have already joined a club, and I have made many friends.', 'Có. Mình đã tham gia một câu lạc bộ và có nhiều bạn mới.'],
          ],
        },
        reorder: [
          ['I|have|lived|here|for|three|years.', 'Tôi đã sống ở đây được ba năm.'],
          ['How|long|have|you|studied|English?', 'Bạn học tiếng Anh được bao lâu rồi?'],
        ],
        grammarQ: [
          { prompt: 'Nói cô ấy làm việc ở đây từ năm 2021.', source: 'She / work here / 2021', pattern: 'has + V3 + since + mốc', answers: ['She has worked here since 2021.', 'She has worked here since 2021'] },
          { prompt: 'Nói bạn đã sống ở đây ba năm.', source: 'I / live here / three years', pattern: 'have + V3 + for + khoảng', answers: ['I have lived here for three years.', 'I have lived here for three years', 'I’ve lived here for three years.', "I've lived here for three years."] },
        ],
        tip: ['For hay since?', 'Hỏi “bao lâu” thì trả lời bằng khoảng thời gian (for three years) hoặc điểm bắt đầu (since 2022). Đừng nói “for 2022”.'],
      },
      {
        title: { vi: 'Quy tắc và điều cấm (must, mustn’t, have to)', en: 'Rules and Obligations' },
        intro: 'Bạn đọc biển báo ở công viên, thư viện hoặc sân bay và cần hiểu điều gì bắt buộc, điều gì bị cấm. Bài này dạy must, mustn’t, have to, don’t have to.',
        vocab: [
          ['rule', '/ruːl/', 'noun', 'quy tắc', 'There are many rules in the library.', 'Thư viện có nhiều quy tắc.'],
          ['allowed', '/əˈlaʊd/', 'adjective', 'được phép', 'You are not allowed to smoke here.', 'Bạn không được phép hút thuốc ở đây.'],
          ['forbidden', '/fəˈbɪdn/', 'adjective', 'bị cấm', 'Photos are forbidden in this museum.', 'Bảo tàng này cấm chụp ảnh.'],
          ['smoke', '/sməʊk/', 'verb', 'hút thuốc', 'Do not smoke in the restaurant.', 'Đừng hút thuốc trong nhà hàng.'],
          ['park', '/pɑːk/', 'verb', 'đỗ xe', 'You cannot park here.', 'Bạn không thể đỗ xe ở đây.'],
          ['wear', '/weə/', 'verb', 'mặc, đội, đeo', 'You must wear a helmet.', 'Bạn phải đội mũ bảo hiểm.'],
          ['helmet', '/ˈhelmɪt/', 'noun', 'mũ bảo hiểm', 'My helmet is in the car.', 'Mũ bảo hiểm của tôi ở trong xe.'],
          ['seat belt', '/ˈsiːt belt/', 'noun', 'dây an toàn', 'Always wear your seat belt.', 'Hãy luôn thắt dây an toàn.'],
          ['uniform', '/ˈjuːnɪfɔːm/', 'noun', 'đồng phục', 'Students must wear a uniform.', 'Học sinh phải mặc đồng phục.'],
          ['ticket', '/ˈtɪkɪt/', 'noun', 'vé', 'You must have a ticket.', 'Bạn phải có vé.'],
          ['safe', '/seɪf/', 'adjective', 'an toàn', 'It is safe to swim here.', 'Bơi ở đây là an toàn.'],
          ['dangerous', '/ˈdeɪndʒərəs/', 'adjective', 'nguy hiểm', 'It is dangerous to cross here.', 'Qua đường ở đây rất nguy hiểm.'],
        ],
        grammar: {
          title: 'must / mustn’t / have to / don’t have to',
          explain: '“Must” và “have to” diễn tả điều bắt buộc: You must wear a helmet. I have to wear a uniform. “Mustn’t” nghĩa là cấm: You mustn’t park here. “Don’t have to” nghĩa là không bắt buộc (có thể làm hoặc không): You don’t have to wear a tie. Sau các từ này động từ ở dạng nguyên mẫu.',
          examples: [
            ['You must wear a helmet.', 'Bạn phải đội mũ bảo hiểm.'],
            ['You mustn’t smoke in the restaurant.', 'Bạn không được hút thuốc trong nhà hàng.'],
            ['We don’t have to wear a uniform on Friday.', 'Thứ Sáu chúng tôi không phải mặc đồng phục.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'Can I park here?', 'Mình đỗ xe ở đây được không?'],
            ['Guard', 'No, you mustn’t park here. It is forbidden.', 'Không, bạn không được đỗ ở đây. Điều này bị cấm.'],
            ['Tom', 'And do I have to buy a ticket at the gate?', 'Còn mình có phải mua vé ở cổng không?'],
            ['Guard', 'Yes, you must have a ticket. But you don’t have to pay for children.', 'Có, bạn phải có vé. Nhưng trẻ em thì không phải trả tiền.'],
          ],
        },
        reorder: [
          ['You|must|wear|a|helmet.', 'Bạn phải đội mũ bảo hiểm.'],
          ['You|mustn’t|smoke|in|the|restaurant.', 'Bạn không được hút thuốc trong nhà hàng.'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn phải mang vé.', source: 'ticket', pattern: 'You must + động từ', answers: ['You must have a ticket.', 'You must have a ticket', 'You have to have a ticket.'] },
          { prompt: 'Nói không bắt buộc mặc đồng phục vào thứ Sáu.', source: 'we / uniform / Friday', pattern: 'don’t have to + động từ', answers: ['We don’t have to wear a uniform on Friday.', "We don't have to wear a uniform on Friday.", 'We do not have to wear a uniform on Friday.'] },
        ],
        tip: ['Mustn’t khác don’t have to', '“Mustn’t” là cấm, còn “don’t have to” là không cần. Nhầm hai cụm này có thể khiến người nghe hiểu ngược hoàn toàn.'],
      },
      {
        title: { vi: 'Xin việc và phỏng vấn đơn giản', en: 'Jobs and Simple Interviews' },
        intro: 'Bạn đi phỏng vấn xin việc part-time và cần giới thiệu kỹ năng, kinh nghiệm. Bài này dạy cách nói mình có thể làm gì, đã làm gì và tại sao muốn công việc này.',
        vocab: [
          ['interview', '/ˈɪntəvjuː/', 'noun', 'buổi phỏng vấn', 'I have an interview tomorrow.', 'Ngày mai tôi có một buổi phỏng vấn.'],
          ['apply', '/əˈplaɪ/', 'verb', 'nộp đơn', 'I want to apply for this job.', 'Tôi muốn nộp đơn cho công việc này.'],
          ['experience', '/ɪkˈspɪəriəns/', 'noun', 'trải nghiệm, kinh nghiệm', 'Do you have any experience?', 'Bạn có kinh nghiệm không?'],
          ['skill', '/skɪl/', 'noun', 'kỹ năng', 'Good English is an important skill.', 'Tiếng Anh tốt là một kỹ năng quan trọng.'],
          ['manager', '/ˈmænɪdʒə/', 'noun', 'quản lý', 'The manager is very friendly.', 'Người quản lý rất thân thiện.'],
          ['customer', '/ˈkʌstəmə/', 'noun', 'khách hàng', 'I like talking to customers.', 'Tôi thích nói chuyện với khách hàng.'],
          ['part-time', '/ˌpɑːt ˈtaɪm/', 'adjective', 'bán thời gian', 'I have a part-time job.', 'Tôi có một công việc bán thời gian.'],
          ['full-time', '/ˌfʊl ˈtaɪm/', 'adjective', 'toàn thời gian', 'She works full-time.', 'Cô ấy làm việc toàn thời gian.'],
          ['team', '/tiːm/', 'noun', 'đội nhóm', 'We work as a team.', 'Chúng tôi làm việc theo nhóm.'],
          ['strength', '/streŋθ/', 'noun', 'điểm mạnh', 'Patience is my strength.', 'Sự kiên nhẫn là điểm mạnh của tôi.'],
          ['reliable', '/rɪˈlaɪəbl/', 'adjective', 'đáng tin cậy', 'He is a reliable worker.', 'Anh ấy là một nhân viên đáng tin cậy.'],
          ['salary', '/ˈsæləri/', 'noun', 'lương', 'What is the salary?', 'Mức lương là bao nhiêu?'],
        ],
        grammar: {
          title: 'Nói về khả năng và kinh nghiệm: can, have + V3, want to',
          explain: 'Trong phỏng vấn đơn giản, dùng: I can + động từ (khả năng), I have + V3 (kinh nghiệm đã có: I have worked in a café), I want to + động từ (mong muốn), I am + tính từ (tính cách). Trả lời câu hỏi Why do you want this job? bằng: Because + mệnh đề.',
          examples: [
            ['I can speak English and a little Japanese.', 'Tôi nói được tiếng Anh và một chút tiếng Nhật.'],
            ['I have worked in a café for one year.', 'Tôi đã làm ở một quán cà phê được một năm.'],
            ['I want to work here because I like talking to customers.', 'Tôi muốn làm ở đây vì tôi thích nói chuyện với khách hàng.'],
          ],
        },
        dialogue: {
          lines: [
            ['Manager', 'Why do you want this part-time job?', 'Vì sao bạn muốn công việc bán thời gian này?'],
            ['Hoa', 'Because I like talking to customers. I have worked in a café for one year.', 'Vì tôi thích nói chuyện với khách hàng. Tôi đã làm ở một quán cà phê một năm.'],
            ['Manager', 'What is your strength?', 'Điểm mạnh của bạn là gì?'],
            ['Hoa', 'I am reliable, and I work well in a team.', 'Tôi đáng tin cậy và làm việc nhóm tốt.'],
          ],
        },
        reorder: [
          ['I|can|speak|English|and|a|little|Japanese.', 'Tôi nói được tiếng Anh và một chút tiếng Nhật.'],
          ['Why|do|you|want|this|part-time|job?', 'Vì sao bạn muốn công việc bán thời gian này?'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn đã làm ở quán cà phê một năm.', source: 'work in a café / one year', pattern: 'I have worked … for …', answers: ['I have worked in a café for one year.', 'I’ve worked in a café for one year.', "I've worked in a café for one year.", 'I have worked in a café for a year.'] },
          { prompt: 'Nói điểm mạnh của bạn là đáng tin cậy.', source: 'reliable', pattern: 'I am + tính từ', answers: ['I am reliable.', 'I’m reliable.', "I'm reliable.", 'I am reliable'] },
        ],
        tip: ['Trả lời bằng ví dụ', 'Câu trả lời phỏng vấn tốt có hai phần: nêu điểm mạnh rồi đưa ví dụ ngắn (“I am reliable. I never missed a shift.”).'],
      },
    ],
  },
  {
    level: 'A2',
    names: { vi: 'Công nghệ và giả định', en: 'Technology and Conditions' },
    lessons: [
      {
        title: { vi: 'Điện thoại, máy tính và Internet', en: 'Phones, Computers and the Internet' },
        intro: 'Bạn nhờ giúp cài ứng dụng, gửi email hoặc nói điện thoại hết pin. Bài này dạy từ vựng công nghệ thường gặp và cách mô tả sự cố đơn giản.',
        vocab: [
          ['laptop', '/ˈlæptɒp/', 'noun', 'máy tính xách tay', 'I use my laptop for homework.', 'Tôi dùng máy tính xách tay để làm bài tập.'],
          ['screen', '/skriːn/', 'noun', 'màn hình', 'The screen is broken.', 'Màn hình bị vỡ.'],
          ['battery', '/ˈbætri/', 'noun', 'pin', 'My battery is low.', 'Pin của tôi sắp hết.'],
          ['charger', '/ˈtʃɑːdʒə/', 'noun', 'cục sạc', 'Can I borrow your charger?', 'Tôi mượn cục sạc của bạn được không?'],
          ['download', '/ˌdaʊnˈləʊd/', 'verb', 'tải xuống', 'I downloaded a new app.', 'Tôi đã tải một ứng dụng mới.'],
          ['app', '/æp/', 'noun', 'ứng dụng', 'This app is very useful.', 'Ứng dụng này rất hữu ích.'],
          ['website', '/ˈwebsaɪt/', 'noun', 'trang web', 'Visit our website for more information.', 'Hãy truy cập trang web của chúng tôi để biết thêm.'],
          ['password', '/ˈpɑːswɜːd/', 'noun', 'mật khẩu', 'I forgot my password.', 'Tôi đã quên mật khẩu.'],
          ['email', '/ˈiːmeɪl/', 'noun', 'thư điện tử', 'I send an email every day.', 'Mỗi ngày tôi gửi một email.'],
          ['online', '/ˌɒnˈlaɪn/', 'adverb', 'trực tuyến', 'She studies English online.', 'Cô ấy học tiếng Anh trực tuyến.'],
          ['connect', '/kəˈnekt/', 'verb', 'kết nối', 'I cannot connect to the internet.', 'Tôi không kết nối được Internet.'],
          ['broken', '/ˈbrəʊkən/', 'adjective', 'hỏng, bị vỡ', 'My phone is broken.', 'Điện thoại của tôi bị hỏng.'],
        ],
        grammar: {
          title: 'Mô tả sự cố: can’t, doesn’t work, be + tính từ',
          explain: 'Để mô tả sự cố công nghệ, dùng: My phone is broken. The wifi doesn’t work. I can’t connect to the internet. Nhờ giúp lịch sự: Could you help me with + danh từ? Hỏi nguyên nhân: What is the problem? Dùng because/so để nối nguyên nhân – kết quả: My battery is low, so I need a charger.',
          examples: [
            ['The wifi doesn’t work in my room.', 'Wifi không hoạt động trong phòng tôi.'],
            ['I can’t connect to the internet.', 'Tôi không kết nối được Internet.'],
            ['My battery is low, so I need a charger.', 'Pin tôi sắp hết nên tôi cần cục sạc.'],
          ],
        },
        dialogue: {
          lines: [
            ['Nam', 'Excuse me, I have a problem with my laptop.', 'Xin lỗi, máy tính của tôi gặp sự cố.'],
            ['Staff', 'What is the problem?', 'Vấn đề là gì vậy?'],
            ['Nam', 'I can’t connect to the internet, and I forgot my password.', 'Tôi không kết nối được Internet và tôi quên mật khẩu.'],
            ['Staff', 'No problem. Let me help you. First, download the new app.', 'Không sao. Để tôi giúp. Đầu tiên hãy tải ứng dụng mới.'],
          ],
        },
        reorder: [
          ['I|can’t|connect|to|the|internet.', 'Tôi không kết nối được Internet.'],
          ['My|battery|is|low,|so|I|need|a|charger.', 'Pin tôi sắp hết nên tôi cần cục sạc.'],
        ],
        grammarQ: [
          { prompt: 'Nói wifi trong phòng không hoạt động.', source: 'wifi / room', pattern: 'The wifi doesn’t work …', answers: ['The wifi doesn’t work in my room.', "The wifi doesn't work in my room.", 'The wifi does not work in my room.'] },
          { prompt: 'Nói pin sắp hết nên bạn cần cục sạc.', source: 'battery low / charger', pattern: '…, so I need …', answers: ['My battery is low, so I need a charger.', 'My battery is low so I need a charger.'] },
        ],
        tip: ['Low battery', 'Người bản xứ nói “My battery is low” hoặc “My phone is dead” (hết pin hoàn toàn). Đừng nói “My battery is little”.'],
      },
      {
        title: { vi: 'Nếu… thì… (câu điều kiện loại 1)', en: 'If… Then: The First Conditional' },
        intro: 'Bạn nói chuyện về điều có thể xảy ra trong tương lai: “Nếu ngày mai trời mưa, mình sẽ ở nhà”. Bài này dạy câu điều kiện loại 1 với if + hiện tại đơn, will + động từ.',
        vocab: [
          ['if', '/ɪf/', 'conjunction', 'nếu', 'If it rains, we will stay at home.', 'Nếu trời mưa, chúng tôi sẽ ở nhà.'],
          ['unless', '/ənˈles/', 'conjunction', 'trừ khi', 'I will not go unless you come.', 'Tôi sẽ không đi trừ khi bạn đến.'],
          ['maybe', '/ˈmeɪbi/', 'adverb', 'có thể, biết đâu', 'Maybe I will call you tonight.', 'Có lẽ tối nay tôi sẽ gọi cho bạn.'],
          ['probably', '/ˈprɒbəbli/', 'adverb', 'có lẽ, nhiều khả năng', 'It will probably be hot tomorrow.', 'Ngày mai có khả năng trời sẽ nóng.'],
          ['pass', '/pɑːs/', 'verb', 'đỗ, vượt qua', 'If you study hard, you will pass the exam.', 'Nếu học chăm chỉ, bạn sẽ đỗ kỳ thi.'],
          ['miss', '/mɪs/', 'verb', 'lỡ, nhớ', 'You will miss the train if you do not hurry.', 'Bạn sẽ lỡ chuyến tàu nếu không nhanh lên.'],
          ['hurry', '/ˈhʌri/', 'verb', 'vội, nhanh lên', 'Hurry up, we are late!', 'Nhanh lên, chúng ta muộn rồi!'],
          ['ready', '/ˈredi/', 'adjective', 'sẵn sàng', 'Are you ready to go?', 'Bạn sẵn sàng đi chưa?'],
          ['lose', '/luːz/', 'verb', 'làm mất, thua', 'Do not lose your key.', 'Đừng làm mất chìa khóa.'],
          ['win', '/wɪn/', 'verb', 'thắng', 'I think our team will win.', 'Tôi nghĩ đội chúng ta sẽ thắng.'],
          ['cancel', '/ˈkænsl/', 'verb', 'huỷ', 'They will cancel the match if it rains.', 'Họ sẽ hủy trận đấu nếu trời mưa.'],
          ['join', '/dʒɔɪn/', 'verb', 'tham gia, cùng', 'If you join the club, you will make friends.', 'Nếu tham gia câu lạc bộ, bạn sẽ có bạn mới.'],
        ],
        grammar: {
          title: 'Câu điều kiện loại 1: If + hiện tại đơn, will + động từ',
          explain: 'Dùng để nói điều có thể xảy ra trong tương lai: If + hiện tại đơn, S + will + động từ nguyên mẫu. Không dùng “will” sau if: If it rains, we will stay (không nói If it will rain). Đổi vị trí hai mệnh đề cũng được và bỏ dấu phẩy: We will stay if it rains. Phủ định: won’t hoặc unless.',
          examples: [
            ['If it rains, we will stay at home.', 'Nếu trời mưa, chúng tôi sẽ ở nhà.'],
            ['You will miss the train if you do not hurry.', 'Bạn sẽ lỡ tàu nếu không nhanh lên.'],
            ['If you study hard, you will pass the exam.', 'Nếu học chăm chỉ, bạn sẽ đỗ kỳ thi.'],
          ],
        },
        dialogue: {
          lines: [
            ['Mai', 'Are you ready? If we do not hurry, we will miss the train.', 'Bạn sẵn sàng chưa? Nếu không nhanh lên, chúng ta sẽ lỡ tàu.'],
            ['Sam', 'Wait. I cannot find my key.', 'Đợi chút. Mình không tìm thấy chìa khóa.'],
            ['Mai', 'If you lose it again, you will not get in.', 'Nếu bạn lại làm mất, bạn sẽ không vào nhà được.'],
            ['Sam', 'I know. Maybe I will buy a new one tomorrow.', 'Mình biết. Có lẽ mai mình sẽ mua cái mới.'],
          ],
        },
        reorder: [
          ['If|it|rains,|we|will|stay|at|home.', 'Nếu trời mưa, chúng tôi sẽ ở nhà.'],
          ['You|will|miss|the|train|if|you|do|not|hurry.', 'Bạn sẽ lỡ tàu nếu không nhanh lên.'],
        ],
        grammarQ: [
          { prompt: 'Nói nếu học chăm bạn sẽ đỗ kỳ thi.', source: 'study hard / pass / exam', pattern: 'If + hiện tại đơn, will + V', answers: ['If you study hard, you will pass the exam.', 'If you study hard you will pass the exam.'] },
          { prompt: 'Nói bạn sẽ lỡ tàu nếu không nhanh lên.', source: 'miss the train / hurry', pattern: 'S + will + V + if + hiện tại đơn', answers: ['You will miss the train if you do not hurry.', 'You will miss the train if you don’t hurry.', "You will miss the train if you don't hurry."] },
        ],
        tip: ['Không dùng will sau if', 'Sau “if”, tiếng Anh dùng hiện tại đơn dù nói về tương lai. Đây là lỗi phổ biến của người học: nói “If it rains”, đừng nói “If it will rain”.'],
      },
      {
        title: { vi: 'Ý kiến, đồng ý và phản đối lịch sự', en: 'Opinions, Agreeing and Disagreeing' },
        intro: 'Bạn thảo luận với bạn bè về phim, trường học hay du lịch và muốn nêu ý kiến một cách lịch sự. Bài này dạy I think, I agree, I disagree và cách nêu lý do.',
        vocab: [
          ['opinion', '/əˈpɪnjən/', 'noun', 'ý kiến, quan điểm', 'In my opinion, this film is great.', 'Theo ý kiến của tôi, bộ phim này rất hay.'],
          ['agree', '/əˈɡriː/', 'verb', 'đồng ý', 'I agree with you.', 'Tôi đồng ý với bạn.'],
          ['disagree', '/ˌdɪsəˈɡriː/', 'verb', 'không đồng ý', 'I disagree. I think it is boring.', 'Tôi không đồng ý. Tôi nghĩ nó chán.'],
          ['think', '/θɪŋk/', 'verb', 'nghĩ', 'I think it is a good idea.', 'Tôi nghĩ đó là ý hay.'],
          ['idea', '/aɪˈdɪə/', 'noun', 'ý tưởng', 'That is a great idea!', 'Đó là một ý tưởng tuyệt vời!'],
          ['reason', '/ˈriːzn/', 'noun', 'lý do', 'What is the reason?', 'Lý do là gì?'],
          ['important', '/ɪmˈpɔːtnt/', 'adjective', 'quan trọng', 'Health is more important than money.', 'Sức khỏe quan trọng hơn tiền.'],
          ['true', '/truː/', 'adjective', 'đúng, thật', 'That is true.', 'Điều đó đúng.'],
          ['wrong', '/rɒŋ/', 'adjective', 'sai', 'I think you are wrong.', 'Tôi nghĩ bạn sai rồi.'],
          ['maybe', '/ˈmeɪbi/', 'adverb', 'có thể, biết đâu', 'Maybe you are right.', 'Có lẽ bạn nói đúng.'],
          ['perhaps', '/pəˈhæps/', 'adverb', 'có thể là', 'Perhaps we should ask the teacher.', 'Có thể chúng ta nên hỏi cô giáo.'],
          ['sure', '/ʃɔː/', 'adjective', 'chắc chắn', 'I am not sure about that.', 'Tôi không chắc về điều đó.'],
        ],
        grammar: {
          title: 'I think / I agree / I disagree + because',
          explain: 'Nêu ý kiến: I think (that) + mệnh đề; In my opinion, + mệnh đề. Đồng ý: I agree. / That’s true. Không đồng ý lịch sự: I’m not sure about that. / I see, but I think… Luôn nên nêu lý do bằng because: I think it is a good idea because it is cheap.',
          examples: [
            ['I think it is a good idea because it is cheap.', 'Tôi nghĩ đó là ý hay vì nó rẻ.'],
            ['I agree with you. That is true.', 'Tôi đồng ý với bạn. Điều đó đúng.'],
            ['I’m not sure about that, but maybe you are right.', 'Tôi không chắc về điều đó, nhưng có lẽ bạn đúng.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'I think we should study English every day.', 'Mình nghĩ chúng ta nên học tiếng Anh mỗi ngày.'],
            ['Lan', 'I agree. It is important for our jobs.', 'Mình đồng ý. Nó quan trọng cho công việc của chúng ta.'],
            ['Tom', 'Maybe we can join an online class.', 'Có lẽ chúng ta có thể tham gia một lớp trực tuyến.'],
            ['Lan', 'I am not sure about that. Perhaps a club is better, because we can speak more.', 'Mình không chắc. Có thể câu lạc bộ tốt hơn vì mình nói được nhiều hơn.'],
          ],
        },
        reorder: [
          ['I|think|it|is|a|good|idea|because|it|is|cheap.', 'Tôi nghĩ đó là ý hay vì nó rẻ.'],
          ['I|agree|with|you.', 'Tôi đồng ý với bạn.'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn đồng ý với người đối diện.', source: 'agree / you', pattern: 'I agree with + người', answers: ['I agree with you.', 'I agree with you'] },
          { prompt: 'Nêu ý kiến: đó là ý hay vì nó rẻ.', source: 'good idea / cheap', pattern: 'I think … because …', answers: ['I think it is a good idea because it is cheap.', 'I think it’s a good idea because it’s cheap.', "I think it's a good idea because it's cheap."] },
        ],
        tip: ['Phản đối bằng giọng mềm', 'Tiếng Anh thường mềm hóa bất đồng: “I see your point, but…”. Nói thẳng “You are wrong” có thể nghe thô.'],
      },
    ],
  },
  {
    level: 'A2',
    names: { vi: 'Đời sống xã hội', en: 'Social Life' },
    lessons: [
      {
        title: { vi: 'Tính cách và mô tả con người', en: 'Personality and Describing People' },
        intro: 'Bạn kể cho bạn bè nghe về đồng nghiệp, người thân hay bạn cùng lớp của mình. Bài này dạy các tính từ tính cách và cách nêu ví dụ minh họa.',
        vocab: [
          ['friendly', '/ˈfrendli/', 'adjective', 'thân thiện', 'My neighbour is very friendly.', 'Hàng xóm của tôi rất thân thiện.'],
          ['shy', '/ʃaɪ/', 'adjective', 'nhút nhát', 'My little brother is shy.', 'Em trai tôi nhút nhát.'],
          ['kind', '/kaɪnd/', 'adjective', 'tốt bụng', 'She is kind to everyone.', 'Cô ấy tốt với mọi người.'],
          ['funny', '/ˈfʌni/', 'adjective', 'hài hước', 'He tells funny stories.', 'Anh ấy kể những câu chuyện hài hước.'],
          ['clever', '/ˈklevə/', 'adjective', 'thông minh', 'She is clever and works hard.', 'Cô ấy thông minh và làm việc chăm chỉ.'],
          ['lazy', '/ˈleɪzi/', 'adjective', 'lười biếng', 'I am lazy on Sunday.', 'Chủ nhật tôi lười biếng.'],
          ['hard-working', '/ˌhɑːd ˈwɜːkɪŋ/', 'adjective', 'chăm chỉ', 'He is a hard-working student.', 'Cậu ấy là một học sinh chăm chỉ.'],
          ['polite', '/pəˈlaɪt/', 'adjective', 'lịch sự', 'Children should be polite.', 'Trẻ em nên lịch sự.'],
          ['patient', '/ˈpeɪʃnt/', 'adjective', 'kiên nhẫn', 'A good teacher is patient.', 'Một giáo viên giỏi thì kiên nhẫn.'],
          ['honest', '/ˈɒnɪst/', 'adjective', 'trung thực', 'She is always honest.', 'Cô ấy luôn trung thực.'],
          ['generous', '/ˈdʒenərəs/', 'adjective', 'rộng rãi, hào phóng', 'He is generous with his time.', 'Anh ấy hào phóng với thời gian của mình.'],
          ['personality', '/ˌpɜːsəˈnæləti/', 'noun', 'tính cách', 'She has a strong personality.', 'Cô ấy có tính cách mạnh mẽ.'],
        ],
        grammar: {
          title: 'Tả tính cách: be + tính từ, và kể ví dụ',
          explain: 'Dùng to be + tính từ để mô tả tính cách: She is kind. Dùng “She always…, she often…” để đưa ví dụ minh họa: She is kind. She always helps her neighbours. Hỏi: What is he like? – He is friendly and funny. Đừng nhầm “What is he like?” (tả tính cách) với “What does he like?” (anh ấy thích gì).',
          examples: [
            ['What is your teacher like? – She is patient and kind.', 'Cô giáo bạn như thế nào? – Cô ấy kiên nhẫn và tốt bụng.'],
            ['He is hard-working. He always finishes his homework.', 'Cậu ấy chăm chỉ. Cậu ấy luôn làm xong bài tập.'],
            ['My sister is shy, but she is very clever.', 'Chị tôi nhút nhát nhưng rất thông minh.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'What is your new manager like?', 'Quản lý mới của bạn là người thế nào?'],
            ['Hoa', 'She is friendly and very patient.', 'Cô ấy thân thiện và rất kiên nhẫn.'],
            ['Anna', 'Is she funny?', 'Cô ấy có hài hước không?'],
            ['Hoa', 'Sometimes. She is also honest and always polite.', 'Thỉnh thoảng. Cô ấy cũng trung thực và luôn lịch sự.'],
          ],
        },
        reorder: [
          ['What|is|your|teacher|like?', 'Cô giáo bạn như thế nào?'],
          ['She|is|kind|to|everyone.', 'Cô ấy tốt với mọi người.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi quản lý mới là người thế nào.', source: 'new manager', pattern: 'What is … like?', answers: ['What is your new manager like?', 'What is the new manager like?', 'What is your manager like?'] },
          { prompt: 'Nói cô ấy tốt với mọi người.', source: 'She / kind / everyone', pattern: 'She is + tính từ + to …', answers: ['She is kind to everyone.', 'She is kind to everyone'] },
        ],
        tip: ['What is he like?', '“What is he like?” hỏi về tính cách, còn “What does he look like?” hỏi về ngoại hình. Hai câu hỏi khác hẳn nhau.'],
      },
      {
        title: { vi: 'Đề nghị và gợi ý (Let’s, Why don’t we, How about)', en: 'Making Suggestions' },
        intro: 'Bạn muốn rủ bạn bè đi chơi hoặc đề xuất việc cả nhóm có thể làm. Bài này dạy các cách gợi ý tự nhiên và cách nhận lời hoặc từ chối nhẹ nhàng.',
        vocab: [
          ['suggest', '/səˈdʒest/', 'verb', 'đề nghị, gợi ý', 'I suggest we go by bus.', 'Tôi đề nghị chúng ta đi bằng xe buýt.'],
          ['suggestion', '/səˈdʒestʃən/', 'noun', 'lời gợi ý', 'That is a good suggestion.', 'Đó là một gợi ý hay.'],
          ['let’s', '/lets/', 'verb', 'chúng ta hãy', 'Let’s go to the cinema.', 'Chúng ta hãy đi xem phim.'],
          ['cinema', '/ˈsɪnəmə/', 'noun', 'rạp chiếu phim', 'The cinema is near the park.', 'Rạp chiếu phim ở gần công viên.'],
          ['picnic', '/ˈpɪknɪk/', 'noun', 'buổi dã ngoại', 'We had a picnic by the lake.', 'Chúng tôi đã đi dã ngoại bên hồ.'],
          ['join', '/dʒɔɪn/', 'verb', 'tham gia, cùng', 'Please join us for dinner.', 'Hãy cùng ăn tối với chúng tôi.'],
          ['good idea', '/ɡʊd aɪˈdɪə/', 'phrase', 'ý hay', 'Good idea, let us do it.', 'Ý hay, ta làm đi.'],
          ['sounds good', '/saʊndz ɡʊd/', 'phrase', 'nghe hay đấy', 'Sounds good, I will come.', 'Nghe hay đấy, mình sẽ đến.'],
          ['busy', '/ˈbɪzi/', 'adjective', 'bận', 'I am busy this evening.', 'Tối nay tôi bận.'],
          ['another time', '/əˈnʌðə taɪm/', 'phrase', 'dịp khác', 'Maybe another time.', 'Có lẽ để dịp khác.'],
          ['plan', '/plæn/', 'noun', 'kế hoạch, dự định', 'Do you have any plans for Saturday?', 'Thứ Bảy bạn có kế hoạch gì không?'],
          ['organise', '/ˈɔːɡənaɪz/', 'verb', 'tổ chức', 'Let us organise a party.', 'Hãy cùng tổ chức một bữa tiệc.'],
        ],
        grammar: {
          title: 'Let’s / Why don’t we / How about / Shall we',
          explain: 'Gợi ý: Let’s + động từ (Let’s go); Why don’t we + động từ? (Why don’t we have a picnic?); How about + danh từ / V-ing? (How about a film? How about going to the cinema?); Shall we + động từ? Nhận lời: Good idea! / Sounds good. Từ chối lịch sự: Sorry, I’m busy. Maybe another time.',
          examples: [
            ['Let’s go to the cinema.', 'Chúng ta hãy đi xem phim.'],
            ['Why don’t we have a picnic on Sunday?', 'Sao chúng ta không đi dã ngoại vào chủ nhật nhỉ?'],
            ['How about going to the beach? – Sounds good.', 'Đi biển thì sao? – Nghe hay đấy.'],
          ],
        },
        dialogue: {
          lines: [
            ['Mai', 'Do you have any plans for Saturday?', 'Thứ Bảy bạn có kế hoạch gì không?'],
            ['Nam', 'Not yet. Why don’t we have a picnic?', 'Chưa. Sao chúng ta không đi dã ngoại nhỉ?'],
            ['Mai', 'Sounds good. How about going to the lake?', 'Nghe hay đấy. Đi hồ thì sao?'],
            ['Nam', 'Good idea. Let’s organise it with our friends.', 'Ý hay. Hãy cùng rủ bạn bè tổ chức nhé.'],
          ],
        },
        reorder: [
          ['Why|don’t|we|have|a|picnic|on|Sunday?', 'Sao chúng ta không đi dã ngoại vào chủ nhật nhỉ?'],
          ['Let’s|go|to|the|cinema.', 'Chúng ta hãy đi xem phim.'],
        ],
        grammarQ: [
          { prompt: 'Rủ bạn đi xem phim bằng “Let’s”.', source: 'go / cinema', pattern: 'Let’s + động từ', answers: ['Let’s go to the cinema.', "Let's go to the cinema.", 'Let us go to the cinema.'] },
          { prompt: 'Gợi ý đi biển bằng “How about”.', source: 'go / beach', pattern: 'How about + V-ing?', answers: ['How about going to the beach?', 'How about going to the beach', 'How about the beach?'] },
        ],
        tip: ['Từ chối vẫn lịch sự', 'Khi từ chối, hãy kèm lý do ngắn và đề nghị dịp khác: “Sorry, I’m busy. Maybe another time.” Đừng chỉ nói “No”.'],
      },
      {
        title: { vi: 'Viết email và tin nhắn mời', en: 'Writing Emails and Invitations' },
        intro: 'Bạn viết email mời bạn đến sinh nhật hoặc trả lời một lời mời. Bài này dạy cấu trúc email ngắn: lời chào, nội dung, lời kết và các cụm trang trọng cơ bản.',
        vocab: [
          ['dear', '/dɪə/', 'adjective', 'thân mến (đầu thư)', 'Dear Anna, how are you?', 'Anna thân mến, bạn khỏe không?'],
          ['invite', '/ɪnˈvaɪt/', 'verb', 'mời', 'I would like to invite you to my party.', 'Tôi muốn mời bạn đến bữa tiệc của tôi.'],
          ['invitation', '/ˌɪnvɪˈteɪʃn/', 'noun', 'lời mời, thiệp mời', 'Thank you for the invitation.', 'Cảm ơn bạn vì lời mời.'],
          ['reply', '/rɪˈplaɪ/', 'verb', 'trả lời, hồi âm', 'Please reply by Friday.', 'Vui lòng trả lời trước thứ Sáu.'],
          ['attach', '/əˈtætʃ/', 'verb', 'đính kèm', 'I attached the photos to this email.', 'Tôi đã đính kèm các bức ảnh vào email này.'],
          ['subject line', '/ˈsʌbdʒɪkt laɪn/', 'noun', 'dòng tiêu đề', 'Write a short subject line.', 'Hãy viết một dòng tiêu đề ngắn.'],
          ['regards', '/rɪˈɡɑːdz/', 'noun', 'lời chúc, lời chào', 'Best regards, Linh.', 'Trân trọng, Linh.'],
          ['look forward to', '/lʊk ˈfɔːwəd tuː/', 'phrasal verb', 'mong đợi', 'I look forward to seeing you.', 'Tôi mong được gặp bạn.'],
          ['write back', '/raɪt bæk/', 'phrasal verb', 'viết thư trả lời', 'Please write back soon.', 'Hãy sớm viết thư trả lời nhé.'],
          ['address', '/əˈdres/', 'noun', 'địa chỉ', 'Send it to my email address.', 'Hãy gửi đến địa chỉ email của tôi.'],
          ['welcome', '/ˈwelkəm/', 'adjective', 'được chào đón', 'You are always welcome here.', 'Bạn luôn được chào đón ở đây.'],
          ['attend', '/əˈtend/', 'verb', 'tham dự', 'I cannot attend the meeting.', 'Tôi không thể tham dự cuộc họp.'],
        ],
        grammar: {
          title: 'Cấu trúc email ngắn và lời mời',
          explain: 'Email ngắn gồm: lời chào (Dear + tên,), nội dung (I would like to invite you to…), yêu cầu (Please reply by…), lời kết (I look forward to seeing you. / Best regards,). Trả lời lời mời: Thank you for the invitation. I would love to come. / I’m sorry, but I can’t attend because… Dùng I would like to… và I look forward to + V-ing để nghe lịch sự.',
          examples: [
            ['Dear Anna, I would like to invite you to my party.', 'Anna thân mến, mình muốn mời bạn đến bữa tiệc của mình.'],
            ['Please reply by Friday.', 'Vui lòng trả lời trước thứ Sáu.'],
            ['I look forward to seeing you. Best regards, Linh.', 'Mình mong được gặp bạn. Trân trọng, Linh.'],
          ],
        },
        dialogue: {
          lines: [
            ['Linh', 'I am writing an email to invite Anna to my birthday party.', 'Mình đang viết email mời Anna đến tiệc sinh nhật.'],
            ['Tom', 'What is the subject?', 'Tiêu đề là gì?'],
            ['Linh', 'Birthday invitation. I wrote: Dear Anna, I would like to invite you to my party.', 'Thiệp mời sinh nhật. Mình viết: Anna thân mến, mình muốn mời bạn đến bữa tiệc.'],
            ['Tom', 'Nice. Add: Please reply by Friday. And finish with Best regards.', 'Hay đấy. Thêm: Vui lòng trả lời trước thứ Sáu. Rồi kết bằng Trân trọng.'],
          ],
        },
        reorder: [
          ['Please|reply|by|Friday.', 'Vui lòng trả lời trước thứ Sáu.'],
          ['I|look|forward|to|seeing|you.', 'Mình mong được gặp bạn.'],
        ],
        grammarQ: [
          { prompt: 'Viết lời mời lịch sự đến bữa tiệc.', source: 'invite / party', pattern: 'I would like to invite you to …', answers: ['I would like to invite you to my party.', 'I would like to invite you to the party.', 'I’d like to invite you to my party.', "I'd like to invite you to my party."] },
          { prompt: 'Kết email: mong được gặp bạn.', source: 'look forward / see', pattern: 'I look forward to + V-ing', answers: ['I look forward to seeing you.', 'I look forward to seeing you'] },
        ],
        tip: ['Look forward to + V-ing', 'Trong “look forward to”, “to” là giới từ nên theo sau là danh từ hoặc V-ing: I look forward to seeing you, không phải “to see you”.'],
      },
    ],
  },
];
