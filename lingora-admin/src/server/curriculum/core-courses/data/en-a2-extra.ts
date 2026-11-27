import type { UnitSpec } from '../types.ts';

/** English A2 — extension units (5–7): past stories, quantities and shopping, travel. */
export const EN_A2_EXTRA_UNITS: UnitSpec[] = [
  {
    level: 'A2',
    names: { vi: 'Kể chuyện trong quá khứ', en: 'Telling Stories in the Past' },
    lessons: [
      {
        title: { vi: 'Hỏi và phủ định ở quá khứ đơn (Did you…?)', en: 'Past Simple: Questions and Negatives' },
        intro: 'Bạn muốn hỏi bạn mình hôm qua đã làm gì và kể lại những việc bạn đã không làm. Bài này dạy câu hỏi với Did, câu phủ định didn’t và trả lời ngắn.',
        vocab: [
          ['yesterday', '/ˈjestədeɪ/', 'adverb', 'hôm qua', 'I called my mother yesterday.', 'Hôm qua tôi gọi cho mẹ.'],
          ['ago', '/əˈɡəʊ/', 'adverb', 'cách đây', 'I met him two years ago.', 'Tôi gặp anh ấy cách đây hai năm.'],
          ['last night', '/lɑːst naɪt/', 'phrase', 'tối qua', 'We stayed at home last night.', 'Tối qua chúng tôi ở nhà.'],
          ['finish', '/ˈfɪnɪʃ/', 'verb', 'kết thúc, xong', 'Did you finish your homework?', 'Bạn đã làm xong bài tập chưa?'],
          ['visit', '/ˈvɪzɪt/', 'verb', 'thăm, đến thăm', 'We visited my grandparents.', 'Chúng tôi đã đến thăm ông bà.'],
          ['stay', '/steɪ/', 'verb', 'ở lại', 'They stayed in a small hotel.', 'Họ ở trong một khách sạn nhỏ.'],
          ['decide', '/dɪˈsaɪd/', 'verb', 'quyết định', 'I decided to learn English.', 'Tôi đã quyết định học tiếng Anh.'],
          ['enjoy', '/ɪnˈdʒɔɪ/', 'verb', 'thích thú, tận hưởng', 'Did you enjoy the film?', 'Bạn có thích bộ phim không?'],
          ['arrive', '/əˈraɪv/', 'verb', 'đến nơi', 'The train arrived at nine.', 'Chuyến tàu đến lúc chín giờ.'],
          ['miss', '/mɪs/', 'verb', 'lỡ, nhớ', 'I missed the bus this morning.', 'Sáng nay tôi lỡ chuyến xe buýt.'],
          ['forget', '/fəˈɡet/', 'verb', 'quên', 'He forgot his umbrella.', 'Anh ấy đã quên chiếc ô.'],
          ['wonderful', '/ˈwʌndəfl/', 'adjective', 'tuyệt vời', 'It was a wonderful evening.', 'Đó là một buổi tối tuyệt vời.'],
        ],
        grammar: {
          title: 'Quá khứ đơn: Did / didn’t + động từ nguyên mẫu',
          explain: 'Câu hỏi quá khứ đơn: Did + chủ ngữ + động từ nguyên mẫu? (Did you enjoy the film?). Phủ định: didn’t + động từ nguyên mẫu (I didn’t finish). Sau did/didn’t động từ không chia lại. Trả lời ngắn: Yes, I did. / No, I didn’t. Hỏi chi tiết: What did you do yesterday?',
          examples: [
            ['Did you finish your homework? – Yes, I did.', 'Bạn làm xong bài tập chưa? – Rồi.'],
            ['I didn’t visit my grandparents last week.', 'Tuần trước tôi không đến thăm ông bà.'],
            ['What did you do yesterday?', 'Hôm qua bạn đã làm gì?'],
          ],
        },
        dialogue: {
          lines: [
            ['Mai', 'What did you do last night, Nam?', 'Tối qua bạn làm gì, Nam?'],
            ['Nam', 'I stayed at home. I didn’t go out.', 'Mình ở nhà. Mình không đi đâu.'],
            ['Mai', 'Did you finish your homework?', 'Bạn làm xong bài tập chưa?'],
            ['Nam', 'Yes, I did. Then I watched a wonderful film.', 'Rồi. Sau đó mình xem một bộ phim tuyệt vời.'],
          ],
        },
        reorder: [
          ['What|did|you|do|yesterday?', 'Hôm qua bạn đã làm gì?'],
          ['I|didn’t|visit|my|grandparents|last|week.', 'Tuần trước tôi không đến thăm ông bà.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi bạn có xem phim tối qua không.', source: 'you / watch / film / last night', pattern: 'Did + S + V?', answers: ['Did you watch a film last night?', 'Did you watch the film last night?', 'Did you watch a film last night'] },
          { prompt: 'Nói bạn không đến thăm ông bà.', source: 'I / visit / grandparents', pattern: 'S + didn’t + V', answers: ['I didn’t visit my grandparents.', "I didn't visit my grandparents.", 'I did not visit my grandparents.'] },
        ],
        tip: ['Chỉ một dấu quá khứ', 'Khi đã có did/didn’t thì động từ chính về nguyên mẫu: nói “Did you enjoy?”, không nói “Did you enjoyed?”.'],
      },
      {
        title: { vi: 'Lúc đó bạn đang làm gì? (quá khứ tiếp diễn)', en: 'What Were You Doing? Past Continuous' },
        intro: 'Bạn kể một sự việc xảy ra khi người khác đang làm gì đó, như “Khi tôi gọi, bạn đang ngủ”. Bài này dạy was / were + V-ing và liên từ when, while.',
        vocab: [
          ['while', '/waɪl/', 'conjunction', 'trong khi', 'I was cooking while he was reading.', 'Tôi đang nấu ăn trong khi anh ấy đọc sách.'],
          ['when', '/wen/', 'conjunction', 'khi', 'The phone rang when I was sleeping.', 'Điện thoại reo khi tôi đang ngủ.'],
          ['ring', '/rɪŋ/', 'verb', 'reo, rung chuông', 'The bell rings at eight.', 'Chuông reo lúc tám giờ.'],
          ['sleep', '/sliːp/', 'verb', 'ngủ', 'The baby was sleeping.', 'Em bé đang ngủ.'],
          ['wait', '/weɪt/', 'verb', 'chờ đợi', 'We were waiting for the bus.', 'Chúng tôi đang chờ xe buýt.'],
          ['fall', '/fɔːl/', 'verb', 'ngã, rơi', 'He fell while he was running.', 'Anh ấy ngã khi đang chạy.'],
          ['run', '/rʌn/', 'verb', 'chạy', 'She was running in the park.', 'Cô ấy đang chạy trong công viên.'],
          ['accident', '/ˈæksɪdənt/', 'noun', 'tai nạn', 'There was an accident near the school.', 'Đã có một vụ tai nạn gần trường.'],
          ['storm', '/stɔːm/', 'noun', 'cơn bão', 'A storm started at night.', 'Một cơn bão bắt đầu vào ban đêm.'],
          ['suddenly', '/ˈsʌdənli/', 'adverb', 'đột nhiên', 'Suddenly, the lights went out.', 'Đột nhiên, đèn tắt.'],
          ['noise', '/nɔɪz/', 'noun', 'tiếng ồn', 'I heard a loud noise.', 'Tôi nghe thấy một tiếng ồn lớn.'],
          ['neighbour', '/ˈneɪbə/', 'noun', 'hàng xóm', 'My neighbour was watching TV.', 'Người hàng xóm của tôi đang xem tivi.'],
        ],
        grammar: {
          title: 'Quá khứ tiếp diễn: was / were + V-ing',
          explain: 'Dùng thì quá khứ tiếp diễn cho việc đang diễn ra tại một thời điểm trong quá khứ: I was cooking at seven. Dùng “when” cho việc ngắn xen vào việc dài (I was sleeping when the phone rang) và “while” cho hai việc đang diễn ra cùng lúc (I was cooking while he was reading). Câu hỏi: What were you doing?',
          examples: [
            ['I was sleeping when the phone rang.', 'Tôi đang ngủ thì điện thoại reo.'],
            ['They were waiting while it was raining.', 'Họ đang chờ trong khi trời mưa.'],
            ['What were you doing at nine last night?', 'Chín giờ tối qua bạn đang làm gì?'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'Where were you at nine last night?', 'Chín giờ tối qua bạn ở đâu?'],
            ['Hoa', 'I was at home. I was cooking when I heard a loud noise.', 'Mình ở nhà. Mình đang nấu ăn thì nghe một tiếng ồn lớn.'],
            ['Tom', 'What was it?', 'Đó là gì vậy?'],
            ['Hoa', 'My neighbour was moving a table. Suddenly the lights went out!', 'Hàng xóm đang chuyển cái bàn. Đột nhiên đèn tắt!'],
          ],
        },
        reorder: [
          ['I|was|sleeping|when|the|phone|rang.', 'Tôi đang ngủ thì điện thoại reo.'],
          ['What|were|you|doing|at|nine|last|night?', 'Chín giờ tối qua bạn đang làm gì?'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn đang nấu ăn lúc bảy giờ.', source: 'I / cook / at seven', pattern: 'I was + V-ing', answers: ['I was cooking at seven.', 'I was cooking at seven o’clock.', 'I was cooking at seven'] },
          { prompt: 'Hỏi họ đang làm gì khi trời mưa.', source: 'they / do / when it rained', pattern: 'What were they doing…?', answers: ['What were they doing when it rained?', 'What were they doing when it started to rain?'] },
        ],
        tip: ['When và while', '“While” đi với việc kéo dài (while I was cooking), còn “when” thường đi với việc ngắn, xảy ra bất ngờ (when the phone rang).'],
      },
      {
        title: { vi: 'Kể một ngày đáng nhớ', en: 'A Memorable Day' },
        intro: 'Bạn kể cho bạn bè nghe về chuyến đi chơi hoặc sinh nhật khó quên. Bài này dạy các từ nối trình tự và cách kể chuyện mạch lạc bằng quá khứ đơn.',
        vocab: [
          ['first', '/fɜːst/', 'adverb', 'đầu tiên', 'First, we took a taxi to the beach.', 'Đầu tiên, chúng tôi đi taxi ra bãi biển.'],
          ['after that', '/ˈɑːftə ðæt/', 'phrase', 'sau đó', 'After that, we had lunch.', 'Sau đó chúng tôi ăn trưa.'],
          ['finally', '/ˈfaɪnəli/', 'adverb', 'cuối cùng', 'Finally, we went home.', 'Cuối cùng chúng tôi về nhà.'],
          ['in the end', '/ɪn ði end/', 'phrase', 'rốt cuộc', 'In the end, we won the game.', 'Rốt cuộc chúng tôi đã thắng trận.'],
          ['unfortunately', '/ʌnˈfɔːtʃənətli/', 'adverb', 'không may', 'Unfortunately, it rained all day.', 'Không may là trời mưa cả ngày.'],
          ['luckily', '/ˈlʌkɪli/', 'adverb', 'may mắn là', 'Luckily, we had an umbrella.', 'May mắn là chúng tôi có mang ô.'],
          ['suddenly', '/ˈsʌdənli/', 'adverb', 'đột nhiên', 'Suddenly, my phone rang.', 'Đột nhiên điện thoại tôi reo.'],
          ['surprise', '/səˈpraɪz/', 'noun', 'điều bất ngờ', 'The party was a big surprise.', 'Bữa tiệc là một bất ngờ lớn.'],
          ['remember', '/rɪˈmembə/', 'verb', 'nhớ', 'I remember that day very well.', 'Tôi nhớ ngày hôm đó rất rõ.'],
          ['trip', '/trɪp/', 'noun', 'chuyến đi', 'We took a trip to Hue.', 'Chúng tôi có một chuyến đi đến Huế.'],
          ['photo', '/ˈfəʊtəʊ/', 'noun', 'bức ảnh', 'I took many photos.', 'Tôi chụp rất nhiều ảnh.'],
          ['experience', '/ɪkˈspɪəriəns/', 'noun', 'trải nghiệm, kinh nghiệm', 'It was a great experience.', 'Đó là một trải nghiệm tuyệt vời.'],
        ],
        grammar: {
          title: 'Từ nối trình tự khi kể chuyện',
          explain: 'Để câu chuyện mạch lạc, dùng: first, then, after that, finally (chỉ trình tự); unfortunately, luckily (thái độ của người kể); suddenly (việc bất ngờ). Đặt từ nối ở đầu câu và thêm dấu phẩy. Giữ động từ ở thì quá khứ đơn, chỉ dùng quá khứ tiếp diễn để tả bối cảnh.',
          examples: [
            ['First, we took a taxi to the beach.', 'Đầu tiên, chúng tôi đi taxi ra bãi biển.'],
            ['Unfortunately, it rained all day.', 'Không may là trời mưa cả ngày.'],
            ['Finally, we went home and slept.', 'Cuối cùng, chúng tôi về nhà và đi ngủ.'],
          ],
        },
        dialogue: {
          lines: [
            ['Linh', 'Tell me about your trip to Hue.', 'Kể mình nghe về chuyến đi Huế của bạn đi.'],
            ['Sam', 'First, we visited the old city. After that, we had lunch.', 'Đầu tiên chúng mình thăm cố đô. Sau đó ăn trưa.'],
            ['Linh', 'Was the weather good?', 'Thời tiết tốt không?'],
            ['Sam', 'Unfortunately, it rained. But luckily we had an umbrella. It was a great experience.', 'Không may là trời mưa. Nhưng may là có ô. Đó là một trải nghiệm tuyệt vời.'],
          ],
        },
        reorder: [
          ['First,|we|took|a|taxi|to|the|beach.', 'Đầu tiên, chúng tôi đi taxi ra bãi biển.'],
          ['Unfortunately,|it|rained|all|day.', 'Không may là trời mưa cả ngày.'],
        ],
        grammarQ: [
          { prompt: 'Mở đầu câu chuyện: đầu tiên chúng tôi ăn sáng.', source: 'first / have breakfast', pattern: 'First, + S + V (quá khứ)', answers: ['First, we had breakfast.', 'First we had breakfast.', 'First, we had breakfast'] },
          { prompt: 'Nói may là bạn có ô.', source: 'luckily / umbrella', pattern: 'Luckily, + S + V', answers: ['Luckily, we had an umbrella.', 'Luckily, I had an umbrella.', 'Luckily we had an umbrella.'] },
        ],
        tip: ['Dấu phẩy sau từ nối', 'Sau first, finally, unfortunately… ở đầu câu cần dấu phẩy: “Finally, we went home.” Đây là lỗi viết rất dễ mắc.'],
      },
    ],
  },
  {
    level: 'A2',
    names: { vi: 'Số lượng, mua sắm và tiền bạc', en: 'Quantities, Shopping and Money' },
    lessons: [
      {
        title: { vi: 'Much, many, a few, a little', en: 'Much, Many, a Few, a Little' },
        intro: 'Bạn đang hỏi và nói về số lượng: có bao nhiêu người, bao nhiêu thời gian, tiền còn lại bao nhiêu. Bài này dạy how much / how many và các từ chỉ lượng.',
        vocab: [
          ['much', '/mʌtʃ/', 'determiner', 'nhiều (không đếm được)', 'We do not have much time.', 'Chúng ta không có nhiều thời gian.'],
          ['many', '/ˈmeni/', 'determiner', 'nhiều (đếm được)', 'How many students are there?', 'Có bao nhiêu học sinh?'],
          ['a few', '/ə fjuː/', 'determiner', 'một vài', 'I have a few friends here.', 'Tôi có một vài người bạn ở đây.'],
          ['a little', '/ə ˈlɪtl/', 'determiner', 'một chút', 'I speak a little French.', 'Tôi nói được một chút tiếng Pháp.'],
          ['enough', '/ɪˈnʌf/', 'determiner', 'đủ', 'Do we have enough chairs?', 'Chúng ta có đủ ghế không?'],
          ['plenty of', '/ˈplenti ɒv/', 'phrase', 'rất nhiều', 'There is plenty of food.', 'Có rất nhiều đồ ăn.'],
          ['time', '/taɪm/', 'noun', 'thời gian', 'I do not have much time today.', 'Hôm nay tôi không có nhiều thời gian.'],
          ['money', '/ˈmʌni/', 'noun', 'tiền', 'How much money do you need?', 'Bạn cần bao nhiêu tiền?'],
          ['people', '/ˈpiːpl/', 'noun', 'người, mọi người', 'Many people live in this city.', 'Nhiều người sống ở thành phố này.'],
          ['traffic', '/ˈtræfɪk/', 'noun', 'giao thông', 'There is too much traffic here.', 'Ở đây có quá nhiều xe cộ.'],
          ['empty', '/ˈempti/', 'adjective', 'trống rỗng', 'The fridge is almost empty.', 'Tủ lạnh gần như trống rỗng.'],
          ['full', '/fʊl/', 'adjective', 'đầy', 'The bus was full.', 'Chiếc xe buýt đã đầy người.'],
        ],
        grammar: {
          title: 'How much / How many; a few / a little',
          explain: 'Hỏi lượng với danh từ không đếm được: How much + danh từ? (How much money?). Với danh từ đếm được: How many + danh từ số nhiều? (How many people?). “A few” đi với danh từ đếm được số nhiều (a few friends), “a little” với danh từ không đếm được (a little time). Much thường dùng trong câu hỏi và phủ định; many dùng được ở cả khẳng định.',
          examples: [
            ['How many people are in your class?', 'Lớp bạn có bao nhiêu người?'],
            ['I do not have much money.', 'Tôi không có nhiều tiền.'],
            ['I have a few friends and a little free time.', 'Tôi có vài người bạn và chút thời gian rảnh.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'How many people are coming to the party?', 'Có bao nhiêu người đến bữa tiệc?'],
            ['Tom', 'About twenty. Do we have enough chairs?', 'Khoảng hai mươi. Chúng ta có đủ ghế không?'],
            ['Anna', 'We have a few. And there is plenty of food.', 'Có một ít. Và có rất nhiều đồ ăn.'],
            ['Tom', 'How much time do we have?', 'Chúng ta còn bao nhiêu thời gian?'],
          ],
        },
        reorder: [
          ['How|many|people|are|in|your|class?', 'Lớp bạn có bao nhiêu người?'],
          ['I|do|not|have|much|money.', 'Tôi không có nhiều tiền.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi có bao nhiêu học sinh (đếm được).', source: 'students', pattern: 'How many + danh từ số nhiều?', answers: ['How many students are there?', 'How many students are there', 'How many students?'] },
          { prompt: 'Hỏi cần bao nhiêu tiền (không đếm được).', source: 'money / need', pattern: 'How much + danh từ?', answers: ['How much money do you need?', 'How much money do you need', 'How much money?'] },
        ],
        tip: ['A few và few', '“A few” mang nghĩa tích cực (có một ít, đủ dùng), còn “few” không có “a” mang nghĩa gần như không có. Tương tự a little / little.'],
      },
      {
        title: { vi: 'Mua quần áo: cỡ, thử đồ, quá… / đủ…', en: 'Shopping for Clothes' },
        intro: 'Bạn vào cửa hàng và muốn hỏi cỡ khác, thử đồ hoặc nói chiếc áo quá chật. Bài này dạy các câu trong cửa hàng và cấu trúc too / enough.',
        vocab: [
          ['size', '/saɪz/', 'noun', 'cỡ, kích cỡ', 'What size do you wear?', 'Bạn mặc cỡ nào?'],
          ['try on', '/traɪ ɒn/', 'phrasal verb', 'thử (đồ)', 'Can I try on this jacket?', 'Tôi thử chiếc áo khoác này được không?'],
          ['fitting room', '/ˈfɪtɪŋ ruːm/', 'noun', 'phòng thử đồ', 'The fitting room is over there.', 'Phòng thử đồ ở đằng kia.'],
          ['tight', '/taɪt/', 'adjective', 'chật', 'These jeans are too tight.', 'Chiếc quần bò này quá chật.'],
          ['loose', '/luːs/', 'adjective', 'rộng', 'The shirt is a bit loose.', 'Chiếc áo hơi rộng.'],
          ['cheap', '/tʃiːp/', 'adjective', 'rẻ', 'This bag is cheap.', 'Chiếc túi này rẻ.'],
          ['expensive', '/ɪkˈspensɪv/', 'adjective', 'đắt', 'That coat is too expensive.', 'Chiếc áo khoác kia quá đắt.'],
          ['discount', '/ˈdɪskaʊnt/', 'noun', 'giảm giá', 'There is a ten percent discount.', 'Có giảm giá mười phần trăm.'],
          ['receipt', '/rɪˈsiːt/', 'noun', 'biên lai', 'Keep the receipt, please.', 'Hãy giữ lại biên lai.'],
          ['change', '/tʃeɪndʒ/', 'noun', 'tiền thừa, tiền lẻ', 'Here is your change.', 'Đây là tiền thối của bạn.'],
          ['suit', '/suːt/', 'verb', 'hợp với', 'Blue really suits you.', 'Màu xanh rất hợp với bạn.'],
          ['fit', '/fɪt/', 'verb', 'vừa vặn', 'These shoes do not fit me.', 'Đôi giày này không vừa với tôi.'],
        ],
        grammar: {
          title: 'too + tính từ / tính từ + enough',
          explain: '“Too” + tính từ nghĩa là quá mức, thường mang ý tiêu cực: The jeans are too tight. “Tính từ + enough” nghĩa là đủ: The shirt is big enough. Phủ định “not + tính từ + enough” nghĩa là chưa đủ: These shoes are not big enough. Hỏi người bán: Do you have this in a bigger size?',
          examples: [
            ['These jeans are too tight.', 'Chiếc quần bò này quá chật.'],
            ['The jacket is not big enough.', 'Chiếc áo khoác chưa đủ rộng.'],
            ['Do you have this in a bigger size?', 'Cửa hàng có cỡ lớn hơn không?'],
          ],
        },
        dialogue: {
          lines: [
            ['Seller', 'Can I help you?', 'Tôi giúp gì được bạn?'],
            ['Mai', 'Yes, can I try on this dress? What size is it?', 'Vâng, tôi thử chiếc váy này được không? Nó là cỡ nào?'],
            ['Seller', 'It is medium. The fitting room is over there.', 'Cỡ vừa. Phòng thử đồ ở đằng kia.'],
            ['Mai', 'It is too tight. Do you have a bigger size? And is there a discount?', 'Nó chật quá. Có cỡ lớn hơn không? Và có giảm giá không?'],
          ],
        },
        reorder: [
          ['These|jeans|are|too|tight.', 'Chiếc quần bò này quá chật.'],
          ['Can|I|try|on|this|dress?', 'Tôi thử chiếc váy này được không?'],
        ],
        grammarQ: [
          { prompt: 'Nói chiếc áo khoác quá đắt.', source: 'coat / expensive', pattern: 'too + tính từ', answers: ['That coat is too expensive.', 'The coat is too expensive.', 'This coat is too expensive.'] },
          { prompt: 'Nói đôi giày chưa đủ lớn.', source: 'shoes / big', pattern: 'not + tính từ + enough', answers: ['The shoes are not big enough.', 'These shoes are not big enough.', 'The shoes aren’t big enough.', "The shoes aren't big enough."] },
        ],
        tip: ['Enough đứng sau tính từ', 'Với tính từ, “enough” đứng sau: big enough, không phải “enough big”. Với danh từ thì đứng trước: enough money.'],
      },
      {
        title: { vi: 'Tiền bạc, ngân hàng và giá cả', en: 'Money and Prices' },
        intro: 'Bạn mở tài khoản ngân hàng hoặc đổi tiền khi đi du lịch. Bài này dạy các từ về tiền bạc, cách hỏi phí và cách nói số tiền lớn.',
        vocab: [
          ['account', '/əˈkaʊnt/', 'noun', 'tài khoản', 'I want to open a bank account.', 'Tôi muốn mở một tài khoản ngân hàng.'],
          ['save', '/seɪv/', 'verb', 'tiết kiệm', 'I save fifty dollars every month.', 'Tháng nào tôi cũng tiết kiệm năm mươi đô-la.'],
          ['spend', '/spend/', 'verb', 'tiêu', 'She spends too much on clothes.', 'Cô ấy tiêu quá nhiều vào quần áo.'],
          ['cost', '/kɒst/', 'verb', 'có giá', 'How much does this ticket cost?', 'Vé này có giá bao nhiêu?'],
          ['price', '/praɪs/', 'noun', 'giá', 'The price of rice is going up.', 'Giá gạo đang tăng lên.'],
          ['card', '/kɑːd/', 'noun', 'thẻ', 'Can I pay by card?', 'Tôi trả bằng thẻ được không?'],
          ['ATM', '/ˌeɪ tiː ˈem/', 'noun', 'máy rút tiền', 'There is an ATM near the station.', 'Có một máy rút tiền gần nhà ga.'],
          ['exchange', '/ɪksˈtʃeɪndʒ/', 'verb', 'đổi (tiền)', 'I want to exchange dollars.', 'Tôi muốn đổi đô-la.'],
          ['rate', '/reɪt/', 'noun', 'tỷ giá, mức giá', 'What is the exchange rate today?', 'Tỷ giá hôm nay là bao nhiêu?'],
          ['fee', '/fiː/', 'noun', 'phí', 'There is a small fee.', 'Có một khoản phí nhỏ.'],
          ['borrow', '/ˈbɒrəʊ/', 'verb', 'mượn', 'He borrowed money from a friend.', 'Anh ấy vay tiền của một người bạn.'],
          ['salary', '/ˈsæləri/', 'noun', 'lương', 'My salary is paid on the first of the month.', 'Lương của tôi được trả vào đầu tháng.'],
        ],
        grammar: {
          title: 'Hỏi giá và nói số tiền',
          explain: 'Hỏi giá: How much does it cost? / How much is it? Nói số tiền: số + đơn vị (twenty dollars, fifty thousand dong). Với số lớn dùng thousand, million, và không thêm -s: five thousand, two million. Hỏi tính năng: Is there a fee? Do you take cards?',
          examples: [
            ['How much does this ticket cost? – Twenty dollars.', 'Vé này giá bao nhiêu? – Hai mươi đô-la.'],
            ['I save two million dong a month.', 'Mỗi tháng tôi tiết kiệm hai triệu đồng.'],
            ['Is there a fee for this account?', 'Tài khoản này có tính phí không?'],
          ],
        },
        dialogue: {
          lines: [
            ['Clerk', 'Good morning. How can I help you?', 'Chào buổi sáng. Tôi giúp gì được bạn?'],
            ['Nam', 'I want to open an account. Is there a fee?', 'Tôi muốn mở một tài khoản. Có mất phí không?'],
            ['Clerk', 'No, there is no fee. You can use the ATM too.', 'Không mất phí. Bạn cũng dùng được máy rút tiền.'],
            ['Nam', 'Great. I want to save some money every month.', 'Tuyệt. Tôi muốn tiết kiệm một ít tiền mỗi tháng.'],
          ],
        },
        reorder: [
          ['How|much|does|this|ticket|cost?', 'Vé này giá bao nhiêu?'],
          ['I|want|to|open|a|bank|account.', 'Tôi muốn mở một tài khoản ngân hàng.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi vé có giá bao nhiêu.', source: 'ticket / cost', pattern: 'How much does … cost?', answers: ['How much does the ticket cost?', 'How much does this ticket cost?', 'How much does a ticket cost?'] },
          { prompt: 'Nói bạn tiết kiệm năm mươi đô-la mỗi tháng.', source: 'save / fifty dollars / month', pattern: 'I save … every month', answers: ['I save fifty dollars every month.', 'I save fifty dollars a month.', 'I save fifty dollars every month'] },
        ],
        tip: ['Cost không chia như spend', '“Cost” là vật có giá (The book costs ten dollars), còn “spend” là người tiêu tiền (I spend ten dollars). Đừng đảo chủ ngữ.'],
      },
    ],
  },
  {
    level: 'A2',
    names: { vi: 'Du lịch và di chuyển', en: 'Travel and Getting Around' },
    lessons: [
      {
        title: { vi: 'Ở sân bay và ga tàu', en: 'At the Airport and Station' },
        intro: 'Bạn mua vé, làm thủ tục lên máy bay và hỏi giờ khởi hành. Bài này dạy từ vựng về sân bay, ga tàu và các thông báo thường gặp.',
        vocab: [
          ['ticket', '/ˈtɪkɪt/', 'noun', 'vé', 'I need two tickets to Hue.', 'Tôi cần hai vé đi Huế.'],
          ['flight', '/flaɪt/', 'noun', 'chuyến bay', 'My flight leaves at six.', 'Chuyến bay của tôi cất cánh lúc sáu giờ.'],
          ['airport', '/ˈeəpɔːt/', 'noun', 'sân bay', 'The airport is far from the city.', 'Sân bay ở xa thành phố.'],
          ['platform', '/ˈplætfɔːm/', 'noun', 'sân ga', 'The train leaves from platform five.', 'Tàu rời đi từ sân ga số năm.'],
          ['luggage', '/ˈlʌɡɪdʒ/', 'noun', 'hành lý', 'I have only one piece of luggage.', 'Tôi chỉ có một kiện hành lý.'],
          ['gate', '/ɡeɪt/', 'noun', 'cổng lên máy bay', 'Go to gate twelve.', 'Hãy đến cổng số mười hai.'],
          ['delay', '/dɪˈleɪ/', 'noun', 'sự chậm trễ', 'There is a delay of one hour.', 'Có sự chậm trễ một tiếng.'],
          ['departure', '/dɪˈpɑːtʃə/', 'noun', 'giờ khởi hành', 'The departure is at nine.', 'Giờ khởi hành là chín giờ.'],
          ['return', '/rɪˈtɜːn/', 'adjective', 'khứ hồi', 'A return ticket, please.', 'Cho tôi một vé khứ hồi.'],
          ['one-way', '/ˌwʌn ˈweɪ/', 'adjective', 'một chiều', 'I want a one-way ticket.', 'Tôi muốn một vé một chiều.'],
          ['check-in', '/ˈtʃek ɪn/', 'noun', 'quầy làm thủ tục', 'The check-in desk is on the left.', 'Quầy làm thủ tục ở bên trái.'],
          ['board', '/bɔːd/', 'verb', 'lên (tàu, máy bay)', 'Passengers can board now.', 'Hành khách có thể lên máy bay bây giờ.'],
        ],
        grammar: {
          title: 'Câu hỏi lịch sự khi đi lại',
          explain: 'Khi mua vé hoặc hỏi thông tin, dùng: What time does the train leave? Which platform is it? I would like a return ticket to… Is there a delay? Thì hiện tại đơn được dùng cho lịch trình cố định (The flight leaves at six).',
          examples: [
            ['What time does the train leave?', 'Mấy giờ tàu chạy?'],
            ['I would like a return ticket to Hue.', 'Tôi muốn một vé khứ hồi đi Huế.'],
            ['The flight leaves at six and arrives at eight.', 'Chuyến bay cất cánh lúc sáu giờ và hạ cánh lúc tám giờ.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'Excuse me, what time does the flight leave?', 'Xin lỗi, mấy giờ chuyến bay cất cánh?'],
            ['Clerk', 'At six. But there is a delay of one hour.', 'Lúc sáu giờ. Nhưng bị chậm một tiếng.'],
            ['Tom', 'OK. Where is the check-in desk?', 'Được. Quầy làm thủ tục ở đâu?'],
            ['Clerk', 'On the left. You can board at gate twelve.', 'Bên trái. Bạn lên máy bay ở cổng số mười hai.'],
          ],
        },
        reorder: [
          ['What|time|does|the|train|leave?', 'Mấy giờ tàu chạy?'],
          ['I|would|like|a|return|ticket|to|Hue.', 'Tôi muốn một vé khứ hồi đi Huế.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi mấy giờ tàu chạy.', source: 'train / leave', pattern: 'What time does … leave?', answers: ['What time does the train leave?', 'What time does the train leave', 'What time does it leave?'] },
          { prompt: 'Nói bạn muốn vé một chiều.', source: 'one-way ticket', pattern: 'I would like a … ticket', answers: ['I would like a one-way ticket.', 'I’d like a one-way ticket.', "I'd like a one-way ticket.", 'I want a one-way ticket.'] },
        ],
        tip: ['Luggage không đếm được', 'Luggage không có số nhiều: nói “two pieces of luggage”, không nói “two luggages”.'],
      },
      {
        title: { vi: 'Đi tàu xe công cộng và taxi', en: 'Public Transport and Taxis' },
        intro: 'Bạn đi xe buýt, tàu điện hoặc gọi taxi trong thành phố lạ. Bài này dạy hỏi tuyến, mua vé, xuống đúng trạm và nói địa chỉ với tài xế.',
        vocab: [
          ['bus stop', '/ˈbʌs stɒp/', 'noun', 'trạm xe buýt', 'The bus stop is on the corner.', 'Trạm xe buýt ở góc đường.'],
          ['underground', '/ˈʌndəɡraʊnd/', 'noun', 'tàu điện ngầm', 'I go to work by underground.', 'Tôi đi làm bằng tàu điện ngầm.'],
          ['route', '/ruːt/', 'noun', 'tuyến đường', 'Which route goes to the airport?', 'Tuyến nào đi đến sân bay?'],
          ['stop', '/stɒp/', 'noun', 'điểm dừng', 'Get off at the next stop.', 'Hãy xuống ở điểm dừng tiếp theo.'],
          ['get on', '/ɡet ɒn/', 'phrasal verb', 'lên (xe)', 'Get on the number ten bus.', 'Hãy lên xe buýt số mười.'],
          ['get off', '/ɡet ɒf/', 'phrasal verb', 'xuống (xe)', 'Where do I get off?', 'Tôi xuống xe ở đâu?'],
          ['taxi', '/ˈtæksi/', 'noun', 'xe taxi', 'Let us take a taxi.', 'Chúng ta đi taxi nhé.'],
          ['meter', '/ˈmiːtə/', 'noun', 'đồng hồ tính tiền', 'Please use the meter.', 'Làm ơn bật đồng hồ tính tiền.'],
          ['address', '/əˈdres/', 'noun', 'địa chỉ', 'What is the address?', 'Địa chỉ là gì?'],
          ['traffic jam', '/ˈtræfɪk dʒæm/', 'noun', 'tắc đường', 'We were in a traffic jam for an hour.', 'Chúng tôi bị tắc đường một tiếng.'],
          ['far', '/fɑː/', 'adverb', 'xa', 'Is it far from here?', 'Chỗ đó có xa đây không?'],
          ['minute', '/ˈmɪnɪt/', 'noun', 'phút', 'It takes ten minutes.', 'Mất mười phút.'],
        ],
        grammar: {
          title: 'It takes… / How long does it take?',
          explain: 'Nói thời gian di chuyển: It takes + thời gian + to + động từ (It takes ten minutes to walk). Hỏi: How long does it take? Nói phương tiện: by bus, by taxi, on foot. Khi chỉ đường cho tài xế: Please go to + địa chỉ.',
          examples: [
            ['How long does it take to get to the airport?', 'Đến sân bay mất bao lâu?'],
            ['It takes forty minutes by bus.', 'Mất bốn mươi phút đi bằng xe buýt.'],
            ['Please take me to this address.', 'Làm ơn đưa tôi đến địa chỉ này.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'Excuse me, which bus goes to the airport?', 'Xin lỗi, xe buýt nào đi sân bay?'],
            ['Local', 'Number ten. Get on at that bus stop.', 'Số mười. Hãy lên xe ở trạm kia.'],
            ['Anna', 'How long does it take?', 'Mất bao lâu?'],
            ['Local', 'About forty minutes. Get off at the last stop.', 'Khoảng bốn mươi phút. Hãy xuống ở trạm cuối.'],
          ],
        },
        reorder: [
          ['How|long|does|it|take?', 'Mất bao lâu?'],
          ['It|takes|forty|minutes|by|bus.', 'Mất bốn mươi phút đi bằng xe buýt.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi đến sân bay mất bao lâu.', source: 'airport', pattern: 'How long does it take to get to …?', answers: ['How long does it take to get to the airport?', 'How long does it take to get to the airport'] },
          { prompt: 'Nói đi bằng xe buýt mất bốn mươi phút.', source: 'forty minutes / bus', pattern: 'It takes … by …', answers: ['It takes forty minutes by bus.', 'It takes forty minutes by bus'] },
        ],
        tip: ['By hay on?', 'Dùng “by” với phương tiện nói chung (by bus, by taxi), nhưng nói “on foot” khi đi bộ và “on the bus” khi nói đang ở trên xe.'],
      },
      {
        title: { vi: 'Miêu tả thành phố và kỳ nghỉ', en: 'Describing Cities and Holidays' },
        intro: 'Bạn kể cho bạn bè nghe về thành phố mình đã đến và hỏi lời khuyên khi du lịch. Bài này dạy tính từ miêu tả nơi chốn và nhắc lại so sánh.',
        vocab: [
          ['crowded', '/ˈkraʊdɪd/', 'adjective', 'đông đúc', 'The market is crowded on Sunday.', 'Chợ đông đúc vào chủ nhật.'],
          ['quiet', '/ˈkwaɪət/', 'adjective', 'yên tĩnh', 'The village is quiet and clean.', 'Ngôi làng yên tĩnh và sạch sẽ.'],
          ['noisy', '/ˈnɔɪzi/', 'adjective', 'ồn ào', 'The city centre is noisy.', 'Trung tâm thành phố ồn ào.'],
          ['modern', '/ˈmɒdn/', 'adjective', 'hiện đại', 'Singapore is a modern city.', 'Singapore là một thành phố hiện đại.'],
          ['historic', '/hɪˈstɒrɪk/', 'adjective', 'có tính lịch sử', 'Hue is a historic city.', 'Huế là một thành phố lịch sử.'],
          ['beach', '/biːtʃ/', 'noun', 'bãi biển', 'The beach is beautiful in the morning.', 'Bãi biển rất đẹp vào buổi sáng.'],
          ['mountain', '/ˈmaʊntɪn/', 'noun', 'ngọn núi', 'We climbed a mountain.', 'Chúng tôi đã leo một ngọn núi.'],
          ['island', '/ˈaɪlənd/', 'noun', 'hòn đảo', 'Phu Quoc is an island.', 'Phú Quốc là một hòn đảo.'],
          ['sightseeing', '/ˈsaɪtsiːɪŋ/', 'noun', 'tham quan', 'We went sightseeing in Hanoi.', 'Chúng tôi đi tham quan ở Hà Nội.'],
          ['souvenir', '/ˌsuːvəˈnɪə/', 'noun', 'quà lưu niệm', 'I bought a souvenir for my mother.', 'Tôi đã mua một món quà lưu niệm cho mẹ.'],
          ['tourist', '/ˈtʊərɪst/', 'noun', 'khách du lịch', 'Many tourists visit this temple.', 'Nhiều khách du lịch đến thăm ngôi đền này.'],
          ['recommend', '/ˌrekəˈmend/', 'verb', 'giới thiệu, khuyên dùng', 'I recommend this restaurant.', 'Tôi giới thiệu nhà hàng này.'],
        ],
        grammar: {
          title: 'Miêu tả bằng tính từ, so sánh và recommend',
          explain: 'Dùng tính từ sau to be để tả nơi chốn: The city is crowded. Kết hợp so sánh hơn: Hanoi is more crowded than Hue; the beach is quieter than the city. Xin lời khuyên: What do you recommend? Đưa lời khuyên: I recommend + danh từ / I recommend visiting + địa điểm.',
          examples: [
            ['Hue is quieter than Hanoi.', 'Huế yên tĩnh hơn Hà Nội.'],
            ['What do you recommend in Da Nang?', 'Bạn giới thiệu gì ở Đà Nẵng?'],
            ['I recommend visiting the old town.', 'Tôi khuyên bạn nên tham quan khu phố cổ.'],
          ],
        },
        dialogue: {
          lines: [
            ['Linh', 'How was your holiday in Da Nang?', 'Kỳ nghỉ ở Đà Nẵng của bạn thế nào?'],
            ['Sam', 'Wonderful. The beach is beautiful and quieter than Nha Trang.', 'Tuyệt vời. Bãi biển rất đẹp và yên tĩnh hơn Nha Trang.'],
            ['Linh', 'What do you recommend?', 'Bạn giới thiệu gì?'],
            ['Sam', 'I recommend sightseeing in the old town and buying a souvenir.', 'Mình khuyên đi tham quan phố cổ và mua một món quà lưu niệm.'],
          ],
        },
        reorder: [
          ['Hue|is|quieter|than|Hanoi.', 'Huế yên tĩnh hơn Hà Nội.'],
          ['What|do|you|recommend|in|Da|Nang?', 'Bạn giới thiệu gì ở Đà Nẵng?'],
        ],
        grammarQ: [
          { prompt: 'So sánh: Huế yên tĩnh hơn Hà Nội.', source: 'Hue / quiet / Hanoi', pattern: '… is quieter than …', answers: ['Hue is quieter than Hanoi.', 'Hue is quieter than Hanoi'] },
          { prompt: 'Giới thiệu nhà hàng này.', source: 'this restaurant', pattern: 'I recommend + danh từ', answers: ['I recommend this restaurant.', 'I recommend this restaurant'] },
        ],
        tip: ['Hỏi lời khuyên', '“What do you recommend?” là câu hỏi rất hữu ích ở nhà hàng, khách sạn và quán cà phê, nghe lịch sự hơn “What is good?”.'],
      },
    ],
  },
];
