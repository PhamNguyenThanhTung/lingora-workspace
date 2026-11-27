import type { UnitSpec } from '../types.ts';

/** English A2 — Elementary. Can-do: describe past events, make plans, compare, talk about health and handle everyday services. */
export const EN_A2_UNITS: UnitSpec[] = [
  {
    level: 'A2',
    names: { vi: 'Chuyện đã xảy ra', en: 'Things That Happened' },
    lessons: [
      {
        title: { vi: 'Cuối tuần vừa rồi (quá khứ đơn có quy tắc)', en: 'Last Weekend: Regular Past Simple' },
        intro: 'Đồng nghiệp hỏi bạn đã làm gì cuối tuần. Bài này giúp bạn kể lại những việc đã xảy ra bằng thì quá khứ đơn với động từ có quy tắc, kèm các mốc thời gian như yesterday và last night.',
        vocab: [
          ['visit', '/ˈvɪzɪt/', 'verb', 'thăm, đến thăm', 'We visited my grandmother on Sunday.', 'Chúng tôi đã thăm bà vào Chủ nhật.'],
          ['watch', '/wɒtʃ/', 'verb', 'xem', 'I watched a film last night.', 'Tối qua tôi đã xem một bộ phim.'],
          ['stay', '/steɪ/', 'verb', 'ở lại', 'He stayed at home yesterday.', 'Hôm qua anh ấy ở nhà.'],
          ['walk', '/wɔːk/', 'verb', 'đi bộ', 'We walked in the park.', 'Chúng tôi đã đi dạo trong công viên.'],
          ['clean', '/kliːn/', 'verb', 'dọn dẹp, lau chùi', 'She cleaned the kitchen.', 'Cô ấy đã dọn dẹp nhà bếp.'],
          ['yesterday', '/ˈjestədeɪ/', 'adverb', 'hôm qua', 'It rained yesterday.', 'Hôm qua trời mưa.'],
          ['last night', '/lɑːst naɪt/', 'phrase', 'tối qua', 'I called her last night.', 'Tối qua tôi đã gọi cho cô ấy.'],
          ['ago', '/əˈɡəʊ/', 'adverb', 'cách đây', 'I started this job two years ago.', 'Tôi bắt đầu công việc này cách đây hai năm.'],
          ['relax', '/rɪˈlæks/', 'verb', 'thư giãn', 'On Saturday I relaxed at home.', 'Hôm thứ Bảy tôi thư giãn ở nhà.'],
          ['enjoy', '/ɪnˈdʒɔɪ/', 'verb', 'thích thú, tận hưởng', 'They enjoyed the party.', 'Họ đã rất vui ở buổi tiệc.'],
        ],
        grammar: {
          title: 'Quá khứ đơn: động từ có quy tắc',
          explain: 'Quá khứ đơn kể việc đã kết thúc ở một thời điểm trong quá khứ. Động từ có quy tắc thêm -ed (watch → watched); động từ tận cùng -e chỉ thêm -d (live → lived); động từ tận cùng phụ âm + y đổi y thành -ied (study → studied). Phủ định và nghi vấn dùng did / didn’t + động từ nguyên mẫu: “Did you watch the film?” – “No, I didn’t.” Dấu hiệu: yesterday, last night, two days ago.',
          examples: [
            ['I watched a film and cleaned the kitchen.', 'Tôi đã xem phim và dọn dẹp nhà bếp.'],
            ['We didn’t stay at home.', 'Chúng tôi đã không ở nhà.'],
            ['Did you visit your grandmother? – Yes, I did.', 'Bạn có thăm bà không? – Có.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'What did you do last weekend, Nam?', 'Cuối tuần trước bạn đã làm gì, Nam?'],
            ['Nam', 'I visited my grandmother on Saturday and I cleaned the house on Sunday.', 'Thứ Bảy tôi đã thăm bà và Chủ nhật tôi đã dọn nhà.'],
            ['Anna', 'Did you relax at all?', 'Bạn có thư giãn chút nào không?'],
            ['Nam', 'Yes, I watched a film last night. I enjoyed it.', 'Có chứ, tối qua tôi đã xem một bộ phim. Tôi rất thích.'],
          ],
        },
        reorder: [
          ['I|watched|a|film|last|night.', 'Tối qua tôi đã xem một bộ phim.'],
          ['Did|you|relax|at|all?', 'Bạn có thư giãn chút nào không?'],
        ],
        grammarQ: [
          { prompt: 'Chuyển sang quá khứ: I watch TV every evening → (yesterday evening).', source: 'I watch TV.', pattern: 'S + V-ed + …', answers: ['I watched TV yesterday evening.', 'I watched TV yesterday evening', 'Yesterday evening I watched TV.', 'Yesterday evening, I watched TV.'] },
          { prompt: 'Viết câu phủ định quá khứ: She cleaned the kitchen.', source: 'She cleaned the kitchen.', pattern: 'S + didn’t + V nguyên mẫu', answers: ['She didn’t clean the kitchen.', "She didn't clean the kitchen.", 'She did not clean the kitchen.'] },
        ],
        tip: ['Sau did là động từ nguyên mẫu', 'Khi đã có did/didn’t, động từ chính KHÔNG thêm -ed: “Did you watch…?”, không phải “Did you watched…?”. Đây là lỗi phổ biến nhất ở trình độ A2.'],
      },
      {
        title: { vi: 'Động từ bất quy tắc thông dụng', en: 'Common Irregular Verbs' },
        intro: 'Nhiều động từ quen thuộc nhất không thêm -ed mà đổi hình thức. Bài này dạy 10 động từ bất quy tắc quan trọng để bạn kể chuyện trôi chảy hơn.',
        vocab: [
          ['went', '/went/', 'verb (past of go)', 'đã đi', 'We went to the beach last summer.', 'Mùa hè trước chúng tôi đã đi biển.'],
          ['saw', '/sɔː/', 'verb (past of see)', 'đã thấy', 'I saw a big dog in the street.', 'Tôi đã thấy một con chó lớn trên phố.'],
          ['ate', '/et/', 'verb (past of eat)', 'đã ăn', 'They ate fish for dinner.', 'Họ đã ăn cá vào bữa tối.'],
          ['had', '/hæd/', 'verb (past of have)', 'đã có; đã ăn/uống', 'We had a great time.', 'Chúng tôi đã có một khoảng thời gian tuyệt vời.'],
          ['bought', '/bɔːt/', 'verb (past of buy)', 'đã mua', 'She bought a new coat.', 'Cô ấy đã mua một chiếc áo khoác mới.'],
          ['met', '/met/', 'verb (past of meet)', 'đã gặp', 'I met my teacher at the station.', 'Tôi đã gặp thầy giáo ở nhà ga.'],
          ['took', '/tʊk/', 'verb (past of take)', 'đã lấy, đã đi (xe)', 'He took the bus to work.', 'Anh ấy đã đi xe buýt đến chỗ làm.'],
          ['came', '/keɪm/', 'verb (past of come)', 'đã đến', 'My friends came at seven.', 'Bạn tôi đã đến lúc bảy giờ.'],
          ['wrote', '/rəʊt/', 'verb (past of write)', 'đã viết', 'She wrote a long email.', 'Cô ấy đã viết một email dài.'],
          ['last week', '/lɑːst wiːk/', 'phrase', 'tuần trước', 'I saw him last week.', 'Tuần trước tôi đã gặp anh ấy.'],
        ],
        grammar: {
          title: 'Quá khứ đơn: động từ bất quy tắc',
          explain: 'Động từ bất quy tắc có dạng quá khứ riêng cần học thuộc: go → went, see → saw, eat → ate, have → had, buy → bought, meet → met, take → took, come → came, write → wrote. Câu phủ định và nghi vấn vẫn dùng did/didn’t + động từ NGUYÊN MẪU: “Did you go?”, “I didn’t see him.”',
          examples: [
            ['We went to the beach and ate fresh fish.', 'Chúng tôi đã đi biển và ăn cá tươi.'],
            ['I didn’t buy anything last week.', 'Tuần trước tôi đã không mua gì cả.'],
            ['Did she come by bus? – No, she took a taxi.', 'Cô ấy đến bằng xe buýt à? – Không, cô ấy đi taxi.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'Where did you go last week?', 'Tuần trước bạn đã đi đâu?'],
            ['Linh', 'I went to Da Lat with my family. We took the bus.', 'Tôi đã đi Đà Lạt cùng gia đình. Chúng tôi đi xe buýt.'],
            ['Tom', 'What did you buy there?', 'Bạn đã mua gì ở đó?'],
            ['Linh', 'I bought some coffee and a warm coat. We had a great time.', 'Tôi đã mua ít cà phê và một chiếc áo khoác ấm. Chúng tôi đã có khoảng thời gian tuyệt vời.'],
          ],
        },
        reorder: [
          ['Where|did|you|go|last|week?', 'Tuần trước bạn đã đi đâu?'],
          ['We|had|a|great|time.', 'Chúng tôi đã có khoảng thời gian tuyệt vời.'],
        ],
        grammarQ: [
          { prompt: 'Viết dạng quá khứ: “Hôm qua tôi đã mua một quyển sách.” (buy, a book)', source: 'I / buy / a book / yesterday', pattern: 'S + bought + …', answers: ['I bought a book yesterday.', 'I bought a book yesterday', 'Yesterday I bought a book.', 'Yesterday, I bought a book.'] },
          { prompt: 'Đặt câu hỏi: “Bạn đã gặp ai ở nhà ga?” (meet, who, at the station)', source: 'Who / you / meet / at the station', pattern: 'Who did you + V nguyên mẫu …?', answers: ['Who did you meet at the station?', 'Who did you meet at the station'] },
        ],
        tip: ['Học theo cụm', 'Thay vì học riêng “went”, hãy học theo cụm “went to the beach”, “went home”. Não nhớ cụm tốt hơn nhớ từ rời.'],
      },
      {
        title: { vi: 'Kể về một chuyến đi (was / were)', en: 'Telling a Holiday Story' },
        intro: 'Bạn kể cho bạn bè nghe chuyến du lịch vừa rồi: nơi ở, thời tiết, cảm xúc. Bài này dạy was/were, các câu hỏi về quá khứ và các tính từ miêu tả chuyến đi.',
        vocab: [
          ['trip', '/trɪp/', 'noun', 'chuyến đi', 'It was a long trip.', 'Đó là một chuyến đi dài.'],
          ['hotel', '/həʊˈtel/', 'noun', 'khách sạn', 'The hotel was near the sea.', 'Khách sạn ở gần biển.'],
          ['beach', '/biːtʃ/', 'noun', 'bãi biển', 'The beach was very clean.', 'Bãi biển rất sạch.'],
          ['weather', '/ˈweðə/', 'noun', 'thời tiết', 'The weather was perfect.', 'Thời tiết thật hoàn hảo.'],
          ['sunny', '/ˈsʌni/', 'adjective', 'có nắng', 'It was sunny all week.', 'Cả tuần trời đều nắng.'],
          ['rainy', '/ˈreɪni/', 'adjective', 'có mưa', 'Monday was rainy.', 'Thứ Hai trời mưa.'],
          ['crowded', '/ˈkraʊdɪd/', 'adjective', 'đông đúc', 'The market was crowded.', 'Chợ rất đông người.'],
          ['delicious', '/dɪˈlɪʃəs/', 'adjective', 'rất ngon', 'The seafood was delicious.', 'Hải sản rất ngon.'],
          ['tired', '/ˈtaɪəd/', 'adjective', 'mệt', 'We were tired after the flight.', 'Chúng tôi mệt sau chuyến bay.'],
          ['souvenir', '/ˌsuːvəˈnɪə/', 'noun', 'quà lưu niệm', 'I bought a souvenir for my mother.', 'Tôi đã mua quà lưu niệm cho mẹ.'],
        ],
        grammar: {
          title: 'was / were và câu hỏi quá khứ',
          explain: 'Quá khứ của to be: I/he/she/it was; you/we/they were. Phủ định: wasn’t / weren’t. Câu hỏi đảo was/were lên trước: “Was the hotel clean?”, “Were you tired?”. Với động từ thường dùng did: “Did you enjoy the trip?”. Từ để hỏi: Where did you stay? How was the weather? How long did you stay?',
          examples: [
            ['The weather was sunny, but the beach was crowded.', 'Thời tiết nắng nhưng bãi biển đông người.'],
            ['We weren’t tired. We were happy.', 'Chúng tôi không mệt. Chúng tôi vui.'],
            ['How was your trip? – It was great!', 'Chuyến đi của bạn thế nào? – Tuyệt vời!'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'How was your trip to Da Nang?', 'Chuyến đi Đà Nẵng của bạn thế nào?'],
            ['Nam', 'It was great! The weather was sunny and the beach was very clean.', 'Tuyệt lắm! Trời nắng và bãi biển rất sạch.'],
            ['Anna', 'Was the hotel good?', 'Khách sạn có tốt không?'],
            ['Nam', 'Yes, it was near the sea. The seafood was delicious, too.', 'Có, nó ở gần biển. Hải sản cũng rất ngon.'],
          ],
        },
        reorder: [
          ['How|was|your|trip?', 'Chuyến đi của bạn thế nào?'],
          ['The|weather|was|perfect.', 'Thời tiết thật hoàn hảo.'],
        ],
        grammarQ: [
          { prompt: 'Chuyển sang quá khứ: The hotel is clean.', source: 'The hotel is clean.', pattern: 'S + was/were + …', answers: ['The hotel was clean.', 'The hotel was clean'] },
          { prompt: 'Đặt câu hỏi: “Khách sạn có gần biển không?”', source: 'the hotel / near the sea', pattern: 'Was + S + …?', answers: ['Was the hotel near the sea?', 'Was the hotel near the sea'] },
        ],
        tip: ['“It was great” là câu trả lời an toàn', 'Khi ai đó hỏi “How was…?”, bạn có thể trả lời bằng một tính từ ngắn: great, nice, a bit boring, terrible. Sau đó thêm một chi tiết để cuộc trò chuyện tiếp tục.'],
      },
    ],
  },
  {
    level: 'A2',
    names: { vi: 'Kế hoạch và lời mời', en: 'Plans and Invitations' },
    lessons: [
      {
        title: { vi: 'Kế hoạch sắp tới (be going to)', en: 'Future Plans with Going To' },
        intro: 'Bạn nói về dự định nghỉ lễ và những việc đã quyết định làm. Bài này dạy cấu trúc be going to và các mốc thời gian tương lai.',
        vocab: [
          ['plan', '/plæn/', 'noun', 'kế hoạch, dự định', 'What is your plan for the holiday?', 'Kế hoạch kỳ nghỉ của bạn là gì?'],
          ['tomorrow', '/təˈmɒrəʊ/', 'adverb', 'ngày mai', 'It will be warm tomorrow.', 'Ngày mai trời sẽ ấm.'],
          ['next week', '/nekst wiːk/', 'phrase', 'tuần sau', 'We are going to move next week.', 'Tuần sau chúng tôi sẽ chuyển nhà.'],
          ['tonight', '/təˈnaɪt/', 'adverb', 'tối nay', 'I am going to cook tonight.', 'Tối nay tôi sẽ nấu ăn.'],
          ['travel', '/ˈtrævl/', 'verb', 'đi du lịch, di chuyển', 'They are going to travel by train.', 'Họ sẽ đi bằng tàu hoả.'],
          ['ticket', '/ˈtɪkɪt/', 'noun', 'vé', 'I need to buy a plane ticket.', 'Tôi cần mua vé máy bay.'],
          ['pack', '/pæk/', 'verb', 'đóng gói, xếp hành lý', 'I must pack my suitcase.', 'Tôi phải xếp vali.'],
          ['airport', '/ˈeəpɔːt/', 'noun', 'sân bay', 'The airport is far from the city.', 'Sân bay ở xa thành phố.'],
          ['passport', '/ˈpɑːspɔːt/', 'noun', 'hộ chiếu', 'Do not forget your passport.', 'Đừng quên hộ chiếu của bạn.'],
          ['holiday', '/ˈhɒlədeɪ/', 'noun', 'kỳ nghỉ', 'I am going on holiday in July.', 'Tháng Bảy tôi sẽ đi nghỉ.'],
        ],
        grammar: {
          title: 'be going to + động từ nguyên mẫu',
          explain: 'Dùng be going to để nói về kế hoạch đã quyết định trước khi nói, hoặc dự đoán dựa trên dấu hiệu hiện tại. Cấu trúc: am/is/are + going to + động từ nguyên mẫu. Phủ định: I’m not going to…; nghi vấn: Are you going to…? Dấu hiệu thời gian: tomorrow, next week, tonight, in July.',
          examples: [
            ['I am going to travel to Japan next month.', 'Tháng sau tôi sẽ đi du lịch Nhật Bản.'],
            ['She isn’t going to work tomorrow.', 'Ngày mai cô ấy sẽ không đi làm.'],
            ['Are you going to buy a ticket today? – Yes, I am.', 'Hôm nay bạn định mua vé à? – Vâng.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'What are you going to do on holiday?', 'Kỳ nghỉ bạn định làm gì?'],
            ['Mai', 'I am going to travel to Japan with my sister.', 'Tôi định đi Nhật cùng chị gái.'],
            ['Tom', 'Wow! Have you bought the tickets?', 'Chà! Bạn mua vé chưa?'],
            ['Mai', 'Not yet. We are going to buy them tomorrow.', 'Chưa. Ngày mai chúng tôi sẽ mua.'],
          ],
        },
        reorder: [
          ['What|are|you|going|to|do|on|holiday?', 'Kỳ nghỉ bạn định làm gì?'],
          ['I|am|going|to|travel|to|Japan|next|month.', 'Tháng sau tôi sẽ đi du lịch Nhật Bản.'],
        ],
        grammarQ: [
          { prompt: 'Nói kế hoạch: “Tối nay tôi sẽ nấu ăn.” (cook, tonight)', source: 'I / cook / tonight', pattern: 'I am going to + V', answers: ['I am going to cook tonight.', 'I’m going to cook tonight.', "I'm going to cook tonight.", 'Tonight I am going to cook.', 'Tonight I’m going to cook.', "Tonight I'm going to cook."] },
          { prompt: 'Đặt câu hỏi: “Bạn định mua vé hôm nay à?”', source: 'you / buy a ticket / today', pattern: 'Are you going to + V …?', answers: ['Are you going to buy a ticket today?', 'Are you going to buy a ticket today'] },
        ],
        tip: ['Nói nhanh: “gonna”', 'Trong hội thoại đời thường, người bản ngữ đọc “going to” thành “gonna”. Bạn nên hiểu khi nghe, nhưng khi viết hãy dùng “going to”.'],
      },
      {
        title: { vi: 'Đề nghị và dự đoán (will / won’t)', en: 'Offers and Predictions with Will' },
        intro: 'Bạn muốn đề nghị giúp đỡ, hứa hẹn và đoán điều sắp xảy ra. Bài này dạy will / won’t cùng các từ như probably, maybe, I think.',
        vocab: [
          ['help', '/help/', 'verb', 'giúp đỡ', 'I will help you with the bags.', 'Tôi sẽ giúp bạn xách túi.'],
          ['carry', '/ˈkæri/', 'verb', 'mang, xách', 'Let me carry your suitcase.', 'Để tôi xách vali giúp bạn.'],
          ['heavy', '/ˈhevi/', 'adjective', 'nặng', 'This box is very heavy.', 'Cái hộp này rất nặng.'],
          ['promise', '/ˈprɒmɪs/', 'verb', 'hứa', 'I promise I will call you.', 'Tôi hứa tôi sẽ gọi cho bạn.'],
          ['probably', '/ˈprɒbəbli/', 'adverb', 'có lẽ, nhiều khả năng', 'It will probably rain tonight.', 'Tối nay có lẽ trời sẽ mưa.'],
          ['maybe', '/ˈmeɪbi/', 'adverb', 'có thể, biết đâu', 'Maybe he will come.', 'Biết đâu anh ấy sẽ đến.'],
          ['forget', '/fəˈɡet/', 'verb', 'quên', 'I won’t forget your birthday.', 'Tôi sẽ không quên sinh nhật của bạn.'],
          ['answer', '/ˈɑːnsə/', 'verb', 'trả lời; nghe (điện thoại)', 'I will answer the phone.', 'Để tôi nghe điện thoại.'],
          ['cold', '/kəʊld/', 'adjective', 'lạnh', 'It will be cold tomorrow.', 'Ngày mai trời sẽ lạnh.'],
          ['later', '/ˈleɪtə/', 'adverb', 'lát nữa, sau', 'See you later.', 'Hẹn gặp lại lát nữa.'],
        ],
        grammar: {
          title: 'will / won’t cho quyết định tức thời và dự đoán',
          explain: 'will + động từ nguyên mẫu dùng khi bạn quyết định ngay lúc nói (đề nghị, hứa) hoặc dự đoán dựa trên ý kiến. Rút gọn: I’ll, you’ll, he’ll; phủ định won’t (will not). Với dự đoán thường đi cùng I think / probably / maybe: “I think it will rain.” So sánh: be going to = đã có kế hoạch; will = quyết định ngay lúc đó.',
          examples: [
            ['The box is heavy. – I will carry it.', 'Cái hộp nặng quá. – Để tôi xách.'],
            ['I think it will rain tomorrow.', 'Tôi nghĩ ngày mai trời sẽ mưa.'],
            ['I promise I won’t forget.', 'Tôi hứa tôi sẽ không quên.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'Oh no, my bag is very heavy.', 'Ôi không, túi của tôi nặng quá.'],
            ['Tom', 'I will carry it for you.', 'Để tôi xách giúp bạn.'],
            ['Anna', 'Thank you! Do you think it will rain later?', 'Cảm ơn bạn! Bạn nghĩ lát nữa trời có mưa không?'],
            ['Tom', 'Probably. Let’s take an umbrella.', 'Có lẽ có. Chúng ta mang theo ô nhé.'],
          ],
        },
        reorder: [
          ['I|will|carry|it|for|you.', 'Để tôi xách giúp bạn.'],
          ['I|think|it|will|rain|tomorrow.', 'Tôi nghĩ ngày mai trời sẽ mưa.'],
        ],
        grammarQ: [
          { prompt: 'Đề nghị giúp: “Tôi sẽ mở cửa sổ.” (open the window)', source: 'open the window', pattern: 'I will + V', answers: ['I will open the window.', 'I’ll open the window.', "I'll open the window.", 'I will open the window', 'I’ll open the window', "I'll open the window"] },
          { prompt: 'Phủ định: “Tôi sẽ không quên.” (forget)', source: 'forget', pattern: 'I won’t + V', answers: ['I won’t forget.', "I won't forget.", 'I will not forget.', 'I won’t forget', "I won't forget"] },
        ],
        tip: ['Quyết định tức thời → will', 'Nếu bạn nghe thấy vấn đề và phản ứng ngay (“The phone is ringing.” → “I’ll answer it.”), dùng will. Nếu đã định từ trước, dùng be going to.'],
      },
      {
        title: { vi: 'Lời mời và hẹn gặp', en: 'Invitations and Arrangements' },
        intro: 'Bạn muốn mời bạn đi xem phim, nhận lời hoặc từ chối nhẹ nhàng và hẹn giờ gặp. Bài này dạy các mẫu Would you like to…, Let’s… và hiện tại tiếp diễn cho cuộc hẹn.',
        vocab: [
          ['invite', '/ɪnˈvaɪt/', 'verb', 'mời', 'I want to invite you to my party.', 'Tôi muốn mời bạn đến bữa tiệc của tôi.'],
          ['party', '/ˈpɑːti/', 'noun', 'bữa tiệc', 'The party starts at eight.', 'Bữa tiệc bắt đầu lúc tám giờ.'],
          ['cinema', '/ˈsɪnəmə/', 'noun', 'rạp chiếu phim', 'Let’s go to the cinema.', 'Chúng ta đi xem phim nhé.'],
          ['free', '/friː/', 'adjective', 'rảnh; miễn phí', 'Are you free on Friday?', 'Thứ Sáu bạn có rảnh không?'],
          ['busy', '/ˈbɪzi/', 'adjective', 'bận', 'I am busy this evening.', 'Tối nay tôi bận.'],
          ['join', '/dʒɔɪn/', 'verb', 'tham gia, cùng', 'Would you like to join us?', 'Bạn có muốn đi cùng chúng tôi không?'],
          ['meet up', '/miːt ʌp/', 'phrasal verb', 'gặp nhau, hẹn gặp', 'Let’s meet up at six.', 'Mình hẹn gặp lúc sáu giờ nhé.'],
          ['sorry, I can’t', '/ˈsɒri aɪ kɑːnt/', 'phrase', 'xin lỗi, tôi không đi được', 'Sorry, I can’t come on Friday.', 'Xin lỗi, thứ Sáu tôi không đến được.'],
          ['great idea', '/ɡreɪt aɪˈdɪə/', 'phrase', 'ý hay đấy', 'That’s a great idea!', 'Ý hay đấy!'],
          ['arrange', '/əˈreɪndʒ/', 'verb', 'sắp xếp, thu xếp', 'We arranged a meeting for Monday.', 'Chúng tôi đã sắp xếp một cuộc họp vào thứ Hai.'],
        ],
        grammar: {
          title: 'Would you like to…? / Let’s… / hiện tại tiếp diễn cho cuộc hẹn',
          explain: 'Mời lịch sự: “Would you like to + V?” Nhận lời: “I’d love to.” / “That’s a great idea.” Từ chối lịch sự: “Sorry, I can’t. I’m busy.” Đề xuất cùng làm: “Let’s + V.” Với cuộc hẹn đã sắp xếp, dùng hiện tại tiếp diễn: “I’m meeting Anna at six.” Khi từ chối, nên nói lý do ngắn gọn.',
          examples: [
            ['Would you like to go to the cinema on Friday?', 'Thứ Sáu bạn có muốn đi xem phim không?'],
            ['Sorry, I can’t. I am meeting my teacher.', 'Xin lỗi, tôi không đi được. Tôi hẹn gặp thầy giáo.'],
            ['Let’s meet up at six o’clock.', 'Mình hẹn gặp lúc sáu giờ nhé.'],
          ],
        },
        dialogue: {
          lines: [
            ['Linh', 'Are you free on Friday?', 'Thứ Sáu bạn có rảnh không?'],
            ['Tom', 'I think so. Why?', 'Tôi nghĩ là có. Có chuyện gì thế?'],
            ['Linh', 'Would you like to go to the cinema with me?', 'Bạn có muốn đi xem phim với tôi không?'],
            ['Tom', 'That’s a great idea! Let’s meet up at six.', 'Ý hay đấy! Mình hẹn gặp lúc sáu giờ nhé.'],
          ],
        },
        reorder: [
          ['Would|you|like|to|go|to|the|cinema|on|Friday?', 'Thứ Sáu bạn có muốn đi xem phim không?'],
          ['Let’s|meet|up|at|six|o’clock.', 'Mình hẹn gặp lúc sáu giờ nhé.'],
        ],
        grammarQ: [
          { prompt: 'Mời bạn đến bữa tiệc của bạn bằng “Would you like to…”.', source: 'come to my party', pattern: 'Would you like to + V …?', answers: ['Would you like to come to my party?', 'Would you like to come to my party'] },
          { prompt: 'Từ chối lịch sự và nêu lý do: bạn bận tối nay.', source: 'busy / this evening', pattern: 'Sorry, I can’t. I am …', answers: ['Sorry, I can’t. I am busy this evening.', "Sorry, I can't. I am busy this evening.", 'Sorry, I can’t. I’m busy this evening.', "Sorry, I can't. I'm busy this evening."] },
        ],
        tip: ['Từ chối mà vẫn thân thiện', 'Thay vì chỉ nói “No”, hãy nói “Sorry, I can’t, but thanks for asking”, và nếu muốn, đề xuất ngày khác: “How about next week?”'],
      },
    ],
  },
  {
    level: 'A2',
    names: { vi: 'So sánh, sức khoẻ và trải nghiệm', en: 'Comparing, Health and Experience' },
    lessons: [
      {
        title: { vi: 'So sánh hơn và so sánh nhất', en: 'Comparatives and Superlatives' },
        intro: 'Bạn so sánh hai thành phố, hai món đồ và chọn cái tốt nhất. Bài này dạy tính từ so sánh hơn (-er / more) và so sánh nhất (-est / the most).',
        vocab: [
          ['faster', '/ˈfɑːstə/', 'adjective (comparative)', 'nhanh hơn', 'A train is faster than a bus.', 'Tàu hoả nhanh hơn xe buýt.'],
          ['cheaper', '/ˈtʃiːpə/', 'adjective (comparative)', 'rẻ hơn', 'This shop is cheaper than that one.', 'Cửa hàng này rẻ hơn cửa hàng kia.'],
          ['more expensive', '/mɔːr ɪkˈspensɪv/', 'phrase', 'đắt hơn', 'Taxis are more expensive than buses.', 'Taxi đắt hơn xe buýt.'],
          ['better', '/ˈbetə/', 'adjective (comparative)', 'tốt hơn', 'Your English is better than mine.', 'Tiếng Anh của bạn tốt hơn của tôi.'],
          ['the best', '/ðə best/', 'phrase', 'tốt nhất', 'This is the best restaurant in town.', 'Đây là nhà hàng tốt nhất trong thành phố.'],
          ['the biggest', '/ðə ˈbɪɡɪst/', 'phrase', 'lớn nhất', 'Ho Chi Minh City is the biggest city in Vietnam.', 'Thành phố Hồ Chí Minh là thành phố lớn nhất Việt Nam.'],
          ['than', '/ðæn/', 'conjunction', 'hơn (so với)', 'He is taller than me.', 'Anh ấy cao hơn tôi.'],
          ['quiet', '/ˈkwaɪət/', 'adjective', 'yên tĩnh', 'The countryside is quiet.', 'Vùng quê rất yên tĩnh.'],
          ['noisy', '/ˈnɔɪzi/', 'adjective', 'ồn ào', 'The city is noisy at night.', 'Thành phố ồn ào vào ban đêm.'],
          ['difficult', '/ˈdɪfɪkəlt/', 'adjective', 'khó', 'Chinese is difficult for me.', 'Tiếng Trung rất khó với tôi.'],
        ],
        grammar: {
          title: 'So sánh hơn (-er / more … than) và so sánh nhất (the -est / the most)',
          explain: 'Tính từ ngắn (1 âm tiết): thêm -er / the -est (fast → faster → the fastest; big → bigger → the biggest, gấp đôi phụ âm). Tính từ dài (từ 2 âm tiết trở lên): more / the most + tính từ (expensive → more expensive → the most expensive). Bất quy tắc: good → better → the best; bad → worse → the worst. So sánh hơn đi với than.',
          examples: [
            ['A train is faster than a bus.', 'Tàu hoả nhanh hơn xe buýt.'],
            ['Taxis are more expensive than buses.', 'Taxi đắt hơn xe buýt.'],
            ['This is the best restaurant in town.', 'Đây là nhà hàng tốt nhất trong thành phố.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'Which is better, Hanoi or Ho Chi Minh City?', 'Hà Nội hay thành phố Hồ Chí Minh tốt hơn?'],
            ['Linh', 'Ho Chi Minh City is bigger and noisier, but Hanoi is quieter.', 'Thành phố Hồ Chí Minh lớn hơn và ồn hơn, nhưng Hà Nội yên tĩnh hơn.'],
            ['Anna', 'Which is more expensive?', 'Nơi nào đắt hơn?'],
            ['Linh', 'Ho Chi Minh City is more expensive than Hanoi.', 'Thành phố Hồ Chí Minh đắt hơn Hà Nội.'],
          ],
        },
        reorder: [
          ['A|train|is|faster|than|a|bus.', 'Tàu hoả nhanh hơn xe buýt.'],
          ['This|is|the|best|restaurant|in|town.', 'Đây là nhà hàng tốt nhất trong thành phố.'],
        ],
        grammarQ: [
          { prompt: 'So sánh hơn: “Chị tôi cao hơn tôi.” (tall)', source: 'My sister / tall / me', pattern: 'S + is + taller + than + …', answers: ['My sister is taller than me.', 'My sister is taller than I am.', 'My sister is taller than I.'] },
          { prompt: 'So sánh nhất: “Đây là quyển sách thú vị nhất.” (interesting)', source: 'This / interesting book', pattern: 'the most + tính từ dài', answers: ['This is the most interesting book.', 'This is the most interesting book!'] },
        ],
        tip: ['Đừng dùng “more” với -er', 'Không nói “more faster” hay “more better”. Chỉ chọn MỘT cách: faster HOẶC more + tính từ dài.'],
      },
      {
        title: { vi: 'Sức khoẻ và lời khuyên (should / have to)', en: 'Health and Advice' },
        intro: 'Bạn thấy không khoẻ và cần nói với bác sĩ hoặc đồng nghiệp. Bài này giúp bạn nói về triệu chứng, xin và đưa lời khuyên với should/shouldn’t và have to.',
        vocab: [
          ['headache', '/ˈhedeɪk/', 'noun', 'đau đầu', 'I have a headache.', 'Tôi bị đau đầu.'],
          ['cold', '/kəʊld/', 'noun', 'cảm lạnh', 'She has a cold.', 'Cô ấy bị cảm lạnh.'],
          ['fever', '/ˈfiːvə/', 'noun', 'sốt', 'He has a high fever.', 'Anh ấy sốt cao.'],
          ['cough', '/kɒf/', 'noun', 'ho', 'I have a bad cough.', 'Tôi ho nhiều.'],
          ['doctor', '/ˈdɒktə/', 'noun', 'bác sĩ', 'You should see a doctor.', 'Bạn nên đi khám bác sĩ.'],
          ['medicine', '/ˈmedsn/', 'noun', 'thuốc', 'Take this medicine twice a day.', 'Uống thuốc này hai lần một ngày.'],
          ['rest', '/rest/', 'verb', 'nghỉ ngơi', 'You should rest at home.', 'Bạn nên nghỉ ngơi ở nhà.'],
          ['sick', '/sɪk/', 'adjective', 'ốm, bệnh', 'I feel sick today.', 'Hôm nay tôi thấy không khoẻ.'],
          ['stomach', '/ˈstʌmək/', 'noun', 'dạ dày, bụng', 'My stomach hurts.', 'Tôi bị đau bụng.'],
          ['healthy', '/ˈhelθi/', 'adjective', 'khoẻ mạnh, lành mạnh', 'Fruit is healthy food.', 'Trái cây là thức ăn lành mạnh.'],
        ],
        grammar: {
          title: 'should / shouldn’t và have to',
          explain: 'should + động từ nguyên mẫu để khuyên: “You should rest.” Phủ định shouldn’t: “You shouldn’t drink cold water.” have to diễn tả điều bắt buộc: “I have to see a doctor.” (he/she has to). Để hỏi triệu chứng: “What’s the matter?”, “How do you feel?”. Dùng “have a + bệnh” (have a headache, have a cold), “My + bộ phận + hurts” (My stomach hurts).',
          examples: [
            ['You should rest and drink warm water.', 'Bạn nên nghỉ ngơi và uống nước ấm.'],
            ['You shouldn’t go to work today.', 'Hôm nay bạn không nên đi làm.'],
            ['She has to take this medicine twice a day.', 'Cô ấy phải uống thuốc này hai lần một ngày.'],
          ],
        },
        dialogue: {
          lines: [
            ['Doctor', 'What is the matter?', 'Bạn bị sao vậy?'],
            ['Nam', 'I have a headache and a cough. I feel sick.', 'Tôi bị đau đầu và ho. Tôi thấy mệt.'],
            ['Doctor', 'You should rest and you should take this medicine twice a day.', 'Bạn nên nghỉ ngơi và nên uống thuốc này hai lần mỗi ngày.'],
            ['Nam', 'Do I have to stay at home?', 'Tôi có phải ở nhà không?'],
          ],
        },
        reorder: [
          ['You|should|rest|and|drink|warm|water.', 'Bạn nên nghỉ ngơi và uống nước ấm.'],
          ['What|is|the|matter?', 'Bạn bị sao vậy?'],
        ],
        grammarQ: [
          { prompt: 'Khuyên bạn: “Bạn nên đi khám bác sĩ.” (see a doctor)', source: 'you / see a doctor', pattern: 'You should + V', answers: ['You should see a doctor.', 'You should see a doctor'] },
          { prompt: 'Khuyên không nên: “Bạn không nên ăn quá nhiều đường.” (eat too much sugar)', source: 'you / eat too much sugar', pattern: 'You shouldn’t + V', answers: ['You shouldn’t eat too much sugar.', "You shouldn't eat too much sugar.", 'You should not eat too much sugar.'] },
        ],
        tip: ['“Have a cold” ≠ “be cold”', '“I have a cold” = tôi bị cảm. “I am cold” = tôi thấy lạnh. Hai câu khác nghĩa hoàn toàn.'],
      },
      {
        title: { vi: 'Bạn đã bao giờ…? (hiện tại hoàn thành)', en: 'Have You Ever…? Present Perfect' },
        intro: 'Bạn muốn hỏi và kể về trải nghiệm đã có trong đời. Bài này giới thiệu hiện tại hoàn thành với ever, never, already, yet.',
        vocab: [
          ['ever', '/ˈevə/', 'adverb', 'từng, bao giờ', 'Have you ever been to Japan?', 'Bạn đã bao giờ đến Nhật chưa?'],
          ['never', '/ˈnevə/', 'adverb', 'không bao giờ; chưa bao giờ', 'I have never eaten sushi.', 'Tôi chưa bao giờ ăn sushi.'],
          ['already', '/ɔːlˈredi/', 'adverb', 'đã … rồi', 'I have already finished my homework.', 'Tôi đã làm xong bài tập rồi.'],
          ['yet', '/jet/', 'adverb', 'chưa (câu phủ định/hỏi)', 'Have you eaten yet?', 'Bạn đã ăn chưa?'],
          ['try', '/traɪ/', 'verb', 'thử', 'I want to try Japanese food.', 'Tôi muốn thử món Nhật.'],
          ['abroad', '/əˈbrɔːd/', 'adverb', 'ở nước ngoài', 'She has lived abroad.', 'Cô ấy đã sống ở nước ngoài.'],
          ['climb', '/klaɪm/', 'verb', 'leo', 'We climbed a mountain last year.', 'Năm ngoái chúng tôi đã leo núi.'],
          ['mountain', '/ˈmaʊntən/', 'noun', 'ngọn núi', 'Fansipan is a high mountain.', 'Fansipan là một ngọn núi cao.'],
          ['once', '/wʌns/', 'adverb', 'một lần', 'I have been there once.', 'Tôi đã đến đó một lần.'],
          ['experience', '/ɪkˈspɪəriəns/', 'noun', 'trải nghiệm, kinh nghiệm', 'It was a wonderful experience.', 'Đó là một trải nghiệm tuyệt vời.'],
        ],
        grammar: {
          title: 'Hiện tại hoàn thành: have / has + quá khứ phân từ',
          explain: 'Hiện tại hoàn thành nói về trải nghiệm trong đời hoặc việc vừa xong có liên quan đến hiện tại, KHÔNG nêu thời điểm cụ thể. Cấu trúc: have/has + quá khứ phân từ (V3): visited, eaten, been, seen. Hỏi trải nghiệm: “Have you ever…?” – “Yes, I have. / No, I haven’t.” Dùng never (chưa bao giờ), already (đã … rồi), yet (chưa – cuối câu hỏi/phủ định). Khi có thời điểm cụ thể (last year, yesterday) dùng quá khứ đơn.',
          examples: [
            ['Have you ever been to Japan? – No, I have never been there.', 'Bạn đã bao giờ đến Nhật chưa? – Chưa, tôi chưa bao giờ đến đó.'],
            ['I have already finished my homework.', 'Tôi đã làm xong bài tập rồi.'],
            ['She has climbed a mountain once.', 'Cô ấy đã leo núi một lần.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'Have you ever been abroad?', 'Bạn đã bao giờ ra nước ngoài chưa?'],
            ['Linh', 'Yes, I have. I went to Japan last year.', 'Rồi. Năm ngoái tôi đã đi Nhật.'],
            ['Tom', 'Have you tried sushi?', 'Bạn đã thử sushi chưa?'],
            ['Linh', 'Yes, I have. It was delicious!', 'Rồi. Rất ngon!'],
          ],
        },
        reorder: [
          ['Have|you|ever|been|to|Japan?', 'Bạn đã bao giờ đến Nhật chưa?'],
          ['I|have|already|finished|my|homework.', 'Tôi đã làm xong bài tập rồi.'],
        ],
        grammarQ: [
          { prompt: 'Nói trải nghiệm: “Tôi chưa bao giờ ăn sushi.” (eat → eaten)', source: 'I / never / eat sushi', pattern: 'I have never + V3', answers: ['I have never eaten sushi.', 'I’ve never eaten sushi.', "I've never eaten sushi."] },
          { prompt: 'Hỏi: “Bạn đã ăn chưa?” (eat → eaten, yet)', source: 'you / eat / yet', pattern: 'Have you + V3 + yet?', answers: ['Have you eaten yet?', 'Have you eaten yet'] },
        ],
        tip: ['Been hay gone?', '“She has been to Japan” = cô ấy đã từng đến Nhật (và đã về). “She has gone to Japan” = cô ấy đã đi Nhật và vẫn đang ở đó.'],
      },
    ],
  },
  {
    level: 'A2',
    names: { vi: 'Dịch vụ và giao tiếp xã hội', en: 'Services and Social Life' },
    lessons: [
      {
        title: { vi: 'Gọi món ở nhà hàng', en: 'Ordering at a Restaurant' },
        intro: 'Bạn đặt bàn, gọi món, hỏi về dị ứng và thanh toán. Bài này dạy câu yêu cầu lịch sự Could I have… và từ vựng thực đơn.',
        vocab: [
          ['menu', '/ˈmenjuː/', 'noun', 'thực đơn', 'Could I see the menu, please?', 'Cho tôi xem thực đơn được không?'],
          ['order', '/ˈɔːdə/', 'verb', 'gọi món, đặt hàng', 'Are you ready to order?', 'Quý khách đã sẵn sàng gọi món chưa?'],
          ['main course', '/meɪn kɔːs/', 'noun', 'món chính', 'I would like fish as a main course.', 'Tôi muốn món cá làm món chính.'],
          ['dessert', '/dɪˈzɜːt/', 'noun', 'món tráng miệng', 'We had ice cream for dessert.', 'Chúng tôi ăn kem tráng miệng.'],
          ['vegetarian', '/ˌvedʒəˈteəriən/', 'adjective', 'ăn chay', 'Do you have a vegetarian dish?', 'Ở đây có món chay không?'],
          ['allergic', '/əˈlɜːdʒɪk/', 'adjective', 'bị dị ứng', 'I am allergic to peanuts.', 'Tôi bị dị ứng đậu phộng.'],
          ['bill', '/bɪl/', 'noun', 'hoá đơn', 'Could we have the bill, please?', 'Cho chúng tôi xin hoá đơn.'],
          ['tip', '/tɪp/', 'noun', 'tiền boa', 'We left a small tip.', 'Chúng tôi để lại một ít tiền boa.'],
          ['book a table', '/bʊk ə ˈteɪbl/', 'phrase', 'đặt bàn', 'I would like to book a table for two.', 'Tôi muốn đặt một bàn cho hai người.'],
          ['spicy', '/ˈspaɪsi/', 'adjective', 'cay', 'This soup is too spicy for me.', 'Món súp này cay quá với tôi.'],
        ],
        grammar: {
          title: 'Could I have…? / Can we…? và cách gọi món lịch sự',
          explain: 'Yêu cầu lịch sự dùng “Could I have + danh từ?” hoặc “Could we + V?”. Gọi món: “I’d like the chicken, please.” Hỏi thành phần: “Does it have nuts in it?” Giải thích hạn chế ăn uống: “I’m vegetarian.” / “I’m allergic to …”. Thanh toán: “Could we have the bill, please?”. Nhớ nói please và thank you.',
          examples: [
            ['Could I see the menu, please?', 'Cho tôi xem thực đơn được không?'],
            ['I am allergic to peanuts. Does this dish have peanuts?', 'Tôi bị dị ứng đậu phộng. Món này có đậu phộng không?'],
            ['Could we have the bill, please?', 'Cho chúng tôi xin hoá đơn.'],
          ],
        },
        dialogue: {
          lines: [
            ['Waiter', 'Good evening. Are you ready to order?', 'Chào buổi tối. Quý khách đã sẵn sàng gọi món chưa ạ?'],
            ['Mai', 'Yes. I am vegetarian. Do you have a vegetarian main course?', 'Rồi. Tôi ăn chay. Ở đây có món chính chay không?'],
            ['Waiter', 'Yes, the vegetable curry is very good.', 'Có, món cà ri rau củ rất ngon.'],
            ['Mai', 'I’d like that, please. And could we have the bill later?', 'Cho tôi món đó. Và lát nữa cho chúng tôi xin hoá đơn nhé?'],
          ],
        },
        reorder: [
          ['Could|I|see|the|menu,|please?', 'Cho tôi xem thực đơn được không?'],
          ['Could|we|have|the|bill,|please?', 'Cho chúng tôi xin hoá đơn.'],
        ],
        grammarQ: [
          { prompt: 'Xin một ly nước một cách lịch sự bằng “Could I have…”.', source: 'a glass of water', pattern: 'Could I have + …, please?', answers: ['Could I have a glass of water, please?', 'Could I have a glass of water please?', 'Could I have a glass of water?'] },
          { prompt: 'Nói bạn bị dị ứng hải sản. (seafood)', source: 'allergic / seafood', pattern: 'I am allergic to + …', answers: ['I am allergic to seafood.', 'I’m allergic to seafood.', "I'm allergic to seafood."] },
        ],
        tip: ['Could lịch sự hơn can', '“Could I have…?” nghe mềm và lịch sự hơn “Can I have…?”, nên hợp với nhà hàng, khách sạn và nơi công cộng.'],
      },
      {
        title: { vi: 'Điện thoại, tin nhắn và cuộc hẹn', en: 'Phone Calls and Appointments' },
        intro: 'Bạn gọi điện đặt lịch hẹn, để lại lời nhắn và hỏi xem người kia có rảnh không. Bài này dạy các câu nói điện thoại chuẩn và cách chuyển lời.',
        vocab: [
          ['call', '/kɔːl/', 'verb', 'gọi điện', 'I will call you tomorrow.', 'Ngày mai tôi sẽ gọi cho bạn.'],
          ['appointment', '/əˈpɔɪntmənt/', 'noun', 'cuộc hẹn', 'I have an appointment with the dentist.', 'Tôi có hẹn với nha sĩ.'],
          ['available', '/əˈveɪləbl/', 'adjective', 'có mặt, rảnh', 'Is Mr Brown available now?', 'Ông Brown có rảnh bây giờ không?'],
          ['leave a message', '/liːv ə ˈmesɪdʒ/', 'phrase', 'để lại lời nhắn', 'Can I leave a message?', 'Tôi để lại lời nhắn được không?'],
          ['hold on', '/həʊld ɒn/', 'phrasal verb', 'chờ một chút (điện thoại)', 'Please hold on a moment.', 'Xin vui lòng chờ một chút.'],
          ['speak to', '/spiːk tuː/', 'phrase', 'nói chuyện với', 'Could I speak to Anna, please?', 'Cho tôi nói chuyện với Anna được không?'],
          ['reply', '/rɪˈplaɪ/', 'verb', 'trả lời, hồi âm', 'Please reply to my email.', 'Hãy trả lời email của tôi.'],
          ['text', '/tekst/', 'noun', 'tin nhắn', 'I sent you a text.', 'Tôi đã gửi cho bạn một tin nhắn.'],
          ['cancel', '/ˈkænsl/', 'verb', 'huỷ', 'I need to cancel my appointment.', 'Tôi cần huỷ cuộc hẹn.'],
          ['reschedule', '/ˌriːˈʃedjuːl/', 'verb', 'dời lịch', 'Can we reschedule for Friday?', 'Chúng ta dời sang thứ Sáu được không?'],
        ],
        grammar: {
          title: 'Câu thường dùng khi nói điện thoại và đặt lịch',
          explain: 'Mở đầu: “Hello, this is Nam.” (không nói “I am Nam” qua điện thoại). Hỏi người cần gặp: “Could I speak to Ms Brown, please?” Chờ máy: “Hold on, please.” Để lại lời nhắn: “Can I leave a message?” Đặt lịch: “I’d like to make an appointment for Monday at ten.” Dời hoặc huỷ: “I need to cancel / reschedule.” Mẫu “Could you + V?” dùng để nhờ vả lịch sự.',
          examples: [
            ['Hello, this is Nam. Could I speak to Ms Brown, please?', 'Xin chào, tôi là Nam. Cho tôi nói chuyện với cô Brown được không?'],
            ['I’d like to make an appointment for Monday at ten.', 'Tôi muốn đặt một cuộc hẹn vào thứ Hai lúc mười giờ.'],
            ['Could you call me back later?', 'Lát nữa bạn gọi lại cho tôi được không?'],
          ],
        },
        dialogue: {
          lines: [
            ['Nam', 'Hello, this is Nam. Could I speak to Ms Brown, please?', 'Xin chào, tôi là Nam. Cho tôi nói chuyện với cô Brown được không?'],
            ['Assistant', 'I am sorry, she is not available. Can I take a message?', 'Xin lỗi, cô ấy không có mặt. Tôi có thể ghi lời nhắn không?'],
            ['Nam', 'Yes. Could you ask her to call me back?', 'Vâng. Bạn nhắn cô ấy gọi lại cho tôi nhé?'],
            ['Assistant', 'Of course. I’ll tell her.', 'Tất nhiên. Tôi sẽ nhắn cô ấy.'],
          ],
        },
        reorder: [
          ['Could|I|speak|to|Ms|Brown,|please?', 'Cho tôi nói chuyện với cô Brown được không?'],
          ['Could|you|call|me|back|later?', 'Lát nữa bạn gọi lại cho tôi được không?'],
        ],
        grammarQ: [
          { prompt: 'Tự giới thiệu khi nghe điện thoại: tên bạn là Nam.', source: 'Nam', pattern: 'Hello, this is + tên.', answers: ['Hello, this is Nam.', 'Hello, this is Nam', 'Hello. This is Nam.', 'Hi, this is Nam.'] },
          { prompt: 'Nhờ ai đó gọi lại cho bạn một cách lịch sự bằng “Could you…”.', source: 'call me back', pattern: 'Could you + V …?', answers: ['Could you call me back?', 'Could you call me back, please?', 'Could you call me back please?'] },
        ],
        tip: ['“This is” không phải “I am”', 'Khi nghe điện thoại, người Anh nói “This is Nam” để giới thiệu. Nói “I am Nam” nghe không tự nhiên.'],
      },
      {
        title: { vi: 'Công việc, học tập và nêu ý kiến', en: 'Work, Study and Opinions' },
        intro: 'Bạn nói về công việc, giải thích lý do và nêu ý kiến một cách lịch sự. Bài này dạy because / so, I think, I agree và cách đồng ý hay không đồng ý nhẹ nhàng.',
        vocab: [
          ['job', '/dʒɒb/', 'noun', 'công việc', 'I love my job.', 'Tôi yêu công việc của mình.'],
          ['company', '/ˈkʌmpəni/', 'noun', 'công ty', 'She works for a big company.', 'Cô ấy làm việc cho một công ty lớn.'],
          ['manager', '/ˈmænɪdʒə/', 'noun', 'quản lý', 'My manager is very kind.', 'Quản lý của tôi rất tốt bụng.'],
          ['because', '/bɪˈkɒz/', 'conjunction', 'bởi vì', 'I study English because I want a better job.', 'Tôi học tiếng Anh vì tôi muốn có công việc tốt hơn.'],
          ['so', '/səʊ/', 'conjunction', 'vì vậy, nên', 'I was tired, so I went to bed early.', 'Tôi mệt nên đi ngủ sớm.'],
          ['agree', '/əˈɡriː/', 'verb', 'đồng ý', 'I agree with you.', 'Tôi đồng ý với bạn.'],
          ['opinion', '/əˈpɪnjən/', 'noun', 'ý kiến, quan điểm', 'In my opinion, it is a good idea.', 'Theo ý kiến của tôi, đó là một ý hay.'],
          ['useful', '/ˈjuːsfl/', 'adjective', 'hữu ích', 'This app is very useful.', 'Ứng dụng này rất hữu ích.'],
          ['interesting', '/ˈɪntrəstɪŋ/', 'adjective', 'thú vị', 'The lesson was interesting.', 'Bài học rất thú vị.'],
          ['salary', '/ˈsæləri/', 'noun', 'lương', 'The salary is good.', 'Mức lương khá tốt.'],
        ],
        grammar: {
          title: 'because / so và cách nêu ý kiến',
          explain: 'because nêu lý do: “I study English because I want a better job.” so nêu kết quả: “I was tired, so I went to bed.” Nêu ý kiến: “I think…”, “In my opinion…”. Đồng ý: “I agree.” / “Me too.” Không đồng ý nhẹ nhàng: “I’m not sure. I think…”, “That’s true, but…”. Sau because là một mệnh đề đầy đủ (chủ ngữ + động từ).',
          examples: [
            ['I study English because I want a better job.', 'Tôi học tiếng Anh vì tôi muốn có công việc tốt hơn.'],
            ['I was tired, so I went to bed early.', 'Tôi mệt nên đi ngủ sớm.'],
            ['I think it is a good idea, but it is expensive.', 'Tôi nghĩ đó là ý hay nhưng nó đắt.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'Why are you studying English, Linh?', 'Tại sao bạn học tiếng Anh vậy, Linh?'],
            ['Linh', 'Because I want a better job. My manager says English is useful.', 'Vì tôi muốn có công việc tốt hơn. Quản lý của tôi nói tiếng Anh rất hữu ích.'],
            ['Tom', 'I agree. I think it is a good idea.', 'Tôi đồng ý. Tôi nghĩ đó là ý hay.'],
            ['Linh', 'Thanks! It is difficult, but it is interesting.', 'Cảm ơn! Nó khó nhưng thú vị.'],
          ],
        },
        reorder: [
          ['I|study|English|because|I|want|a|better|job.', 'Tôi học tiếng Anh vì tôi muốn có công việc tốt hơn.'],
          ['I|was|tired,|so|I|went|to|bed|early.', 'Tôi mệt nên đi ngủ sớm.'],
        ],
        grammarQ: [
          { prompt: 'Nối hai ý bằng because: “Tôi ở nhà vì tôi bị ốm.” (stay at home, be sick)', source: 'I stay at home / I am sick', pattern: 'S + V + because + S + V', answers: ['I stay at home because I am sick.', 'I stay at home because I’m sick.', "I stay at home because I'm sick.", 'I stayed at home because I was sick.'] },
          { prompt: 'Nối bằng so: “Trời mưa, nên chúng tôi ở nhà.” (it rained, we stayed at home)', source: 'It rained. / We stayed at home.', pattern: 'S + V, so + S + V', answers: ['It rained, so we stayed at home.', 'It rained so we stayed at home.'] },
        ],
        tip: ['Because và so không dùng cùng nhau', 'Không nói “Because I was tired, so I went to bed.” Chỉ cần một liên từ: “Because I was tired, I went to bed.” hoặc “I was tired, so I went to bed.”'],
      },
    ],
  },
];
