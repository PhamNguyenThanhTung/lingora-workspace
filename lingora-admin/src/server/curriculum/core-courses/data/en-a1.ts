import type { UnitSpec } from '../types.ts';

/** English A1 — Beginner. Can-do: introduce yourself, talk about family and daily life, shop and ask the way. */
export const EN_A1_UNITS: UnitSpec[] = [
  {
    level: 'A1',
    names: { vi: 'Làm quen và giới thiệu', en: 'Meeting People' },
    lessons: [
      {
        title: { vi: 'Xin chào! Rất vui được gặp bạn', en: 'Hello! Nice to Meet You' },
        intro: 'Bạn đang gặp một người bạn mới trong lớp học. Sau bài này bạn có thể chào hỏi, nói tên mình, hỏi tên người khác và cảm ơn, xin lỗi, tạm biệt bằng tiếng Anh.',
        vocab: [
          ['Hello', '/həˈləʊ/', 'interjection', 'xin chào', 'Hello, I am Anna.', 'Xin chào, tôi là Anna.'],
          ['Good morning', '/ɡʊd ˈmɔːnɪŋ/', 'phrase', 'chào buổi sáng', 'Good morning, Tom!', 'Chào buổi sáng, Tom!'],
          ['name', '/neɪm/', 'noun', 'tên', 'My name is Linh.', 'Tên tôi là Linh.'],
          ['Nice to meet you', '/naɪs tə miːt juː/', 'phrase', 'rất vui được gặp bạn', 'Nice to meet you, Sam.', 'Rất vui được gặp bạn, Sam.'],
          ['please', '/pliːz/', 'adverb', 'làm ơn, xin vui lòng', 'Sit down, please.', 'Xin mời ngồi.'],
          ['thank you', '/ˈθæŋk juː/', 'phrase', 'cảm ơn', 'Yes, thank you.', 'Vâng, cảm ơn bạn.'],
          ['goodbye', '/ɡʊdˈbaɪ/', 'interjection', 'tạm biệt', 'Goodbye, see you tomorrow.', 'Tạm biệt, hẹn mai gặp lại.'],
          ['sorry', '/ˈsɒri/', 'adjective', 'xin lỗi, lấy làm tiếc', 'I am sorry, I am late.', 'Xin lỗi, tôi đến muộn.'],
          ['yes', '/jes/', 'adverb', 'vâng, đúng', 'Yes, I am a student.', 'Vâng, tôi là học sinh.'],
          ['no', '/nəʊ/', 'adverb', 'không', 'No, I am not tired.', 'Không, tôi không mệt.'],
        ],
        grammar: {
          title: 'I am… / My name is… / What is your name?',
          explain: 'Để nói tên mình, dùng “I am + tên” hoặc “My name is + tên”. Dạng rút gọn thường gặp: I am → I’m. Để hỏi tên: “What is your name?” (rút gọn What’s your name?). Chữ cái đầu của tên riêng luôn viết hoa.',
          examples: [
            ['I am Mai.', 'Tôi là Mai.'],
            ['My name is David.', 'Tên tôi là David.'],
            ['What is your name?', 'Tên bạn là gì?'],
          ],
        },
        dialogue: {
          lines: [
            ['Mai', 'Hello! I am Mai. What is your name?', 'Xin chào! Tôi là Mai. Tên bạn là gì?'],
            ['Tom', 'Hi, Mai. My name is Tom.', 'Chào Mai. Tên tôi là Tom.'],
            ['Mai', 'Nice to meet you, Tom.', 'Rất vui được gặp bạn, Tom.'],
            ['Tom', 'Nice to meet you too. Goodbye!', 'Mình cũng rất vui được gặp bạn. Tạm biệt!'],
          ],
        },
        reorder: [
          ['What|is|your|name?', 'Tên bạn là gì?'],
          ['Nice|to|meet|you.', 'Rất vui được gặp bạn.'],
        ],
        grammarQ: [
          { prompt: 'Giới thiệu tên mình là Mai bằng mẫu “I am + tên”.', source: 'Mai', pattern: 'I am + tên', answers: ['I am Mai.', 'I am Mai', 'I’m Mai.', 'I’m Mai', "I'm Mai.", "I'm Mai"] },
          { prompt: 'Hỏi tên người đối diện.', source: 'Tên bạn là gì?', pattern: 'What is your name?', answers: ['What is your name?', 'What is your name', 'What’s your name?', "What's your name?"] },
        ],
        tip: ['Lịch sự trước tiên', 'Trong tiếng Anh, “please” và “thank you” được dùng rất thường xuyên, kể cả với người quen. Thiếu chúng khiến câu nói nghe thiếu lịch sự.'],
      },
      {
        title: { vi: 'Bạn đến từ đâu?', en: 'Where Are You From?' },
        intro: 'Làm quen xong, người ta thường hỏi bạn đến từ đâu và nói tiếng gì. Bài này giúp bạn nói về quốc tịch, đất nước và dùng động từ to be (am / is / are) cho đúng.',
        vocab: [
          ['from', '/frɒm/', 'preposition', 'từ, đến từ', 'I am from Vietnam.', 'Tôi đến từ Việt Nam.'],
          ['country', '/ˈkʌntri/', 'noun', 'đất nước', 'Japan is a country in Asia.', 'Nhật Bản là một đất nước ở châu Á.'],
          ['Vietnam', '/ˌvjetˈnæm/', 'proper noun', 'Việt Nam', 'She lives in Vietnam.', 'Cô ấy sống ở Việt Nam.'],
          ['Vietnamese', '/ˌvjetnəˈmiːz/', 'adjective', 'thuộc Việt Nam; người/tiếng Việt', 'I speak Vietnamese.', 'Tôi nói tiếng Việt.'],
          ['English', '/ˈɪŋɡlɪʃ/', 'noun', 'tiếng Anh; người Anh', 'We learn English.', 'Chúng tôi học tiếng Anh.'],
          ['student', '/ˈstjuːdnt/', 'noun', 'học sinh, sinh viên', 'He is a student.', 'Anh ấy là học sinh.'],
          ['teacher', '/ˈtiːtʃə/', 'noun', 'giáo viên', 'Ms Lan is a teacher.', 'Cô Lan là giáo viên.'],
          ['live', '/lɪv/', 'verb', 'sống, ở', 'I live in Hanoi.', 'Tôi sống ở Hà Nội.'],
          ['city', '/ˈsɪti/', 'noun', 'thành phố', 'Da Nang is a beautiful city.', 'Đà Nẵng là một thành phố đẹp.'],
          ['speak', '/spiːk/', 'verb', 'nói (một ngôn ngữ)', 'Do you speak English?', 'Bạn có nói tiếng Anh không?'],
        ],
        grammar: {
          title: 'Động từ to be: I am, you are, he/she is',
          explain: 'To be chia theo chủ ngữ: I am, you/we/they are, he/she/it is. Câu phủ định thêm not (am not, is not = isn’t, are not = aren’t). Câu hỏi đảo động từ lên trước: Are you from Vietnam? Hỏi quê quán: Where are you from? – I am from + quốc gia.',
          examples: [
            ['Where are you from? – I am from Vietnam.', 'Bạn đến từ đâu? – Tôi đến từ Việt Nam.'],
            ['She is not a teacher. She is a student.', 'Cô ấy không phải giáo viên. Cô ấy là học sinh.'],
            ['Are you Vietnamese? – Yes, I am.', 'Bạn là người Việt à? – Vâng, đúng vậy.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'Where are you from, Linh?', 'Bạn đến từ đâu, Linh?'],
            ['Linh', 'I am from Vietnam. I live in Hanoi. And you?', 'Tôi đến từ Việt Nam. Tôi sống ở Hà Nội. Còn bạn?'],
            ['Anna', 'I am from England. I am a teacher.', 'Tôi đến từ nước Anh. Tôi là giáo viên.'],
            ['Linh', 'Oh, I am a student. I speak a little English.', 'Ồ, tôi là học sinh. Tôi nói được một chút tiếng Anh.'],
          ],
        },
        reorder: [
          ['Where|are|you|from?', 'Bạn đến từ đâu?'],
          ['I|am|from|Vietnam.', 'Tôi đến từ Việt Nam.'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn đến từ Việt Nam.', source: 'Việt Nam', pattern: 'I am from + quốc gia', answers: ['I am from Vietnam.', 'I am from Vietnam', 'I’m from Vietnam.', "I'm from Vietnam."] },
          { prompt: 'Chuyển sang câu phủ định: He is a teacher.', source: 'He is a teacher.', pattern: 'S + is not + …', answers: ['He is not a teacher.', 'He isn’t a teacher.', "He isn't a teacher.", 'He’s not a teacher.', "He's not a teacher."] },
        ],
        tip: ['Quốc gia và quốc tịch', 'Tên quốc gia và ngôn ngữ luôn viết hoa trong tiếng Anh: Vietnam, Vietnamese, English. Đây là lỗi chính tả rất hay gặp ở người mới học.'],
      },
      {
        title: { vi: 'Số đếm, tuổi và số điện thoại', en: 'Numbers, Age and Phone Numbers' },
        intro: 'Bạn cần đọc số để nói tuổi, số điện thoại và số nhà. Bài này luyện số từ 0 đến 100 và cách hỏi đáp về tuổi, số điện thoại.',
        vocab: [
          ['number', '/ˈnʌmbə/', 'noun', 'con số, số', 'What is your phone number?', 'Số điện thoại của bạn là gì?'],
          ['zero', '/ˈzɪərəʊ/', 'number', 'số không', 'My number starts with zero.', 'Số của tôi bắt đầu bằng số không.'],
          ['five', '/faɪv/', 'number', 'năm (5)', 'I have five books.', 'Tôi có năm quyển sách.'],
          ['ten', '/ten/', 'number', 'mười (10)', 'There are ten students.', 'Có mười học sinh.'],
          ['twenty', '/ˈtwenti/', 'number', 'hai mươi (20)', 'She is twenty years old.', 'Cô ấy hai mươi tuổi.'],
          ['thirty', '/ˈθɜːti/', 'number', 'ba mươi (30)', 'My father is thirty-five.', 'Bố tôi ba mươi lăm tuổi.'],
          ['hundred', '/ˈhʌndrəd/', 'number', 'trăm', 'One hundred people came.', 'Một trăm người đã đến.'],
          ['age', '/eɪdʒ/', 'noun', 'tuổi', 'What is your age?', 'Bạn bao nhiêu tuổi?'],
          ['old', '/əʊld/', 'adjective', 'già, … tuổi', 'How old are you?', 'Bạn bao nhiêu tuổi?'],
          ['phone', '/fəʊn/', 'noun', 'điện thoại', 'My phone is new.', 'Điện thoại của tôi mới.'],
        ],
        grammar: {
          title: 'How old are you? / What is your phone number?',
          explain: 'Hỏi tuổi: “How old are you?” – “I am + số + (years old)”. Số điện thoại đọc từng chữ số: 0912 → zero nine one two. Số 11–19 kết thúc bằng -teen (thirteen), các chục kết thúc bằng -ty (thirty); chú ý thirteen/thirty dễ nhầm trọng âm: thirTEEN – THIRty.',
          examples: [
            ['How old are you? – I am twenty-two.', 'Bạn bao nhiêu tuổi? – Tôi hai mươi hai tuổi.'],
            ['My phone number is 0912 345 678.', 'Số điện thoại của tôi là 0912 345 678.'],
            ['She is thirty years old.', 'Cô ấy ba mươi tuổi.'],
          ],
        },
        dialogue: {
          lines: [
            ['Receptionist', 'What is your name, please?', 'Xin cho biết tên của bạn?'],
            ['Nam', 'My name is Nam.', 'Tên tôi là Nam.'],
            ['Receptionist', 'How old are you, Nam?', 'Bạn bao nhiêu tuổi, Nam?'],
            ['Nam', 'I am twenty. My phone number is zero nine one two, three four five, six seven eight.', 'Tôi hai mươi tuổi. Số điện thoại của tôi là 0912 345 678.'],
          ],
        },
        reorder: [
          ['How|old|are|you?', 'Bạn bao nhiêu tuổi?'],
          ['She|is|thirty|years|old.', 'Cô ấy ba mươi tuổi.'],
        ],
        grammarQ: [
          { prompt: 'Trả lời: bạn 25 tuổi (viết số bằng chữ).', source: '25 tuổi', pattern: 'I am + số + years old', answers: ['I am twenty-five years old.', 'I am twenty-five.', 'I’m twenty-five.', "I'm twenty-five.", 'I am twenty five years old.', 'I am twenty five.'] },
        ],
        tip: ['Phân biệt -teen và -ty', 'Nếu nghe thấy âm /iːn/ kéo dài ở cuối (thirteen, fifteen) đó là 13, 15. Nếu âm cuối ngắn (thirty, fifty) đó là 30, 50. Hãy luyện nghe hai cặp này mỗi ngày.'],
      },
    ],
  },
  {
    level: 'A1',
    names: { vi: 'Gia đình và đồ vật', en: 'Family and Things' },
    lessons: [
      {
        title: { vi: 'Gia đình của tôi', en: 'My Family' },
        intro: 'Bạn muốn giới thiệu gia đình với bạn mới. Bài này giúp bạn gọi tên các thành viên gia đình và dùng my/your/his/her cùng ’s để nói “của ai”.',
        vocab: [
          ['family', '/ˈfæməli/', 'noun', 'gia đình', 'I love my family.', 'Tôi yêu gia đình tôi.'],
          ['mother', '/ˈmʌðə/', 'noun', 'mẹ', 'My mother is a nurse.', 'Mẹ tôi là y tá.'],
          ['father', '/ˈfɑːðə/', 'noun', 'bố', 'My father works in a bank.', 'Bố tôi làm việc ở ngân hàng.'],
          ['brother', '/ˈbrʌðə/', 'noun', 'anh/em trai', 'I have one brother.', 'Tôi có một anh/em trai.'],
          ['sister', '/ˈsɪstə/', 'noun', 'chị/em gái', 'Her sister is ten.', 'Em gái cô ấy mười tuổi.'],
          ['parents', '/ˈpeərənts/', 'noun', 'bố mẹ', 'My parents are at home.', 'Bố mẹ tôi đang ở nhà.'],
          ['grandmother', '/ˈɡrænmʌðə/', 'noun', 'bà', 'My grandmother is seventy.', 'Bà tôi bảy mươi tuổi.'],
          ['husband', '/ˈhʌzbənd/', 'noun', 'chồng', 'Her husband is a doctor.', 'Chồng cô ấy là bác sĩ.'],
          ['wife', '/waɪf/', 'noun', 'vợ', 'His wife is very kind.', 'Vợ anh ấy rất tốt bụng.'],
          ['child', '/tʃaɪld/', 'noun', 'đứa trẻ, con (số nhiều: children)', 'They have one child.', 'Họ có một đứa con.'],
        ],
        grammar: {
          title: 'my / your / his / her và sở hữu cách ’s',
          explain: 'Tính từ sở hữu đứng trước danh từ: my (của tôi), your (của bạn), his (của anh ấy), her (của cô ấy), our, their. Để nói sở hữu của một người, thêm ’s vào sau tên: Anna’s brother = anh trai của Anna. Với “have/has”: I have a sister. She has two brothers.',
          examples: [
            ['This is my mother. Her name is Hoa.', 'Đây là mẹ tôi. Tên bà là Hoa.'],
            ['Tom’s sister is a doctor.', 'Chị gái của Tom là bác sĩ.'],
            ['He has two brothers and one sister.', 'Anh ấy có hai anh em trai và một chị/em gái.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'Is this your family, Linh?', 'Đây là gia đình bạn phải không, Linh?'],
            ['Linh', 'Yes. This is my father and this is my mother.', 'Vâng. Đây là bố tôi và đây là mẹ tôi.'],
            ['Anna', 'Who is the girl?', 'Cô gái này là ai vậy?'],
            ['Linh', 'She is my sister. Her name is Mai. She is ten years old.', 'Đó là em gái tôi. Tên em là Mai. Em mười tuổi.'],
          ],
        },
        reorder: [
          ['This|is|my|mother.', 'Đây là mẹ tôi.'],
          ['He|has|two|brothers.', 'Anh ấy có hai anh em trai.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Chị gái của Anna là giáo viên” bằng sở hữu cách ’s.', source: 'Anna / sister / teacher', pattern: 'Anna’s sister is a teacher.', answers: ['Anna’s sister is a teacher.', "Anna's sister is a teacher.", 'Anna’s sister is a teacher', "Anna's sister is a teacher"] },
          { prompt: 'Điền have hoặc has: She ____ one brother (viết cả câu).', source: 'She ___ one brother.', pattern: 'She + has + …', answers: ['She has one brother.', 'She has one brother'] },
        ],
        tip: ['“Anh/em” trong tiếng Anh', 'Tiếng Anh không phân biệt anh với em: brother là anh hoặc em trai. Muốn nói rõ, dùng older brother (anh) hoặc younger brother (em trai).'],
      },
      {
        title: { vi: 'Đồ vật quanh bạn', en: 'Things Around You' },
        intro: 'Bạn đang chỉ vào đồ vật và hỏi “đây là cái gì?”. Bài này dạy this/that/these/those, a/an và số nhiều của danh từ.',
        vocab: [
          ['book', '/bʊk/', 'noun', 'quyển sách', 'This is a book.', 'Đây là một quyển sách.'],
          ['pen', '/pen/', 'noun', 'cái bút', 'I have a pen.', 'Tôi có một cái bút.'],
          ['bag', '/bæɡ/', 'noun', 'cái túi, cặp', 'That is my bag.', 'Kia là cặp của tôi.'],
          ['table', '/ˈteɪbl/', 'noun', 'cái bàn', 'The book is on the table.', 'Quyển sách ở trên bàn.'],
          ['chair', '/tʃeə/', 'noun', 'cái ghế', 'Sit on the chair.', 'Hãy ngồi lên ghế.'],
          ['key', '/kiː/', 'noun', 'chìa khoá', 'Where is my key?', 'Chìa khoá của tôi đâu?'],
          ['umbrella', '/ʌmˈbrelə/', 'noun', 'cái ô', 'Take an umbrella.', 'Hãy mang theo một cái ô.'],
          ['computer', '/kəmˈpjuːtə/', 'noun', 'máy tính', 'The computer is new.', 'Cái máy tính còn mới.'],
          ['window', '/ˈwɪndəʊ/', 'noun', 'cửa sổ', 'Open the window, please.', 'Làm ơn mở cửa sổ.'],
          ['door', '/dɔː/', 'noun', 'cửa ra vào', 'Close the door.', 'Hãy đóng cửa lại.'],
        ],
        grammar: {
          title: 'this / that / these / those và a / an',
          explain: 'This/these chỉ vật ở gần (số ít/số nhiều), that/those chỉ vật ở xa. Dùng a trước phụ âm (a book) và an trước nguyên âm (an umbrella). Số nhiều thường thêm -s (books), thêm -es sau s, x, ch, sh (boxes, watches). Hỏi: What is this? – It is a pen. What are these? – They are pens.',
          examples: [
            ['What is this? – It is a key.', 'Đây là cái gì? – Nó là một chiếc chìa khoá.'],
            ['Those are my books.', 'Những quyển kia là sách của tôi.'],
            ['I have an umbrella and two bags.', 'Tôi có một cái ô và hai cái túi.'],
          ],
        },
        dialogue: {
          lines: [
            ['Teacher', 'Open your bag. What is this?', 'Hãy mở cặp ra. Đây là cái gì?'],
            ['Student', 'It is a book. And these are my pens.', 'Đó là một quyển sách. Còn đây là những cái bút của em.'],
            ['Teacher', 'Is that your umbrella?', 'Kia có phải ô của em không?'],
            ['Student', 'No, it is not. It is Tom’s umbrella.', 'Không ạ. Đó là ô của Tom.'],
          ],
        },
        reorder: [
          ['What|is|this?', 'Đây là cái gì?'],
          ['These|are|my|pens.', 'Đây là những cái bút của tôi.'],
        ],
        grammarQ: [
          { prompt: 'Điền a hoặc an rồi viết cả câu: This is ___ umbrella.', source: 'This is ___ umbrella.', pattern: 'This is an + danh từ bắt đầu bằng nguyên âm', answers: ['This is an umbrella.', 'This is an umbrella'] },
          { prompt: 'Viết số nhiều: This is a box.', source: 'This is a box.', pattern: 'These are + danh từ số nhiều', answers: ['These are boxes.', 'These are boxes'] },
        ],
        tip: ['Dựa vào âm, không dựa vào chữ', 'Chọn a/an theo âm đầu: “an hour” (h câm) nhưng “a university” (đọc /ju/). Hãy đọc to từ trước khi chọn.'],
      },
      {
        title: { vi: 'Miêu tả người và vật', en: 'Describing People and Things' },
        intro: 'Bạn muốn miêu tả một người bạn hoặc món đồ: lớn hay nhỏ, màu gì. Bài này dạy tính từ thông dụng, màu sắc và vị trí của tính từ.',
        vocab: [
          ['big', '/bɪɡ/', 'adjective', 'to, lớn', 'They have a big house.', 'Họ có một ngôi nhà lớn.'],
          ['small', '/smɔːl/', 'adjective', 'nhỏ', 'My room is small.', 'Phòng của tôi nhỏ.'],
          ['new', '/njuː/', 'adjective', 'mới', 'I have a new phone.', 'Tôi có một chiếc điện thoại mới.'],
          ['tall', '/tɔːl/', 'adjective', 'cao', 'My brother is tall.', 'Anh trai tôi cao.'],
          ['young', '/jʌŋ/', 'adjective', 'trẻ', 'The teacher is young.', 'Cô giáo còn trẻ.'],
          ['beautiful', '/ˈbjuːtɪfl/', 'adjective', 'đẹp', 'It is a beautiful city.', 'Đó là một thành phố đẹp.'],
          ['red', '/red/', 'adjective', 'màu đỏ', 'She has a red bag.', 'Cô ấy có một chiếc túi đỏ.'],
          ['blue', '/bluː/', 'adjective', 'màu xanh dương', 'The sky is blue.', 'Bầu trời màu xanh.'],
          ['black', '/blæk/', 'adjective', 'màu đen', 'I like black coffee.', 'Tôi thích cà phê đen.'],
          ['happy', '/ˈhæpi/', 'adjective', 'vui, hạnh phúc', 'We are happy today.', 'Hôm nay chúng tôi vui.'],
        ],
        grammar: {
          title: 'Tính từ đứng trước danh từ',
          explain: 'Trong tiếng Anh tính từ đứng TRƯỚC danh từ và không đổi hình thức: a red bag, two red bags. Cũng có thể đứng sau to be: The bag is red. Khi có nhiều tính từ, ý kiến đứng trước sự thật (a beautiful big house). Dùng very để nhấn mạnh: very big.',
          examples: [
            ['She has a new red bag.', 'Cô ấy có một chiếc túi đỏ mới.'],
            ['My sister is very tall.', 'Chị gái tôi rất cao.'],
            ['They are happy students.', 'Họ là những học sinh vui vẻ.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'Is that your new bag?', 'Kia là chiếc túi mới của bạn à?'],
            ['Linh', 'Yes! It is a small blue bag.', 'Đúng vậy! Đó là một chiếc túi nhỏ màu xanh.'],
            ['Anna', 'It is beautiful. Where is your old bag?', 'Nó đẹp quá. Chiếc túi cũ của bạn đâu rồi?'],
            ['Linh', 'It is at home. It is big and black.', 'Nó ở nhà. Nó to và màu đen.'],
          ],
        },
        reorder: [
          ['She|has|a|red|bag.', 'Cô ấy có một chiếc túi đỏ.'],
          ['My|sister|is|very|tall.', 'Chị gái tôi rất cao.'],
        ],
        grammarQ: [
          { prompt: 'Ghép tính từ vào danh từ: “một ngôi nhà lớn” (house, big).', source: 'a / house / big', pattern: 'a + tính từ + danh từ', answers: ['a big house', 'A big house', 'a big house.', 'It is a big house.'] },
        ],
        tip: ['Không thêm -s vào tính từ', 'Tính từ tiếng Anh không đổi theo số nhiều: “two big houses”, không phải “two bigs houses”.'],
      },
    ],
  },
  {
    level: 'A1',
    names: { vi: 'Một ngày của tôi', en: 'My Day' },
    lessons: [
      {
        title: { vi: 'Thói quen hằng ngày và giờ giấc', en: 'Daily Routines and Time' },
        intro: 'Bạn muốn kể về một ngày bình thường của mình và hỏi giờ. Bài này dạy hiện tại đơn, giờ giấc và các trạng từ tần suất.',
        vocab: [
          ['wake up', '/weɪk ʌp/', 'phrasal verb', 'thức dậy', 'I wake up at six.', 'Tôi thức dậy lúc sáu giờ.'],
          ['breakfast', '/ˈbrekfəst/', 'noun', 'bữa sáng', 'We eat breakfast at seven.', 'Chúng tôi ăn sáng lúc bảy giờ.'],
          ['work', '/wɜːk/', 'verb', 'làm việc', 'She works in a hospital.', 'Cô ấy làm việc ở bệnh viện.'],
          ['start', '/stɑːt/', 'verb', 'bắt đầu', 'School starts at eight.', 'Trường bắt đầu lúc tám giờ.'],
          ['finish', '/ˈfɪnɪʃ/', 'verb', 'kết thúc, xong', 'I finish work at five.', 'Tôi tan làm lúc năm giờ.'],
          ['go to bed', '/ɡəʊ tə bed/', 'phrase', 'đi ngủ', 'I go to bed at eleven.', 'Tôi đi ngủ lúc mười một giờ.'],
          ['always', '/ˈɔːlweɪz/', 'adverb', 'luôn luôn', 'He always drinks tea.', 'Anh ấy luôn uống trà.'],
          ['usually', '/ˈjuːʒuəli/', 'adverb', 'thường thường', 'I usually walk to school.', 'Tôi thường đi bộ đến trường.'],
          ['sometimes', '/ˈsʌmtaɪmz/', 'adverb', 'thỉnh thoảng', 'Sometimes we eat out.', 'Thỉnh thoảng chúng tôi ăn ngoài.'],
          ['o’clock', '/əˈklɒk/', 'adverb', '… giờ đúng', 'It is seven o’clock.', 'Bây giờ là bảy giờ đúng.'],
        ],
        grammar: {
          title: 'Hiện tại đơn và cách nói giờ',
          explain: 'Thì hiện tại đơn diễn tả thói quen: I/you/we/they + động từ nguyên mẫu; he/she/it + động từ thêm -s/-es (works, goes). Phủ định: don’t / doesn’t + động từ nguyên mẫu. Hỏi giờ: “What time is it?” – “It is half past seven (7:30)”. Trạng từ tần suất đứng trước động từ thường, sau to be.',
          examples: [
            ['I wake up at six and I start work at eight.', 'Tôi thức dậy lúc sáu giờ và bắt đầu làm việc lúc tám giờ.'],
            ['She doesn’t eat breakfast at home.', 'Cô ấy không ăn sáng ở nhà.'],
            ['What time is it? – It is half past seven.', 'Mấy giờ rồi? – Bảy giờ rưỡi.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'What time do you wake up?', 'Bạn thức dậy lúc mấy giờ?'],
            ['Linh', 'I usually wake up at six. I eat breakfast at half past six.', 'Tôi thường thức dậy lúc sáu giờ. Tôi ăn sáng lúc sáu rưỡi.'],
            ['Tom', 'When do you start work?', 'Khi nào bạn bắt đầu làm việc?'],
            ['Linh', 'I start at eight and finish at five.', 'Tôi bắt đầu lúc tám giờ và tan làm lúc năm giờ.'],
          ],
        },
        reorder: [
          ['I|usually|wake|up|at|six.', 'Tôi thường thức dậy lúc sáu giờ.'],
          ['What|time|is|it?', 'Mấy giờ rồi?'],
        ],
        grammarQ: [
          { prompt: 'Chia động từ ở ngôi thứ ba: She (work) in a bank.', source: 'She (work) in a bank.', pattern: 'She + động từ thêm -s', answers: ['She works in a bank.', 'She works in a bank'] },
          { prompt: 'Chuyển sang phủ định: He eats breakfast.', source: 'He eats breakfast.', pattern: 'He doesn’t + động từ nguyên mẫu', answers: ['He doesn’t eat breakfast.', "He doesn't eat breakfast.", 'He does not eat breakfast.'] },
        ],
        tip: ['Quy tắc -s ở ngôi thứ ba', 'Nếu đã có “does/doesn’t” thì động từ chính trở về nguyên mẫu: “She doesn’t work”, không phải “She doesn’t works”.'],
      },
      {
        title: { vi: 'Đồ ăn và thức uống', en: 'Food and Drinks' },
        intro: 'Bạn muốn nói mình thích gì, muốn ăn gì và gọi món đơn giản. Bài này dạy từ vựng món ăn, like/want và cách nói lịch sự I would like….',
        vocab: [
          ['rice', '/raɪs/', 'noun', 'cơm, gạo', 'We eat rice every day.', 'Chúng tôi ăn cơm mỗi ngày.'],
          ['bread', '/bred/', 'noun', 'bánh mì', 'I like bread and butter.', 'Tôi thích bánh mì và bơ.'],
          ['egg', '/eɡ/', 'noun', 'quả trứng', 'I want an egg.', 'Tôi muốn một quả trứng.'],
          ['chicken', '/ˈtʃɪkɪn/', 'noun', 'thịt gà', 'She likes chicken soup.', 'Cô ấy thích súp gà.'],
          ['fruit', '/fruːt/', 'noun', 'trái cây', 'Fruit is good for you.', 'Trái cây tốt cho sức khoẻ.'],
          ['water', '/ˈwɔːtə/', 'noun', 'nước', 'Can I have some water?', 'Cho tôi xin ít nước được không?'],
          ['coffee', '/ˈkɒfi/', 'noun', 'cà phê', 'I drink coffee in the morning.', 'Tôi uống cà phê vào buổi sáng.'],
          ['like', '/laɪk/', 'verb', 'thích', 'I like tea.', 'Tôi thích trà.'],
          ['want', '/wɒnt/', 'verb', 'muốn', 'They want some juice.', 'Họ muốn một ít nước ép.'],
          ['hungry', '/ˈhʌŋɡri/', 'adjective', 'đói', 'I am hungry.', 'Tôi đói.'],
        ],
        grammar: {
          title: 'like, want và I would like…',
          explain: 'like + danh từ/động từ-ing diễn tả sở thích chung: I like rice. want + danh từ/to + động từ diễn tả điều muốn: I want a coffee. Khi gọi món hoặc xin lịch sự, dùng “I would like…” (rút gọn I’d like). Danh từ không đếm được (rice, water) dùng some, không dùng a.',
          examples: [
            ['I like rice, but I don’t like bread.', 'Tôi thích cơm nhưng không thích bánh mì.'],
            ['I would like a coffee, please.', 'Làm ơn cho tôi một ly cà phê.'],
            ['Do you want some water?', 'Bạn có muốn một ít nước không?'],
          ],
        },
        dialogue: {
          lines: [
            ['Waiter', 'Hello. What would you like?', 'Xin chào. Quý khách muốn dùng gì ạ?'],
            ['Mai', 'I would like chicken and rice, please.', 'Cho tôi món gà và cơm.'],
            ['Waiter', 'Would you like something to drink?', 'Quý khách có muốn uống gì không?'],
            ['Mai', 'Yes, a glass of water, please.', 'Vâng, cho tôi một ly nước.'],
          ],
        },
        reorder: [
          ['I|would|like|a|coffee,|please.', 'Làm ơn cho tôi một ly cà phê.'],
          ['Do|you|want|some|water?', 'Bạn có muốn một ít nước không?'],
        ],
        grammarQ: [
          { prompt: 'Gọi một ly cà phê lịch sự bằng “I would like”.', source: 'coffee', pattern: 'I would like + a/some + …', answers: ['I would like a coffee, please.', 'I would like a coffee.', 'I would like a coffee', 'I’d like a coffee, please.', "I'd like a coffee, please.", "I'd like a coffee."] },
        ],
        tip: ['“I want” nghe hơi thẳng', 'Khi gọi món, “I would like…” lịch sự hơn “I want…”. Hãy luyện dùng I’d like trong nhà hàng.'],
      },
      {
        title: { vi: 'Nhà cửa và nơi chốn trong thành phố', en: 'Home and Places in Town' },
        intro: 'Bạn muốn tả căn nhà và những nơi quanh nhà. Bài này dạy there is/there are và giới từ chỉ nơi chốn in, on, next to.',
        vocab: [
          ['house', '/haʊs/', 'noun', 'ngôi nhà', 'We live in a small house.', 'Chúng tôi sống trong một ngôi nhà nhỏ.'],
          ['kitchen', '/ˈkɪtʃɪn/', 'noun', 'nhà bếp', 'My mother is in the kitchen.', 'Mẹ tôi đang ở trong bếp.'],
          ['bedroom', '/ˈbedruːm/', 'noun', 'phòng ngủ', 'There is a bed in the bedroom.', 'Có một cái giường trong phòng ngủ.'],
          ['bathroom', '/ˈbɑːθruːm/', 'noun', 'phòng tắm', 'The bathroom is upstairs.', 'Phòng tắm ở trên lầu.'],
          ['supermarket', '/ˈsuːpəmɑːkɪt/', 'noun', 'siêu thị', 'The supermarket is near my house.', 'Siêu thị gần nhà tôi.'],
          ['bank', '/bæŋk/', 'noun', 'ngân hàng', 'The bank is next to the school.', 'Ngân hàng nằm cạnh trường học.'],
          ['park', '/pɑːk/', 'noun', 'công viên', 'There is a park in my city.', 'Có một công viên trong thành phố của tôi.'],
          ['next to', '/ˈnekst tuː/', 'preposition', 'bên cạnh', 'The shop is next to the bank.', 'Cửa hàng ở cạnh ngân hàng.'],
          ['in front of', '/ɪn ˈfrʌnt əv/', 'preposition', 'phía trước', 'The bus stops in front of the park.', 'Xe buýt dừng phía trước công viên.'],
          ['near', '/nɪə/', 'preposition', 'gần', 'I live near the station.', 'Tôi sống gần nhà ga.'],
        ],
        grammar: {
          title: 'There is / There are và giới từ chỉ nơi chốn',
          explain: 'There is + danh từ số ít/không đếm được; there are + danh từ số nhiều. Phủ định: there isn’t / there aren’t. Câu hỏi: Is there a…? Are there any…? Giới từ nơi chốn: in (trong), on (trên), under (dưới), next to (bên cạnh), in front of (phía trước), behind (phía sau), near (gần).',
          examples: [
            ['There is a bank next to the park.', 'Có một ngân hàng cạnh công viên.'],
            ['There are three bedrooms in my house.', 'Nhà tôi có ba phòng ngủ.'],
            ['Is there a supermarket near here? – Yes, there is.', 'Gần đây có siêu thị không? – Có.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tom', 'Is there a supermarket near your house?', 'Gần nhà bạn có siêu thị không?'],
            ['Linh', 'Yes, there is. It is next to the bank.', 'Có. Nó ở cạnh ngân hàng.'],
            ['Tom', 'Are there any parks?', 'Có công viên nào không?'],
            ['Linh', 'Yes, there is a big park in front of my house.', 'Có, có một công viên lớn ngay trước nhà tôi.'],
          ],
        },
        reorder: [
          ['There|is|a|bank|next|to|the|park.', 'Có một ngân hàng cạnh công viên.'],
          ['Is|there|a|supermarket|near|here?', 'Gần đây có siêu thị không?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Có ba phòng ngủ trong nhà” (bedrooms, house).', source: 'three bedrooms / house', pattern: 'There are + số + danh từ số nhiều + in …', answers: ['There are three bedrooms in the house.', 'There are three bedrooms in the house'] },
          { prompt: 'Chuyển sang phủ định: There is a park near here.', source: 'There is a park near here.', pattern: 'There isn’t + …', answers: ['There isn’t a park near here.', "There isn't a park near here.", 'There is not a park near here.'] },
        ],
        tip: ['“There” không phải “their”', 'There (ở đó / có) và their (của họ) đọc giống nhau nhưng viết khác. Với nghĩa “có”, luôn viết there.'],
      },
    ],
  },
  {
    level: 'A1',
    names: { vi: 'Mua sắm và đi lại', en: 'Shopping and Getting Around' },
    lessons: [
      {
        title: { vi: 'Mua sắm và hỏi giá', en: 'Shopping and Prices' },
        intro: 'Bạn vào cửa hàng và muốn hỏi giá, mặc cả nhẹ nhàng và thanh toán. Bài này luyện How much, this/that, và các câu giao tiếp ở quầy thu ngân.',
        vocab: [
          ['shop', '/ʃɒp/', 'noun', 'cửa hàng', 'The shop opens at nine.', 'Cửa hàng mở cửa lúc chín giờ.'],
          ['price', '/praɪs/', 'noun', 'giá', 'The price is low.', 'Giá rẻ.'],
          ['cheap', '/tʃiːp/', 'adjective', 'rẻ', 'This hat is cheap.', 'Chiếc mũ này rẻ.'],
          ['expensive', '/ɪkˈspensɪv/', 'adjective', 'đắt', 'That coat is very expensive.', 'Chiếc áo khoác kia rất đắt.'],
          ['buy', '/baɪ/', 'verb', 'mua', 'I want to buy a shirt.', 'Tôi muốn mua một cái áo sơ mi.'],
          ['pay', '/peɪ/', 'verb', 'trả tiền', 'Can I pay by card?', 'Tôi trả bằng thẻ được không?'],
          ['shirt', '/ʃɜːt/', 'noun', 'áo sơ mi', 'He wears a white shirt.', 'Anh ấy mặc áo sơ mi trắng.'],
          ['size', '/saɪz/', 'noun', 'cỡ, kích cỡ', 'What size do you need?', 'Bạn cần cỡ nào?'],
          ['dollar', '/ˈdɒlə/', 'noun', 'đô la', 'It is ten dollars.', 'Cái này mười đô la.'],
          ['change', '/tʃeɪndʒ/', 'noun', 'tiền thừa, tiền lẻ', 'Here is your change.', 'Đây là tiền thừa của bạn.'],
        ],
        grammar: {
          title: 'How much …? và Can I …?',
          explain: 'Hỏi giá: “How much is this shirt?” (số ít) / “How much are these shoes?” (số nhiều). Trả lời: It is / They are + giá. Xin phép hoặc yêu cầu lịch sự: “Can I try it on?”, “Can I have the bill, please?”. Dùng “too + tính từ” để nói quá mức: too expensive = đắt quá.',
          examples: [
            ['How much is this shirt? – It is twenty dollars.', 'Cái áo này giá bao nhiêu? – Hai mươi đô la.'],
            ['These shoes are too expensive.', 'Đôi giày này đắt quá.'],
            ['Can I pay by card?', 'Tôi trả bằng thẻ được không?'],
          ],
        },
        dialogue: {
          lines: [
            ['Customer', 'Excuse me, how much is this shirt?', 'Xin lỗi, cái áo sơ mi này giá bao nhiêu?'],
            ['Seller', 'It is twenty dollars.', 'Hai mươi đô la ạ.'],
            ['Customer', 'That is a little expensive. Do you have a cheaper one?', 'Hơi đắt một chút. Bạn có cái nào rẻ hơn không?'],
            ['Seller', 'Yes. This one is fifteen dollars.', 'Có ạ. Cái này mười lăm đô la.'],
          ],
        },
        reorder: [
          ['How|much|is|this|shirt?', 'Cái áo này giá bao nhiêu?'],
          ['Can|I|pay|by|card?', 'Tôi trả bằng thẻ được không?'],
        ],
        grammarQ: [
          { prompt: 'Hỏi giá của đôi giày (số nhiều).', source: 'shoes', pattern: 'How much are + danh từ số nhiều?', answers: ['How much are these shoes?', 'How much are the shoes?', 'How much are these shoes', 'How much are those shoes?'] },
        ],
        tip: ['“Cheap” có thể nghe chê', 'Khi nói về món đồ của người khác, dùng “good price” hoặc “not expensive” sẽ lịch sự hơn “cheap”, vì cheap đôi khi có nghĩa rẻ tiền, kém chất lượng.'],
      },
      {
        title: { vi: 'Hỏi đường và phương tiện', en: 'Directions and Transport' },
        intro: 'Bạn bị lạc và cần hỏi đường. Bài này dạy câu mệnh lệnh để chỉ đường (turn left, go straight) và các từ vựng về phương tiện công cộng.',
        vocab: [
          ['turn left', '/tɜːn left/', 'phrase', 'rẽ trái', 'Turn left at the bank.', 'Rẽ trái ở ngân hàng.'],
          ['turn right', '/tɜːn raɪt/', 'phrase', 'rẽ phải', 'Turn right at the corner.', 'Rẽ phải ở góc phố.'],
          ['go straight', '/ɡəʊ streɪt/', 'phrase', 'đi thẳng', 'Go straight for two minutes.', 'Đi thẳng hai phút.'],
          ['street', '/striːt/', 'noun', 'con phố', 'The shop is on Main Street.', 'Cửa hàng ở phố Main.'],
          ['corner', '/ˈkɔːnə/', 'noun', 'góc phố', 'The café is on the corner.', 'Quán cà phê ở góc phố.'],
          ['bus stop', '/ˈbʌs stɒp/', 'noun', 'trạm xe buýt', 'The bus stop is near here.', 'Trạm xe buýt ở gần đây.'],
          ['station', '/ˈsteɪʃn/', 'noun', 'nhà ga', 'How do I get to the station?', 'Làm sao để tôi đến nhà ga?'],
          ['far', '/fɑː/', 'adjective', 'xa', 'Is it far from here?', 'Chỗ đó có xa đây không?'],
          ['minute', '/ˈmɪnɪt/', 'noun', 'phút', 'It is five minutes by bus.', 'Đi xe buýt mất năm phút.'],
          ['map', '/mæp/', 'noun', 'bản đồ', 'Look at the map.', 'Hãy nhìn bản đồ.'],
        ],
        grammar: {
          title: 'Câu mệnh lệnh và hỏi đường',
          explain: 'Câu mệnh lệnh dùng động từ nguyên mẫu, không có chủ ngữ: Turn left. Go straight. Phủ định: Don’t turn right. Để hỏi đường lịch sự: “Excuse me, how do I get to the station?” hoặc “Where is the bank?”. Chỉ khoảng cách bằng “It is + khoảng thời gian + on foot / by bus”.',
          examples: [
            ['Go straight and turn left at the bank.', 'Đi thẳng rồi rẽ trái ở ngân hàng.'],
            ['Excuse me, how do I get to the station?', 'Xin lỗi, tôi đến nhà ga bằng cách nào?'],
            ['It is ten minutes on foot.', 'Đi bộ mất mười phút.'],
          ],
        },
        dialogue: {
          lines: [
            ['Tourist', 'Excuse me, how do I get to the station?', 'Xin lỗi, tôi đến nhà ga như thế nào?'],
            ['Local', 'Go straight and turn left at the bank.', 'Đi thẳng rồi rẽ trái ở ngân hàng.'],
            ['Tourist', 'Is it far?', 'Có xa không ạ?'],
            ['Local', 'No, it is five minutes on foot.', 'Không, đi bộ mất năm phút.'],
          ],
        },
        reorder: [
          ['Turn|left|at|the|bank.', 'Rẽ trái ở ngân hàng.'],
          ['How|do|I|get|to|the|station?', 'Làm sao để tôi đến nhà ga?'],
        ],
        grammarQ: [
          { prompt: 'Chỉ đường: “Đi thẳng rồi rẽ phải” (go straight, turn right).', source: 'go straight / turn right', pattern: 'Go straight and turn right.', answers: ['Go straight and turn right.', 'Go straight and turn right', 'Go straight, then turn right.', 'Go straight then turn right.'] },
        ],
        tip: ['Nói “please” khi hỏi đường', 'Mở đầu bằng “Excuse me” và kết thúc bằng “Thank you” khiến người lạ sẵn lòng giúp bạn hơn rất nhiều.'],
      },
      {
        title: { vi: 'Khả năng và sở thích cuối tuần', en: 'Abilities and Weekend Hobbies' },
        intro: 'Bạn nói về những việc mình làm được và cách thư giãn cuối tuần. Bài này dạy can/can’t và like + động từ-ing.',
        vocab: [
          ['swim', '/swɪm/', 'verb', 'bơi', 'I can swim.', 'Tôi biết bơi.'],
          ['cook', '/kʊk/', 'verb', 'nấu ăn', 'My father can cook well.', 'Bố tôi nấu ăn giỏi.'],
          ['play', '/pleɪ/', 'verb', 'chơi', 'We play football on Sunday.', 'Chúng tôi chơi bóng đá vào Chủ nhật.'],
          ['sing', '/sɪŋ/', 'verb', 'hát', 'She can sing very well.', 'Cô ấy hát rất hay.'],
          ['drive', '/draɪv/', 'verb', 'lái xe', 'I cannot drive.', 'Tôi không biết lái xe.'],
          ['read', '/riːd/', 'verb', 'đọc', 'I like reading books.', 'Tôi thích đọc sách.'],
          ['music', '/ˈmjuːzɪk/', 'noun', 'âm nhạc', 'We listen to music.', 'Chúng tôi nghe nhạc.'],
          ['weekend', '/ˌwiːkˈend/', 'noun', 'cuối tuần', 'What do you do at the weekend?', 'Cuối tuần bạn làm gì?'],
          ['friend', '/frend/', 'noun', 'người bạn', 'I meet my friends on Saturday.', 'Tôi gặp bạn bè vào thứ Bảy.'],
          ['football', '/ˈfʊtbɔːl/', 'noun', 'bóng đá', 'He likes football.', 'Anh ấy thích bóng đá.'],
        ],
        grammar: {
          title: 'can / can’t và like + V-ing',
          explain: 'can + động từ nguyên mẫu nói về khả năng: I can swim. Phủ định: can’t / cannot. Câu hỏi: Can you swim? – Yes, I can. / No, I can’t. Can không đổi theo ngôi (he can, không phải he cans). Sau like / love / hate dùng động từ thêm -ing: I like playing football.',
          examples: [
            ['I can swim, but I can’t drive.', 'Tôi biết bơi nhưng không biết lái xe.'],
            ['Can you cook? – Yes, I can.', 'Bạn nấu ăn được không? – Được.'],
            ['She likes reading and listening to music.', 'Cô ấy thích đọc sách và nghe nhạc.'],
          ],
        },
        dialogue: {
          lines: [
            ['Anna', 'What do you do at the weekend, Nam?', 'Cuối tuần bạn làm gì, Nam?'],
            ['Nam', 'I play football with my friends. I like playing football.', 'Tôi chơi bóng đá với bạn bè. Tôi thích chơi bóng đá.'],
            ['Anna', 'Can you swim too?', 'Bạn cũng biết bơi chứ?'],
            ['Nam', 'Yes, I can. But I can’t sing!', 'Có chứ. Nhưng tôi không biết hát!'],
          ],
        },
        reorder: [
          ['Can|you|swim?', 'Bạn biết bơi không?'],
          ['She|likes|reading|and|listening|to|music.', 'Cô ấy thích đọc sách và nghe nhạc.'],
        ],
        grammarQ: [
          { prompt: 'Viết câu “Tôi không biết lái xe” bằng can’t.', source: 'drive', pattern: 'I can’t + động từ', answers: ['I can’t drive.', "I can't drive.", 'I cannot drive.', 'I can not drive.'] },
          { prompt: 'Dùng like + V-ing: “Anh ấy thích chơi bóng đá” (play football).', source: 'He / like / play football', pattern: 'He likes + V-ing', answers: ['He likes playing football.', 'He likes playing football'] },
        ],
        tip: ['Can’t nghe giống can', 'Trong tiếng Anh Mỹ, can’t /kænt/ và can /kən/ dễ nhầm. Hãy chú ý nguyên âm dài hơn và có âm /t/ ở cuối của can’t.'],
      },
    ],
  },
];
