import type { UnitSpec } from '../types.ts';

/** English A1 — extension units (5–6): dates and weather, clothes, likes and feelings, jobs. */
export const EN_A1_EXTRA_UNITS: UnitSpec[] = [
  {
    level: 'A1',
    names: { vi: 'Thời gian, thời tiết và quần áo', en: 'Dates, Weather and Clothes' },
    lessons: [
      {
        title: { vi: 'Thứ, tháng và ngày sinh nhật', en: 'Days, Months and Birthdays' },
        intro: 'Bạn muốn hẹn bạn bè vào thứ Bảy hoặc hỏi sinh nhật của ai đó vào tháng nào. Sau bài này bạn nói được thứ, tháng, ngày và dùng giới từ on / in cho đúng.',
        vocab: [
          ['Monday', '/ˈmʌndeɪ/', 'noun', 'thứ Hai', 'I have English on Monday.', 'Tôi có tiết tiếng Anh vào thứ Hai.'],
          ['Saturday', '/ˈsætədeɪ/', 'noun', 'thứ Bảy', 'We play football on Saturday.', 'Chúng tôi chơi bóng đá vào thứ Bảy.'],
          ['Sunday', '/ˈsʌndeɪ/', 'noun', 'chủ nhật', 'Sunday is a day for family.', 'Chủ nhật là ngày dành cho gia đình.'],
          ['week', '/wiːk/', 'noun', 'tuần', 'There are seven days in a week.', 'Một tuần có bảy ngày.'],
          ['month', '/mʌnθ/', 'noun', 'tháng', 'This month is very busy.', 'Tháng này rất bận.'],
          ['year', '/jɪə/', 'noun', 'năm', 'I am twenty years old this year.', 'Năm nay tôi hai mươi tuổi.'],
          ['January', '/ˈdʒænjuəri/', 'noun', 'tháng Một', 'Tet is in January or February.', 'Tết rơi vào tháng Một hoặc tháng Hai.'],
          ['December', '/dɪˈsembə/', 'noun', 'tháng Mười hai', 'My birthday is in December.', 'Sinh nhật tôi vào tháng Mười hai.'],
          ['birthday', '/ˈbɜːθdeɪ/', 'noun', 'sinh nhật', 'When is your birthday?', 'Sinh nhật bạn là khi nào?'],
          ['today', '/təˈdeɪ/', 'adverb', 'hôm nay', 'Today is Friday.', 'Hôm nay là thứ Sáu.'],
          ['tomorrow', '/təˈmɒrəʊ/', 'adverb', 'ngày mai', 'See you tomorrow.', 'Hẹn mai gặp lại.'],
          ['party', '/ˈpɑːti/', 'noun', 'bữa tiệc', 'Come to my party on Saturday.', 'Hãy đến bữa tiệc của tôi vào thứ Bảy.'],
        ],
        grammar: {
          title: 'Giới từ chỉ thời gian: on / in',
          explain: 'Dùng “on” trước thứ và ngày cụ thể (on Monday, on 5th May). Dùng “in” trước tháng, năm, mùa (in June, in 2027, in summer). Hỏi ngày: What day is it today? Hỏi sinh nhật: When is your birthday? – It is on / in …',
          examples: [
            ['I have a class on Monday.', 'Tôi có một tiết học vào thứ Hai.'],
            ['My birthday is in December.', 'Sinh nhật tôi vào tháng Mười hai.'],
            ['The party is on Saturday.', 'Bữa tiệc diễn ra vào thứ Bảy.'],
          ],
        },
        dialogue: {
          lines: [
            ['Lan', 'When is your birthday, Tom?', 'Sinh nhật của bạn là khi nào, Tom?'],
            ['Tom', 'It is in December. And yours?', 'Vào tháng Mười hai. Còn của bạn?'],
            ['Lan', 'Mine is in January. I have a party on Saturday.', 'Của mình vào tháng Một. Mình có một bữa tiệc vào thứ Bảy.'],
            ['Tom', 'Great! See you on Saturday.', 'Tuyệt! Hẹn gặp bạn vào thứ Bảy.'],
          ],
        },
        reorder: [
          ['My|birthday|is|in|December.', 'Sinh nhật tôi vào tháng Mười hai.'],
          ['I|have|English|on|Monday.', 'Tôi có tiết tiếng Anh vào thứ Hai.'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn có buổi học vào thứ Hai bằng “on”.', source: 'a class / Monday', pattern: 'I have a class on + thứ', answers: ['I have a class on Monday.', 'I have a class on Monday'] },
          { prompt: 'Nói sinh nhật bạn vào tháng Mười hai.', source: 'My birthday / December', pattern: 'My birthday is in + tháng', answers: ['My birthday is in December.', 'My birthday is in December'] },
        ],
        tip: ['Viết hoa thứ và tháng', 'Trong tiếng Anh, tên thứ và tháng luôn viết hoa chữ cái đầu: Monday, December. Tiếng Việt thì không, nên người học dễ quên.'],
      },
      {
        title: { vi: 'Thời tiết và bốn mùa', en: 'Weather and Seasons' },
        intro: 'Người Anh rất hay bắt chuyện bằng thời tiết. Bài này giúp bạn nói trời nắng, mưa, lạnh hay nóng và hỏi “How is the weather?” một cách tự nhiên.',
        vocab: [
          ['weather', '/ˈweðə/', 'noun', 'thời tiết', 'The weather is nice today.', 'Hôm nay thời tiết đẹp.'],
          ['sunny', '/ˈsʌni/', 'adjective', 'có nắng', 'It is sunny in Da Nang.', 'Ở Đà Nẵng trời nắng.'],
          ['rainy', '/ˈreɪni/', 'adjective', 'có mưa', 'It is a rainy day.', 'Hôm nay là một ngày mưa.'],
          ['cloudy', '/ˈklaʊdi/', 'adjective', 'nhiều mây', 'It is cloudy this morning.', 'Sáng nay trời nhiều mây.'],
          ['windy', '/ˈwɪndi/', 'adjective', 'có gió', 'It is windy at the beach.', 'Ở bãi biển có gió.'],
          ['hot', '/hɒt/', 'adjective', 'nóng', 'It is hot in summer.', 'Mùa hè trời nóng.'],
          ['cold', '/kəʊld/', 'adjective', 'lạnh', 'It is cold in winter.', 'Mùa đông trời lạnh.'],
          ['rain', '/reɪn/', 'noun', 'mưa', 'I like the rain.', 'Tôi thích mưa.'],
          ['spring', '/sprɪŋ/', 'noun', 'mùa xuân', 'Flowers come out in spring.', 'Hoa nở vào mùa xuân.'],
          ['summer', '/ˈsʌmə/', 'noun', 'mùa hè', 'We go to the sea in summer.', 'Chúng tôi đi biển vào mùa hè.'],
          ['winter', '/ˈwɪntə/', 'noun', 'mùa đông', 'Winter is very cold here.', 'Mùa đông ở đây rất lạnh.'],
          ['umbrella', '/ʌmˈbrelə/', 'noun', 'cái ô', 'Take an umbrella today.', 'Hôm nay hãy mang theo ô.'],
        ],
        grammar: {
          title: 'It is + tính từ thời tiết',
          explain: 'Khi nói về thời tiết, chủ ngữ luôn là “it” (không có nghĩa cụ thể): It is sunny. It is not cold. Hỏi: How is the weather? hoặc What is the weather like? Với danh từ chỉ hiện tượng có thể dùng It rains / It is raining.',
          examples: [
            ['How is the weather today? – It is sunny.', 'Hôm nay thời tiết thế nào? – Trời nắng.'],
            ['It is not cold in spring.', 'Mùa xuân trời không lạnh.'],
            ['It is hot and windy.', 'Trời nóng và có gió.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'How is the weather in Hanoi?', 'Thời tiết ở Hà Nội thế nào?'],
            ['Linh', 'It is cold and cloudy in winter.', 'Mùa đông trời lạnh và nhiều mây.'],
            ['Anna', 'And in summer?', 'Còn mùa hè thì sao?'],
            ['Linh', 'It is very hot. Take an umbrella, it is rainy too.', 'Rất nóng. Nhớ mang ô, trời cũng hay mưa.'],
          ],
        },
        reorder: [
          ['How|is|the|weather|today?', 'Hôm nay thời tiết thế nào?'],
          ['It|is|hot|in|summer.', 'Mùa hè trời nóng.'],
        ],
        grammarQ: [
          { prompt: 'Nói hôm nay trời có nắng.', source: 'sunny', pattern: 'It is + tính từ', answers: ['It is sunny.', 'It is sunny', 'It’s sunny.', "It's sunny."] },
          { prompt: 'Hỏi thời tiết hôm nay thế nào.', source: 'Thời tiết hôm nay?', pattern: 'How is the weather today?', answers: ['How is the weather today?', 'How is the weather today', 'What is the weather like today?'] },
        ],
        tip: ['“It” không có nghĩa', 'Trong câu “It is sunny”, “it” chỉ để giữ chỗ chủ ngữ. Đừng cố dịch “it” sang tiếng Việt; chỉ cần nói “Trời nắng”.'],
      },
      {
        title: { vi: 'Quần áo và màu sắc', en: 'Clothes and Colours' },
        intro: 'Bạn đang chọn đồ trong cửa hàng hoặc tả người bạn mặc gì. Bài này dạy tên quần áo, màu sắc và cách dùng this / that, these / those để chỉ đồ vật.',
        vocab: [
          ['shirt', '/ʃɜːt/', 'noun', 'áo sơ mi', 'He wears a white shirt.', 'Anh ấy mặc áo sơ mi trắng.'],
          ['dress', '/dres/', 'noun', 'váy liền', 'She has a red dress.', 'Cô ấy có một chiếc váy đỏ.'],
          ['jeans', '/dʒiːnz/', 'noun', 'quần bò', 'My jeans are blue.', 'Quần bò của tôi màu xanh.'],
          ['shoes', '/ʃuːz/', 'noun', 'giày', 'These shoes are new.', 'Đôi giày này mới.'],
          ['hat', '/hæt/', 'noun', 'mũ', 'I wear a hat in the sun.', 'Tôi đội mũ khi trời nắng.'],
          ['jacket', '/ˈdʒækɪt/', 'noun', 'áo khoác', 'Take your jacket, it is cold.', 'Hãy mang áo khoác, trời lạnh.'],
          ['wear', '/weə/', 'verb', 'mặc, đội, đeo', 'I wear a uniform to school.', 'Tôi mặc đồng phục đến trường.'],
          ['red', '/red/', 'adjective', 'màu đỏ', 'The bag is red.', 'Chiếc túi màu đỏ.'],
          ['blue', '/bluː/', 'adjective', 'màu xanh dương', 'The sky is blue.', 'Bầu trời màu xanh.'],
          ['black', '/blæk/', 'adjective', 'màu đen', 'I like black shoes.', 'Tôi thích giày màu đen.'],
          ['white', '/waɪt/', 'adjective', 'màu trắng', 'Her shirt is white.', 'Áo của cô ấy màu trắng.'],
          ['green', '/ɡriːn/', 'adjective', 'màu xanh lá', 'The tea is green.', 'Trà này màu xanh lá.'],
        ],
        grammar: {
          title: 'this / that / these / those',
          explain: '“This” (số ít, gần) và “these” (số nhiều, gần); “that” (số ít, xa) và “those” (số nhiều, xa). Hỏi: Is this your jacket? / Are those your shoes? Danh từ số nhiều thường thêm -s; jeans và shoes luôn dùng dạng số nhiều và đi với are.',
          examples: [
            ['This shirt is white.', 'Chiếc áo sơ mi này màu trắng.'],
            ['Those shoes are black.', 'Đôi giày kia màu đen.'],
            ['Are these your jeans?', 'Đây có phải quần bò của bạn không?'],
          ],
        },
        dialogue: {
          lines: [
            ['Seller', 'Hello. Can I help you?', 'Xin chào. Tôi giúp gì được bạn?'],
            ['Mai', 'Yes. I like that red dress.', 'Vâng. Tôi thích chiếc váy đỏ kia.'],
            ['Seller', 'This one? It is nice. Do you want a jacket too?', 'Chiếc này à? Rất đẹp. Bạn có muốn thêm áo khoác không?'],
            ['Mai', 'No, thank you. I wear a black jacket today.', 'Không, cảm ơn. Hôm nay tôi mặc áo khoác đen rồi.'],
          ],
        },
        reorder: [
          ['Those|shoes|are|black.', 'Đôi giày kia màu đen.'],
          ['I|wear|a|black|jacket|today.', 'Hôm nay tôi mặc áo khoác đen.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Chiếc áo sơ mi này màu trắng” với đồ ở gần.', source: 'shirt / white', pattern: 'This + danh từ + is + màu', answers: ['This shirt is white.', 'This shirt is white'] },
          { prompt: 'Nói “Đôi giày kia màu đen” với đồ ở xa.', source: 'shoes / black', pattern: 'Those + danh từ + are + màu', answers: ['Those shoes are black.', 'Those shoes are black'] },
        ],
        tip: ['Tính từ đứng trước danh từ', 'Tiếng Anh đặt màu trước danh từ: a red dress, không phải “a dress red”. Thứ tự này ngược với tiếng Việt, hãy luyện thành thói quen.'],
      },
    ],
  },
  {
    level: 'A1',
    names: { vi: 'Sở thích, cảm xúc và nghề nghiệp', en: 'Likes, Feelings and Jobs' },
    lessons: [
      {
        title: { vi: 'Thích và không thích', en: 'Likes and Dislikes' },
        intro: 'Bạn muốn nói mình thích món gì, môn thể thao nào và không thích điều gì. Bài này dạy like / love / hate + danh từ hoặc động từ thêm -ing.',
        vocab: [
          ['like', '/laɪk/', 'verb', 'thích', 'I like pizza.', 'Tôi thích pizza.'],
          ['love', '/lʌv/', 'verb', 'yêu, rất thích', 'I love music.', 'Tôi rất thích âm nhạc.'],
          ['hate', '/heɪt/', 'verb', 'ghét', 'I hate cold weather.', 'Tôi ghét thời tiết lạnh.'],
          ['music', '/ˈmjuːzɪk/', 'noun', 'âm nhạc', 'We listen to music after dinner.', 'Chúng tôi nghe nhạc sau bữa tối.'],
          ['film', '/fɪlm/', 'noun', 'bộ phim', 'This film is very funny.', 'Bộ phim này rất hài hước.'],
          ['football', '/ˈfʊtbɔːl/', 'noun', 'bóng đá', 'My brother plays football.', 'Anh trai tôi chơi bóng đá.'],
          ['swim', '/swɪm/', 'verb', 'bơi', 'I swim on Sunday morning.', 'Tôi đi bơi vào sáng chủ nhật.'],
          ['cook', '/kʊk/', 'verb', 'nấu ăn', 'My mother cooks very well.', 'Mẹ tôi nấu ăn rất giỏi.'],
          ['read', '/riːd/', 'verb', 'đọc', 'I read a book every night.', 'Tối nào tôi cũng đọc một cuốn sách.'],
          ['dance', '/dɑːns/', 'verb', 'nhảy, khiêu vũ', 'They dance at the party.', 'Họ nhảy ở bữa tiệc.'],
          ['funny', '/ˈfʌni/', 'adjective', 'hài hước', 'He is a funny teacher.', 'Thầy ấy là một giáo viên hài hước.'],
          ['boring', '/ˈbɔːrɪŋ/', 'adjective', 'chán, nhàm chán', 'The lesson is not boring.', 'Bài học không nhàm chán.'],
        ],
        grammar: {
          title: 'like / love / hate + danh từ hoặc V-ing',
          explain: 'Sau like, love, hate có thể dùng danh từ (I like music) hoặc động từ thêm -ing (I like swimming). Với he/she/it thêm -s vào động từ: She likes cooking. Phủ định dùng don’t / doesn’t + like: I don’t like boring films. Hỏi: Do you like football? – Yes, I do. / No, I don’t.',
          examples: [
            ['I like swimming and cooking.', 'Tôi thích bơi và nấu ăn.'],
            ['She does not like boring films.', 'Cô ấy không thích những bộ phim chán.'],
            ['Do you like football? – Yes, I do.', 'Bạn có thích bóng đá không? – Có, tôi thích.'],
          ],
        },
        dialogue: {
          lines: [
            ['Sam', 'Do you like films, Mai?', 'Bạn có thích xem phim không, Mai?'],
            ['Mai', 'Yes, I love funny films. Do you?', 'Có, mình rất thích phim hài. Còn bạn?'],
            ['Sam', 'I like films, but I like football more.', 'Mình thích phim nhưng thích bóng đá hơn.'],
            ['Mai', 'I hate football, it is boring!', 'Mình ghét bóng đá, nó chán lắm!'],
          ],
        },
        reorder: [
          ['I|like|swimming|and|cooking.', 'Tôi thích bơi và nấu ăn.'],
          ['Do|you|like|football?', 'Bạn có thích bóng đá không?'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn thích âm nhạc.', source: 'music', pattern: 'I like + danh từ', answers: ['I like music.', 'I like music'] },
          { prompt: 'Nói cô ấy không thích phim chán.', source: 'She / boring films', pattern: 'She does not like + danh từ', answers: ['She does not like boring films.', 'She doesn’t like boring films.', "She doesn't like boring films."] },
        ],
        tip: ['Love mạnh hơn like', 'Thang mức độ: hate < don’t like < like < love. Dùng “love” cho thứ bạn rất thích, đừng dùng cho mọi thứ nếu muốn nghe tự nhiên.'],
      },
      {
        title: { vi: 'Cảm xúc và sức khỏe cơ bản', en: 'Feelings and Feeling Ill' },
        intro: 'Bạn mệt, đói hoặc đau đầu và muốn nói cho người khác biết. Bài này dạy các tính từ cảm xúc, cách hỏi thăm “How are you?” và nói chỗ đau với have a / my … hurts.',
        vocab: [
          ['happy', '/ˈhæpi/', 'adjective', 'vui, hạnh phúc', 'I am happy today.', 'Hôm nay tôi vui.'],
          ['sad', '/sæd/', 'adjective', 'buồn', 'Why are you sad?', 'Sao bạn buồn vậy?'],
          ['tired', '/ˈtaɪəd/', 'adjective', 'mệt', 'I am tired after work.', 'Tôi mệt sau giờ làm.'],
          ['hungry', '/ˈhʌŋɡri/', 'adjective', 'đói', 'The children are hungry.', 'Bọn trẻ đang đói.'],
          ['thirsty', '/ˈθɜːsti/', 'adjective', 'khát', 'I am thirsty, I want water.', 'Tôi khát, tôi muốn uống nước.'],
          ['ill', '/ɪl/', 'adjective', 'ốm, bệnh', 'He is ill today.', 'Hôm nay anh ấy bị ốm.'],
          ['headache', '/ˈhedeɪk/', 'noun', 'đau đầu', 'I have a headache.', 'Tôi bị đau đầu.'],
          ['stomach', '/ˈstʌmək/', 'noun', 'dạ dày, bụng', 'My stomach hurts.', 'Bụng tôi đau.'],
          ['doctor', '/ˈdɒktə/', 'noun', 'bác sĩ', 'Go to the doctor.', 'Hãy đi khám bác sĩ.'],
          ['medicine', '/ˈmedsn/', 'noun', 'thuốc', 'Take the medicine twice a day.', 'Hãy uống thuốc hai lần mỗi ngày.'],
          ['rest', '/rest/', 'verb', 'nghỉ ngơi', 'You need to rest.', 'Bạn cần nghỉ ngơi.'],
          ['better', '/ˈbetə/', 'adjective', 'khá hơn', 'I feel better now.', 'Bây giờ tôi thấy khá hơn.'],
        ],
        grammar: {
          title: 'How are you? / I am + cảm xúc / I have a …',
          explain: 'Hỏi thăm: How are you? – I am fine / tired / ill. Với cơ thể đau, dùng “have a + bệnh” (I have a headache) hoặc “my + bộ phận + hurts” (My stomach hurts). Hỏi người khác: What is the matter? Tính từ cảm xúc đi sau động từ to be, không thêm động từ khác.',
          examples: [
            ['How are you? – I am tired.', 'Bạn khỏe không? – Tôi mệt.'],
            ['I have a headache.', 'Tôi bị đau đầu.'],
            ['My stomach hurts.', 'Bụng tôi đau.'],
          ],
        },
        dialogue: {
          lines: [
            ['Doctor', 'Hello. What is the matter?', 'Xin chào. Bạn bị làm sao?'],
            ['Nam', 'I am ill. I have a headache and my stomach hurts.', 'Tôi bị ốm. Tôi đau đầu và đau bụng.'],
            ['Doctor', 'Take this medicine and rest today.', 'Hãy uống thuốc này và nghỉ ngơi hôm nay.'],
            ['Nam', 'Thank you, doctor. I hope I feel better soon.', 'Cảm ơn bác sĩ. Hy vọng tôi sẽ sớm khỏe hơn.'],
          ],
        },
        reorder: [
          ['I|have|a|headache.', 'Tôi bị đau đầu.'],
          ['What|is|the|matter?', 'Bạn bị làm sao?'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn bị đau đầu.', source: 'headache', pattern: 'I have a + bệnh', answers: ['I have a headache.', 'I have a headache'] },
          { prompt: 'Nói bạn đang mệt.', source: 'tired', pattern: 'I am + tính từ', answers: ['I am tired.', 'I am tired', 'I’m tired.', "I'm tired."] },
        ],
        tip: ['Hurts là động từ', '“My stomach hurts” dùng động từ hurt, không dùng “am”. Đừng nói “My stomach is hurt” — câu này có nghĩa là bụng bị làm đau do tác động bên ngoài.'],
      },
      {
        title: { vi: 'Nghề nghiệp và nơi làm việc', en: 'Jobs and Workplaces' },
        intro: 'Người mới gặp thường hỏi “What do you do?”. Bài này giúp bạn nói nghề nghiệp, nơi làm việc và hỏi lại bằng mẫu Where do you work?',
        vocab: [
          ['job', '/dʒɒb/', 'noun', 'công việc', 'I have a new job.', 'Tôi có một công việc mới.'],
          ['work', '/wɜːk/', 'verb', 'làm việc', 'I work in a bank.', 'Tôi làm việc ở một ngân hàng.'],
          ['nurse', '/nɜːs/', 'noun', 'y tá', 'My sister is a nurse.', 'Chị tôi là y tá.'],
          ['driver', '/ˈdraɪvə/', 'noun', 'tài xế', 'He is a taxi driver.', 'Anh ấy là tài xế taxi.'],
          ['engineer', '/ˌendʒɪˈnɪə/', 'noun', 'kỹ sư', 'She is an engineer.', 'Cô ấy là kỹ sư.'],
          ['farmer', '/ˈfɑːmə/', 'noun', 'nông dân', 'The farmer works in the field.', 'Người nông dân làm việc ngoài đồng.'],
          ['cook', '/kʊk/', 'noun', 'đầu bếp', 'The cook makes soup.', 'Người đầu bếp nấu súp.'],
          ['office', '/ˈɒfɪs/', 'noun', 'văn phòng', 'I go to the office by bus.', 'Tôi đến văn phòng bằng xe buýt.'],
          ['hospital', '/ˈhɒspɪtl/', 'noun', 'bệnh viện', 'She works at a hospital.', 'Cô ấy làm việc ở bệnh viện.'],
          ['factory', '/ˈfæktri/', 'noun', 'nhà máy', 'My father works in a factory.', 'Bố tôi làm việc trong một nhà máy.'],
          ['company', '/ˈkʌmpəni/', 'noun', 'công ty', 'This company is very big.', 'Công ty này rất lớn.'],
          ['busy', '/ˈbɪzi/', 'adjective', 'bận', 'I am busy at work.', 'Tôi bận việc ở chỗ làm.'],
        ],
        grammar: {
          title: 'What do you do? / I am a… / I work in…',
          explain: 'Hỏi nghề: What do you do? hoặc What is your job? Trả lời: I am a/an + nghề (an đứng trước nguyên âm: an engineer). Nói nơi làm: I work in/at + nơi. Hỏi nơi làm: Where do you work? Với he/she dùng does: What does she do? – She works in a hospital.',
          examples: [
            ['What do you do? – I am a nurse.', 'Bạn làm nghề gì? – Tôi là y tá.'],
            ['She works in a hospital.', 'Cô ấy làm việc ở bệnh viện.'],
            ['Where do you work? – I work in an office.', 'Bạn làm ở đâu? – Tôi làm ở một văn phòng.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'What do you do, Hoa?', 'Bạn làm nghề gì, Hoa?'],
            ['Hoa', 'I am an engineer. I work in a big company.', 'Tôi là kỹ sư. Tôi làm ở một công ty lớn.'],
            ['Tom', 'Is your job busy?', 'Công việc của bạn có bận không?'],
            ['Hoa', 'Yes, very busy. And you?', 'Có, rất bận. Còn bạn?'],
          ],
        },
        reorder: [
          ['What|do|you|do?', 'Bạn làm nghề gì?'],
          ['She|works|in|a|hospital.', 'Cô ấy làm việc ở bệnh viện.'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn là kỹ sư (nhớ dùng “an”).', source: 'engineer', pattern: 'I am an + nghề', answers: ['I am an engineer.', 'I am an engineer', 'I’m an engineer.', "I'm an engineer."] },
          { prompt: 'Hỏi nơi làm việc của người đối diện.', source: 'Bạn làm ở đâu?', pattern: 'Where do you work?', answers: ['Where do you work?', 'Where do you work'] },
        ],
        tip: ['a hay an?', 'Chọn a/an theo âm đầu, không theo chữ cái: an engineer, an office, nhưng a nurse, a driver.'],
      },
    ],
  },
];
