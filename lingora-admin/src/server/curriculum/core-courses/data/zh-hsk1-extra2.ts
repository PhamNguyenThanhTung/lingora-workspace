import type { UnitSpec } from '../types.ts';

/**
 * Chinese HSK 1 — extension units (8–10): home and school, asking and requests, city places and review.
 * Same conventions as zh-hsk1.ts: simplified characters, Hanyu Pinyin with tone marks.
 */
export const ZH_HSK1_EXTRA2_UNITS: UnitSpec[] = [
  {
    level: 'HSK1',
    names: { vi: 'Nhà cửa và trường học', en: 'Home and School' },
    lessons: [
      {
        title: { vi: 'Phòng ốc và đồ đạc', en: 'Rooms and Furniture' },
        intro: 'Bạn tả căn nhà hoặc phòng của mình: có những phòng nào, đồ đạc ở đâu. Bài này dạy tên phòng, đồ nội thất và mẫu 在…里 / 有.',
        vocab: [
          ['房间', 'fángjiān', 'noun', 'căn phòng', '我的房间很小。', 'Phòng của tôi rất nhỏ.'],
          ['厨房', 'chúfáng', 'noun', 'nhà bếp', '妈妈在厨房做饭。', 'Mẹ đang nấu cơm trong bếp.'],
          ['客厅', 'kètīng', 'noun', 'phòng khách', '爸爸在客厅看电视。', 'Bố đang xem tivi trong phòng khách.'],
          ['床', 'chuáng', 'noun', 'cái giường', '我的床很舒服。', 'Giường của tôi rất thoải mái.'],
          ['椅子', 'yǐzi', 'noun', 'cái ghế', '桌子旁边有一把椅子。', 'Bên cạnh bàn có một cái ghế.'],
          ['门', 'mén', 'noun', 'cửa ra vào', '请关门。', 'Xin hãy đóng cửa.'],
          ['窗户', 'chuānghu', 'noun', 'cửa sổ', '窗户是开着的。', 'Cửa sổ đang mở.'],
          ['灯', 'dēng', 'noun', 'đèn', '请开灯。', 'Xin hãy bật đèn.'],
          ['冰箱', 'bīngxiāng', 'noun', 'tủ lạnh', '冰箱里有牛奶。', 'Trong tủ lạnh có sữa.'],
          ['开', 'kāi', 'verb', 'mở, bật', '请开一下窗户。', 'Xin hãy mở cửa sổ một chút.'],
        ],
        grammar: {
          title: 'Nơi chốn + 有 + vật: 冰箱里有牛奶',
          explain: 'Để nói “ở … có …”, dùng cấu trúc nơi chốn + 有 + vật: 冰箱里有牛奶, 桌子上有一本书. Nơi chốn gồm danh từ + phương vị (里, 上, 旁边). Khác với 在: vật + 在 + nơi chốn (牛奶在冰箱里). Hãy chú ý thứ tự: 有 giới thiệu cái mới, 在 chỉ vị trí của vật đã biết. Phủ định của 有 là 没有.',
          examples: [
            ['冰箱里有牛奶。', 'Trong tủ lạnh có sữa.', 'Bīngxiāng lǐ yǒu niúnǎi.'],
            ['桌子旁边有一把椅子。', 'Bên cạnh bàn có một cái ghế.', 'Zhuōzi pángbiān yǒu yì bǎ yǐzi.'],
            ['妈妈在厨房做饭。', 'Mẹ đang nấu cơm trong bếp.', 'Māma zài chúfáng zuòfàn.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你家有几个房间？', 'Nhà bạn có mấy phòng?', 'Nǐ jiā yǒu jǐ ge fángjiān?'],
            ['阮', '有三个房间，一个客厅和一个厨房。', 'Có ba phòng, một phòng khách và một nhà bếp.', 'Yǒu sān ge fángjiān, yí ge kètīng hé yí ge chúfáng.'],
            ['李明', '你的房间里有什么？', 'Trong phòng bạn có gì?', 'Nǐ de fángjiān lǐ yǒu shénme?'],
            ['阮', '有一张床、一张桌子和一把椅子。', 'Có một cái giường, một cái bàn và một cái ghế.', 'Yǒu yì zhāng chuáng, yì zhāng zhuōzi hé yì bǎ yǐzi.'],
          ],
        },
        reorder: [
          ['冰箱|里|有|牛奶|。', 'Trong tủ lạnh có sữa.'],
          ['妈妈|在|厨房|做饭|。', 'Mẹ đang nấu cơm trong bếp.'],
        ],
        grammarQ: [
          { prompt: 'Nói trong tủ lạnh có sữa.', source: '冰箱 / 里 / 牛奶', pattern: 'Nơi chốn + 有 + N', answers: ['冰箱里有牛奶。', '冰箱里有牛奶'] },
          { prompt: 'Nói mẹ đang nấu cơm trong bếp.', source: '妈妈 / 厨房 / 做饭', pattern: 'S + 在 + nơi + V', answers: ['妈妈在厨房做饭。', '妈妈在厨房做饭'] },
        ],
        tip: ['Lượng từ đồ nội thất', 'Bàn, giường dùng 张; ghế dùng 把; cửa sổ dùng 扇; đèn dùng 盏. Ở HSK1 bạn có thể dùng 个 khi chưa nhớ lượng từ chuyên biệt.'],
      },
      {
        title: { vi: 'Trong lớp học', en: 'In the Classroom' },
        intro: 'Bạn hỏi bài thầy cô hoặc mượn đồ bạn học. Bài này dạy từ vựng lớp học và mẫu hỏi — đáp với 问 và 回答.',
        vocab: [
          ['教室', 'jiàoshì', 'noun', 'phòng học', '教室里有二十个学生。', 'Trong phòng học có hai mươi học sinh.'],
          ['同学', 'tóngxué', 'noun', 'bạn học', '他是我的同学。', 'Anh ấy là bạn học của tôi.'],
          ['课', 'kè', 'noun', 'tiết học, bài học', '今天下午有一节课。', 'Chiều nay có một tiết học.'],
          ['笔', 'bǐ', 'noun', 'cây bút', '你有笔吗？', 'Bạn có bút không?'],
          ['词典', 'cídiǎn', 'noun', 'từ điển', '我用词典查生词。', 'Tôi dùng từ điển tra từ mới.'],
          ['生词', 'shēngcí', 'noun', 'từ mới', '这个生词是什么意思？', 'Từ mới này nghĩa là gì?'],
          ['问题', 'wèntí', 'noun', 'câu hỏi, vấn đề', '老师，我有一个问题。', 'Thưa thầy, em có một câu hỏi.'],
          ['问', 'wèn', 'verb', 'hỏi', '我想问你一个问题。', 'Tôi muốn hỏi bạn một câu.'],
          ['回答', 'huídá', 'verb', 'trả lời', '请回答这个问题。', 'Xin hãy trả lời câu hỏi này.'],
          ['意思', 'yìsi', 'noun', 'ý nghĩa', '这个词是什么意思？', 'Từ này nghĩa là gì?'],
        ],
        grammar: {
          title: '问 + người + 问题 / 什么意思？',
          explain: 'Động từ 问 có thể có hai tân ngữ: 问 + người + câu hỏi (我问老师一个问题). Hỏi nghĩa của từ: 这个词是什么意思？ Khi không hiểu, nói 我不懂 / 我不知道 và nhờ nhắc lại: 请再说一遍 (xin hãy nói lại một lần). 请 + động từ là cách yêu cầu lịch sự: 请回答, 请坐.',
          examples: [
            ['我想问你一个问题。', 'Tôi muốn hỏi bạn một câu.', 'Wǒ xiǎng wèn nǐ yí ge wèntí.'],
            ['这个词是什么意思？', 'Từ này nghĩa là gì?', 'Zhège cí shì shénme yìsi?'],
            ['请回答这个问题。', 'Xin hãy trả lời câu hỏi này.', 'Qǐng huídá zhège wèntí.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '老师，我有一个问题。', 'Thưa thầy, em có một câu hỏi.', 'Lǎoshī, wǒ yǒu yí ge wèntí.'],
            ['老师', '请说。', 'Mời em nói.', 'Qǐng shuō.'],
            ['阮', '这个生词是什么意思？', 'Từ mới này nghĩa là gì ạ?', 'Zhège shēngcí shì shénme yìsi?'],
            ['老师', '你可以用词典查一下。', 'Em có thể dùng từ điển tra một chút.', 'Nǐ kěyǐ yòng cídiǎn chá yíxià.'],
          ],
        },
        reorder: [
          ['我|想|问|你|一个|问题|。', 'Tôi muốn hỏi bạn một câu.'],
          ['这个|词|是|什么|意思|？', 'Từ này nghĩa là gì?'],
        ],
        grammarQ: [
          { prompt: 'Hỏi nghĩa của từ này.', source: '这个词 / 什么意思', pattern: 'N + 是 + 什么意思？', answers: ['这个词是什么意思？', '这个词是什么意思?', '这个词是什么意思'] },
          { prompt: 'Nói tôi muốn hỏi bạn một câu.', source: '想 / 问 / 你 / 问题', pattern: 'S + 想问 + 你 + 一个问题', answers: ['我想问你一个问题。', '我想问你一个问题'] },
        ],
        tip: ['Xưng hô trong lớp', 'Gọi giáo viên là 老师, gọi bạn học là 同学. Không gọi giáo viên bằng tên đơn thuần.'],
      },
      {
        title: { vi: 'Sở thích và hoạt động', en: 'Hobbies and Activities' },
        intro: 'Bạn nói mình thích chơi thể thao gì, hát hay nhảy múa. Bài này dạy từ vựng sở thích và mẫu 喜欢 + động từ cùng 会 chỉ khả năng.',
        vocab: [
          ['唱歌', 'chàng gē', 'verb phrase', 'hát', '她喜欢唱歌。', 'Cô ấy thích hát.'],
          ['跳舞', 'tiào wǔ', 'verb phrase', 'nhảy múa', '我不会跳舞。', 'Tôi không biết nhảy.'],
          ['游泳', 'yóu yǒng', 'verb phrase', 'bơi', '夏天我常常去游泳。', 'Mùa hè tôi thường đi bơi.'],
          ['踢足球', 'tī zúqiú', 'verb phrase', 'đá bóng', '周末我们去踢足球。', 'Cuối tuần chúng tôi đi đá bóng.'],
          ['打篮球', 'dǎ lánqiú', 'verb phrase', 'chơi bóng rổ', '他喜欢打篮球。', 'Anh ấy thích chơi bóng rổ.'],
          ['运动', 'yùndòng', 'noun', 'vận động, thể thao', '你喜欢什么运动？', 'Bạn thích môn thể thao nào?'],
          ['画画', 'huà huà', 'verb phrase', 'vẽ tranh', '妹妹喜欢画画。', 'Em gái thích vẽ tranh.'],
          ['爱好', 'àihào', 'noun', 'sở thích', '你有什么爱好？', 'Bạn có sở thích gì?'],
          ['常常', 'chángcháng', 'adverb', 'thường xuyên', '我常常去公园跑步。', 'Tôi thường đến công viên chạy bộ.'],
          ['跑步', 'pǎo bù', 'verb phrase', 'chạy bộ', '早上我去跑步。', 'Buổi sáng tôi đi chạy bộ.'],
        ],
        grammar: {
          title: '喜欢 + động từ / 会 + động từ',
          explain: 'Sau 喜欢 có thể đặt thẳng động từ: 她喜欢唱歌 (cô ấy thích hát). Khả năng học được dùng 会: 我会游泳 (tôi biết bơi), 我不会跳舞 (tôi không biết nhảy). Hỏi sở thích: 你有什么爱好？ hoặc 你喜欢什么运动？ Trạng từ tần suất 常常 đứng trước động từ: 我常常去游泳.',
          examples: [
            ['她喜欢唱歌。', 'Cô ấy thích hát.', 'Tā xǐhuan chàng gē.'],
            ['我不会跳舞。', 'Tôi không biết nhảy.', 'Wǒ bú huì tiào wǔ.'],
            ['你有什么爱好？', 'Bạn có sở thích gì?', 'Nǐ yǒu shénme àihào?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你有什么爱好？', 'Bạn có sở thích gì?', 'Nǐ yǒu shénme àihào?'],
            ['阮', '我喜欢游泳，也喜欢踢足球。', 'Tôi thích bơi, cũng thích đá bóng.', 'Wǒ xǐhuan yóu yǒng, yě xǐhuan tī zúqiú.'],
            ['李明', '你会唱歌吗？', 'Bạn có biết hát không?', 'Nǐ huì chàng gē ma?'],
            ['阮', '我会，但是我不会跳舞。', 'Có, nhưng tôi không biết nhảy.', 'Wǒ huì, dànshì wǒ bú huì tiào wǔ.'],
          ],
        },
        reorder: [
          ['她|喜欢|唱歌|。', 'Cô ấy thích hát.'],
          ['你|有|什么|爱好|？', 'Bạn có sở thích gì?'],
        ],
        grammarQ: [
          { prompt: 'Nói cô ấy thích hát.', source: '她 / 喜欢 / 唱歌', pattern: 'S + 喜欢 + V', answers: ['她喜欢唱歌。', '她喜欢唱歌'] },
          { prompt: 'Nói tôi không biết nhảy.', source: '我 / 不会 / 跳舞', pattern: 'S + 不会 + V', answers: ['我不会跳舞。', '我不会跳舞'] },
        ],
        tip: ['会 và 能', '会 chỉ khả năng đã học được (biết bơi), 能 chỉ điều kiện cho phép (có thể bơi hôm nay vì trời đẹp). Hai từ này hay bị nhầm ở HSK1.'],
      },
    ],
  },
  {
    level: 'HSK1',
    names: { vi: 'Hỏi han và nhờ vả', en: 'Asking and Requests' },
    lessons: [
      {
        title: { vi: 'Biết và không biết (知道・懂・明白)', en: 'Knowing and Understanding' },
        intro: 'Bạn muốn nói “tôi biết”, “tôi không hiểu” hay xác nhận bạn đã hiểu. Bài này dạy ba động từ chỉ nhận thức 知道, 懂, 明白 và cách dùng 吗.',
        vocab: [
          ['知道', 'zhīdào', 'verb', 'biết (thông tin)', '我知道他的名字。', 'Tôi biết tên anh ấy.'],
          ['不知道', 'bù zhīdào', 'verb phrase', 'không biết', '我不知道他在哪儿。', 'Tôi không biết anh ấy ở đâu.'],
          ['懂', 'dǒng', 'verb', 'hiểu', '你懂我的意思吗？', 'Bạn có hiểu ý tôi không?'],
          ['明白', 'míngbai', 'verb', 'hiểu rõ', '老师说的话，我都明白了。', 'Những gì thầy nói tôi đều hiểu rồi.'],
          ['认识', 'rènshi', 'verb', 'quen biết', '你认识他吗？', 'Bạn có quen anh ấy không?'],
          ['记得', 'jìde', 'verb', 'nhớ', '你还记得我吗？', 'Bạn còn nhớ tôi không?'],
          ['忘', 'wàng', 'verb', 'quên', '我忘了他的电话号码。', 'Tôi quên số điện thoại của anh ấy.'],
          ['再说一遍', 'zài shuō yí biàn', 'phrase', 'nói lại một lần nữa', '请再说一遍。', 'Xin hãy nói lại một lần nữa.'],
          ['慢', 'màn', 'adjective', 'chậm', '请说慢一点儿。', 'Xin hãy nói chậm một chút.'],
          ['清楚', 'qīngchu', 'adjective', 'rõ ràng', '我听不清楚。', 'Tôi nghe không rõ.'],
        ],
        grammar: {
          title: '知道 / 懂 / 明白 và 了 (đã)',
          explain: '知道 là biết thông tin (我知道他的名字). 认识 là quen biết người (我认识他). 懂/明白 là hiểu (我懂了 – tôi hiểu rồi). Phủ định thông thường dùng 不: 不知道, 不懂. Với 了 ở cuối: 我明白了 (tôi hiểu rồi), 我忘了 (tôi quên mất rồi). Khi không nghe rõ, dùng 请再说一遍 và 请说慢一点儿.',
          examples: [
            ['我不知道他在哪儿。', 'Tôi không biết anh ấy ở đâu.', 'Wǒ bù zhīdào tā zài nǎr.'],
            ['请再说一遍。', 'Xin hãy nói lại một lần nữa.', 'Qǐng zài shuō yí biàn.'],
            ['请说慢一点儿。', 'Xin hãy nói chậm một chút.', 'Qǐng shuō màn yìdiǎnr.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你认识他吗？', 'Bạn có quen anh ấy không?', 'Nǐ rènshi tā ma?'],
            ['阮', '我不知道他是谁。', 'Tôi không biết anh ấy là ai.', 'Wǒ bù zhīdào tā shì shéi.'],
            ['老师', '你们懂了吗？', 'Các em hiểu rồi chứ?', 'Nǐmen dǒng le ma?'],
            ['阮', '对不起，请再说一遍，请说慢一点儿。', 'Xin lỗi, xin hãy nói lại một lần nữa, và nói chậm một chút.', 'Duìbuqǐ, qǐng zài shuō yí biàn, qǐng shuō màn yìdiǎnr.'],
          ],
        },
        reorder: [
          ['我|不|知道|他|在|哪儿|。', 'Tôi không biết anh ấy ở đâu.'],
          ['请|说|慢|一点儿|。', 'Xin hãy nói chậm một chút.'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi không biết anh ấy ở đâu.', source: '我 / 不知道 / 他 / 哪儿', pattern: 'S + 不知道 + clause', answers: ['我不知道他在哪儿。', '我不知道他在哪儿'] },
          { prompt: 'Nhờ ai đó nói chậm một chút.', source: '请 / 说 / 慢', pattern: '请 + V + Adj + 一点儿', answers: ['请说慢一点儿。', '请说慢一点儿'] },
        ],
        tip: ['Cách xin nói lại', 'Khi nghe không kịp, hai câu hữu ích nhất là 请再说一遍 và 请说慢一点儿. Người Trung Quốc rất sẵn lòng nhắc lại.'],
      },
      {
        title: { vi: 'Nhờ giúp, mượn và trả', en: 'Asking for Help, Borrowing and Returning' },
        intro: 'Bạn nhờ bạn cùng phòng giúp một việc hoặc mượn sách. Bài này dạy các động từ 帮, 借, 还, 给 và cách nhờ vả lịch sự bằng 请 và 可以…吗.',
        vocab: [
          ['帮', 'bāng', 'verb', 'giúp', '请你帮我一下。', 'Xin bạn giúp tôi một chút.'],
          ['帮忙', 'bāng máng', 'verb phrase', 'giúp đỡ', '谢谢你帮忙。', 'Cảm ơn bạn đã giúp đỡ.'],
          ['借', 'jiè', 'verb', 'mượn, cho mượn', '我可以借你的笔吗？', 'Tôi có thể mượn bút của bạn không?'],
          ['还', 'huán', 'verb', 'trả lại', '我明天还你书。', 'Ngày mai tôi trả sách cho bạn.'],
          ['拿', 'ná', 'verb', 'cầm, lấy', '请帮我拿一下书。', 'Xin giúp tôi cầm quyển sách.'],
          ['带', 'dài', 'verb', 'mang theo', '你带手机了吗？', 'Bạn có mang điện thoại không?'],
          ['需要', 'xūyào', 'verb', 'cần', '你需要帮忙吗？', 'Bạn có cần giúp không?'],
          ['麻烦', 'máfan', 'verb', 'làm phiền', '麻烦你了。', 'Làm phiền bạn rồi.'],
          ['当然', 'dāngrán', 'adverb', 'tất nhiên', '当然可以。', 'Tất nhiên là được.'],
          ['没问题', 'méi wèntí', 'phrase', 'không vấn đề gì', '没问题，我来帮你。', 'Không vấn đề gì, tôi giúp bạn.'],
        ],
        grammar: {
          title: '请你帮我… / 可以…吗？ / 给 + người + vật',
          explain: 'Cách nhờ lịch sự: 请你帮我 + động từ (请你帮我拿一下书). Xin phép: 我可以 + động từ + 吗？ (我可以借你的笔吗？). Trả lời: 可以 / 当然可以 / 没问题 hoặc 对不起，不行. 给 + người + vật nghĩa là đưa cho ai: 我给你一本书. Cảm ơn lịch sự khi nhờ: 麻烦你了.',
          examples: [
            ['请你帮我拿一下书。', 'Xin bạn giúp tôi cầm quyển sách.', 'Qǐng nǐ bāng wǒ ná yíxià shū.'],
            ['我可以借你的笔吗？', 'Tôi có thể mượn bút của bạn không?', 'Wǒ kěyǐ jiè nǐ de bǐ ma?'],
            ['我明天还你书。', 'Ngày mai tôi trả sách cho bạn.', 'Wǒ míngtiān huán nǐ shū.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '你需要帮忙吗？', 'Bạn có cần giúp không?', 'Nǐ xūyào bāng máng ma?'],
            ['李明', '请你帮我拿一下书，麻烦你了。', 'Xin bạn giúp tôi cầm quyển sách, làm phiền bạn rồi.', 'Qǐng nǐ bāng wǒ ná yíxià shū, máfan nǐ le.'],
            ['阮', '没问题。我可以借你的词典吗？', 'Không vấn đề gì. Tôi có thể mượn từ điển của bạn không?', 'Méi wèntí. Wǒ kěyǐ jiè nǐ de cídiǎn ma?'],
            ['李明', '当然可以。明天还我就好。', 'Tất nhiên được. Ngày mai trả tôi là được.', 'Dāngrán kěyǐ. Míngtiān huán wǒ jiù hǎo.'],
          ],
        },
        reorder: [
          ['请|你|帮|我|拿|一下|书|。', 'Xin bạn giúp tôi cầm quyển sách.'],
          ['我|可以|借|你|的|笔|吗|？', 'Tôi có thể mượn bút của bạn không?'],
        ],
        grammarQ: [
          { prompt: 'Xin mượn bút của bạn lịch sự.', source: '我 / 可以 / 借 / 你的笔', pattern: '我可以 + V + 吗？', answers: ['我可以借你的笔吗？', '我可以借你的笔吗?', '我可以借你的笔吗'] },
          { prompt: 'Nói ngày mai tôi trả sách cho bạn.', source: '明天 / 还 / 你 / 书', pattern: 'S + 还 + người + vật', answers: ['我明天还你书。', '我明天还你书'] },
        ],
        tip: ['还 có hai cách đọc', '还 đọc huán nghĩa là “trả lại”, đọc hái nghĩa là “vẫn, còn”. Ở bài này chỉ dùng nghĩa huán.'],
      },
      {
        title: { vi: 'Thời lượng và tần suất (多长时间・每)', en: 'Duration and Frequency' },
        intro: 'Bạn nói việc đó mất bao lâu, bao lâu làm một lần. Bài này dạy 多长时间, 每, 分钟, 一个星期 và vị trí của khoảng thời gian trong câu.',
        vocab: [
          ['分钟', 'fēnzhōng', 'noun', 'phút (khoảng thời gian)', '我走了十分钟。', 'Tôi đã đi bộ mười phút.'],
          ['多长时间', 'duō cháng shíjiān', 'phrase', 'bao lâu', '你学汉语学了多长时间？', 'Bạn học tiếng Hán được bao lâu rồi?'],
          ['每', 'měi', 'pronoun', 'mỗi', '我每个星期去一次游泳。', 'Mỗi tuần tôi đi bơi một lần.'],
          ['星期', 'xīngqī', 'noun', 'tuần', '一个星期有七天。', 'Một tuần có bảy ngày.'],
          ['天', 'tiān', 'noun', 'ngày', '我在北京住了三天。', 'Tôi ở Bắc Kinh ba ngày.'],
          ['半年', 'bàn nián', 'noun', 'nửa năm', '我学了半年汉语。', 'Tôi đã học tiếng Hán nửa năm.'],
          ['一年', 'yì nián', 'noun', 'một năm', '他在中国住了一年。', 'Anh ấy đã sống ở Trung Quốc một năm.'],
          ['久', 'jiǔ', 'adjective', 'lâu', '你等了很久吗？', 'Bạn đã đợi rất lâu à?'],
          ['马上', 'mǎshàng', 'adverb', 'lập tức, sắp', '我马上就到。', 'Tôi đến ngay đây.'],
          ['常', 'cháng', 'adverb', 'thường', '我常去那家店。', 'Tôi thường đến cửa hàng đó.'],
        ],
        grammar: {
          title: 'V + 了 + thời lượng: 学了半年 / 一个星期去一次',
          explain: 'Khoảng thời gian đứng sau động từ: 我学了半年汉语 (tôi học tiếng Hán nửa năm), 我走了十分钟 (tôi đi bộ mười phút). Hỏi bao lâu: 多长时间？ Tần suất: 每 + thời gian + V + số + 次 (我每个星期游泳一次). Lưu ý khác tiếng Việt: thời lượng đứng sau động từ, không đứng trước như từ chỉ thời điểm.',
          examples: [
            ['我学了半年汉语。', 'Tôi đã học tiếng Hán nửa năm.', 'Wǒ xué le bàn nián Hànyǔ.'],
            ['你学汉语学了多长时间？', 'Bạn học tiếng Hán được bao lâu rồi?', 'Nǐ xué Hànyǔ xué le duō cháng shíjiān?'],
            ['我每个星期去一次游泳。', 'Mỗi tuần tôi đi bơi một lần.', 'Wǒ měi ge xīngqī qù yí cì yóu yǒng.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你学汉语学了多长时间？', 'Bạn học tiếng Hán được bao lâu rồi?', 'Nǐ xué Hànyǔ xué le duō cháng shíjiān?'],
            ['阮', '我学了半年。每天学一个小时。', 'Tôi học nửa năm rồi. Mỗi ngày học một tiếng.', 'Wǒ xué le bàn nián. Měitiān xué yí ge xiǎoshí.'],
            ['李明', '你常常游泳吗？', 'Bạn có hay đi bơi không?', 'Nǐ chángcháng yóu yǒng ma?'],
            ['阮', '我每个星期去一次游泳。', 'Mỗi tuần tôi đi bơi một lần.', 'Wǒ měi ge xīngqī qù yí cì yóu yǒng.'],
          ],
        },
        reorder: [
          ['我|学|了|半年|汉语|。', 'Tôi đã học tiếng Hán nửa năm.'],
          ['我|每个|星期|去|一次|游泳|。', 'Mỗi tuần tôi đi bơi một lần.'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi đã học tiếng Hán nửa năm.', source: '学 / 半年 / 汉语', pattern: 'S + V + 了 + thời lượng + N', answers: ['我学了半年汉语。', '我学了半年汉语'] },
          { prompt: 'Hỏi bạn học tiếng Hán được bao lâu rồi.', source: '学汉语 / 多长时间', pattern: 'S + V + O + V + 了 + 多长时间？', answers: ['你学汉语学了多长时间？', '你学汉语学了多长时间?', '你学汉语学了多长时间'] },
        ],
        tip: ['Thời lượng sau động từ', 'Thời điểm (昨天, 下午) đứng trước động từ, còn thời lượng (三天, 半年) đứng sau động từ. Hãy phân biệt hai loại này.'],
      },
    ],
  },
  {
    level: 'HSK1',
    names: { vi: 'Thành phố và tổng ôn', en: 'City Life and Review' },
    lessons: [
      {
        title: { vi: 'Địa điểm trong thành phố', en: 'Places in the City' },
        intro: 'Bạn hỏi và chỉ đường đến công viên, thư viện hay bưu điện. Bài này dạy tên địa điểm trong thành phố và mẫu 在…附近.',
        vocab: [
          ['公园', 'gōngyuán', 'noun', 'công viên', '公园里有很多人。', 'Trong công viên có rất nhiều người.'],
          ['图书馆', 'túshūguǎn', 'noun', 'thư viện', '图书馆在学校旁边。', 'Thư viện ở bên cạnh trường.'],
          ['邮局', 'yóujú', 'noun', 'bưu điện', '我去邮局寄信。', 'Tôi đi bưu điện gửi thư.'],
          ['饭店', 'fàndiàn', 'noun', 'nhà hàng, khách sạn', '这家饭店的菜很好吃。', 'Món của nhà hàng này rất ngon.'],
          ['超级市场', 'chāojí shìchǎng', 'noun', 'đại siêu thị', '超级市场很大。', 'Đại siêu thị rất lớn.'],
          ['地方', 'dìfang', 'noun', 'nơi, chỗ', '这是一个很漂亮的地方。', 'Đây là một nơi rất đẹp.'],
          ['附近', 'fùjìn', 'noun', 'gần đây, lân cận', '附近有没有银行？', 'Gần đây có ngân hàng không?'],
          ['对面', 'duìmiàn', 'noun', 'đối diện', '邮局在银行对面。', 'Bưu điện ở đối diện ngân hàng.'],
          ['中间', 'zhōngjiān', 'noun', 'ở giữa', '公园在两家商店中间。', 'Công viên ở giữa hai cửa hàng.'],
          ['寄', 'jì', 'verb', 'gửi (thư, bưu kiện)', '我想寄一封信。', 'Tôi muốn gửi một lá thư.'],
        ],
        grammar: {
          title: 'Chỉ vị trí: 在…附近 / 在…对面 / 有没有…？',
          explain: 'Vật + 在 + địa điểm + phương vị: 邮局在银行对面 (bưu điện ở đối diện ngân hàng). Hỏi có hay không: 附近有没有银行？ — 有 / 没有. Hỏi nơi: 邮局在哪儿？ Phương vị: 旁边, 对面, 中间, 前面, 后面, 里. Mẫu A 在 B 的 + phương vị cũng dùng được: 图书馆在学校的旁边.',
          examples: [
            ['邮局在银行对面。', 'Bưu điện ở đối diện ngân hàng.', 'Yóujú zài yínháng duìmiàn.'],
            ['附近有没有银行？', 'Gần đây có ngân hàng không?', 'Fùjìn yǒu méiyǒu yínháng?'],
            ['图书馆在学校旁边。', 'Thư viện ở bên cạnh trường.', 'Túshūguǎn zài xuéxiào pángbiān.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '请问，附近有没有邮局？', 'Xin hỏi, gần đây có bưu điện không?', 'Qǐngwèn, fùjìn yǒu méiyǒu yóujú?'],
            ['路人', '有，邮局在银行对面。', 'Có, bưu điện ở đối diện ngân hàng.', 'Yǒu, yóujú zài yínháng duìmiàn.'],
            ['阮', '图书馆在哪儿？', 'Thư viện ở đâu ạ?', 'Túshūguǎn zài nǎr?'],
            ['路人', '图书馆在学校旁边，很近。', 'Thư viện ở bên cạnh trường, rất gần.', 'Túshūguǎn zài xuéxiào pángbiān, hěn jìn.'],
          ],
        },
        reorder: [
          ['邮局|在|银行|对面|。', 'Bưu điện ở đối diện ngân hàng.'],
          ['附近|有|没有|银行|？', 'Gần đây có ngân hàng không?'],
        ],
        grammarQ: [
          { prompt: 'Nói bưu điện ở đối diện ngân hàng.', source: '邮局 / 银行 / 对面', pattern: 'A + 在 + B + 对面', answers: ['邮局在银行对面。', '邮局在银行对面'] },
          { prompt: 'Hỏi gần đây có ngân hàng không.', source: '附近 / 银行 / 有没有', pattern: '附近有没有 + N？', answers: ['附近有没有银行？', '附近有没有银行?', '附近有没有银行'] },
        ],
        tip: ['请问 mở đầu câu hỏi đường', 'Khi hỏi đường, luôn mở đầu bằng 请问 (xin hỏi). Nghe lịch sự hơn rất nhiều so với hỏi thẳng.'],
      },
      {
        title: { vi: 'Phương tiện và lộ trình', en: 'Transport and Routes' },
        intro: 'Bạn đi xe buýt, xe đạp hay taxi. Bài này dạy các phương tiện thông dụng, từ 站, 路 và mẫu 坐…到.',
        vocab: [
          ['公共汽车', 'gōnggòng qìchē', 'noun', 'xe buýt', '我坐公共汽车去学校。', 'Tôi đi xe buýt đến trường.'],
          ['自行车', 'zìxíngchē', 'noun', 'xe đạp', '他骑自行车上班。', 'Anh ấy đi xe đạp đi làm.'],
          ['骑', 'qí', 'verb', 'cưỡi, đi (xe đạp)', '我喜欢骑自行车。', 'Tôi thích đi xe đạp.'],
          ['开车', 'kāi chē', 'verb phrase', 'lái xe', '爸爸每天开车上班。', 'Bố mỗi ngày lái xe đi làm.'],
          ['汽车', 'qìchē', 'noun', 'ô tô', '这辆汽车很新。', 'Chiếc ô tô này rất mới.'],
          ['站', 'zhàn', 'noun', 'trạm, bến', '下一站是图书馆。', 'Trạm tiếp theo là thư viện.'],
          ['下车', 'xià chē', 'verb phrase', 'xuống xe', '我在这儿下车。', 'Tôi xuống xe ở đây.'],
          ['上车', 'shàng chē', 'verb phrase', 'lên xe', '请上车。', 'Mời lên xe.'],
          ['路口', 'lùkǒu', 'noun', 'ngã tư', '在前面的路口左转。', 'Rẽ trái ở ngã tư phía trước.'],
          ['辆', 'liàng', 'measure word', 'chiếc (xe)', '我有一辆自行车。', 'Tôi có một chiếc xe đạp.'],
        ],
        grammar: {
          title: '坐 / 骑 / 开 + phương tiện + 去…',
          explain: 'Cách đi: 坐 + phương tiện công cộng (坐公共汽车, 坐地铁), 骑 + xe hai bánh (骑自行车), 开 + xe tự lái (开车). Mẫu: 我坐公共汽车去学校. Chỉ đường: 在前面的路口左转 (rẽ trái ở ngã tư phía trước). Hỏi cách đi: 怎么去？ — 坐几路车？ Lượng từ của xe là 辆.',
          examples: [
            ['我坐公共汽车去学校。', 'Tôi đi xe buýt đến trường.', 'Wǒ zuò gōnggòng qìchē qù xuéxiào.'],
            ['他骑自行车上班。', 'Anh ấy đi xe đạp đi làm.', 'Tā qí zìxíngchē shàngbān.'],
            ['在前面的路口左转。', 'Rẽ trái ở ngã tư phía trước.', 'Zài qiánmiàn de lùkǒu zuǒ zhuǎn.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你怎么去学校？', 'Bạn đến trường bằng cách nào?', 'Nǐ zěnme qù xuéxiào?'],
            ['阮', '我坐公共汽车去学校。', 'Tôi đi xe buýt đến trường.', 'Wǒ zuò gōnggòng qìchē qù xuéxiào.'],
            ['李明', '要坐多长时间？', 'Phải đi mất bao lâu?', 'Yào zuò duō cháng shíjiān?'],
            ['阮', '二十分钟，下一站就是学校。', 'Hai mươi phút, trạm tiếp theo chính là trường.', 'Èrshí fēnzhōng, xià yí zhàn jiù shì xuéxiào.'],
          ],
        },
        reorder: [
          ['我|坐|公共汽车|去|学校|。', 'Tôi đi xe buýt đến trường.'],
          ['他|骑|自行车|上班|。', 'Anh ấy đi xe đạp đi làm.'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi đi xe buýt đến trường.', source: '坐 / 公共汽车 / 去学校', pattern: 'S + 坐 + phương tiện + 去 + nơi', answers: ['我坐公共汽车去学校。', '我坐公共汽车去学校'] },
          { prompt: 'Nói anh ấy đi xe đạp đi làm.', source: '他 / 骑 / 自行车 / 上班', pattern: 'S + 骑 + xe đạp + V', answers: ['他骑自行车上班。', '他骑自行车上班'] },
        ],
        tip: ['Chọn động từ theo phương tiện', 'Nhớ: 坐 cho xe công cộng (ngồi), 骑 cho xe hai bánh, 开 cho xe mình tự lái. Dùng đúng động từ giúp câu nghe tự nhiên.'],
      },
      {
        title: { vi: 'Tổng ôn HSK1: giới thiệu bản thân', en: 'HSK1 Review: Introducing Yourself' },
        intro: 'Bài cuối ôn lại toàn bộ HSK1: bạn tự giới thiệu 1 phút với tên, tuổi, quốc tịch, nghề, gia đình, sở thích, rồi hỏi lại người đối diện.',
        vocab: [
          ['自己', 'zìjǐ', 'pronoun', 'bản thân', '我想介绍一下自己。', 'Tôi muốn giới thiệu bản thân một chút.'],
          ['介绍', 'jièshào', 'verb', 'giới thiệu', '我来介绍一下，这是我的朋友。', 'Để tôi giới thiệu, đây là bạn của tôi.'],
          ['认识你', 'rènshi nǐ', 'phrase', 'quen biết bạn', '很高兴认识你。', 'Rất vui được quen bạn.'],
          ['高兴', 'gāoxìng', 'adjective', 'vui', '我今天很高兴。', 'Hôm nay tôi rất vui.'],
          ['住', 'zhù', 'verb', 'ở, sống', '我住在河内。', 'Tôi sống ở Hà Nội.'],
          ['大学', 'dàxué', 'noun', 'đại học', '我在大学学习汉语。', 'Tôi học tiếng Hán ở đại học.'],
          ['专业', 'zhuānyè', 'noun', 'chuyên ngành', '你的专业是什么？', 'Chuyên ngành của bạn là gì?'],
          ['希望', 'xīwàng', 'verb', 'hy vọng', '我希望去中国学习。', 'Tôi hy vọng đi Trung Quốc học.'],
          ['以后', 'yǐhòu', 'noun', 'sau này', '以后我想当老师。', 'Sau này tôi muốn làm giáo viên.'],
          ['请多关照', 'qǐng duō guānzhào', 'phrase', 'xin được giúp đỡ nhiều', '请多关照！', 'Xin được giúp đỡ nhiều!'],
        ],
        grammar: {
          title: 'Ôn tập: 我叫… / 我是… / 我在…工作 / 我喜欢…',
          explain: 'Một bài tự giới thiệu HSK1 kết hợp nhiều mẫu: 我叫 + tên, 我是 + quốc tịch/nghề, 我住在 + nơi, 我在 + nơi + 工作/学习, 我喜欢 + động từ, 我有 + người nhà. Kết thúc bằng 请多关照! Gợi ý trình tự: tên → quê → nơi sống → nghề → sở thích → lời kết. Nói ngắn, rõ, giữ đúng thanh điệu.',
          examples: [
            ['我想介绍一下自己。', 'Tôi muốn giới thiệu bản thân một chút.', 'Wǒ xiǎng jièshào yíxià zìjǐ.'],
            ['我住在河内。', 'Tôi sống ở Hà Nội.', 'Wǒ zhù zài Hénèi.'],
            ['我希望去中国学习。', 'Tôi hy vọng đi Trung Quốc học.', 'Wǒ xīwàng qù Zhōngguó xuéxí.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '你好，我想介绍一下自己。我叫阮明，是越南人。', 'Xin chào, tôi muốn giới thiệu bản thân một chút. Tôi tên là Nguyễn Minh, là người Việt Nam.', 'Nǐ hǎo, wǒ xiǎng jièshào yíxià zìjǐ. Wǒ jiào Ruǎn Míng, shì Yuènán rén.'],
            ['阮', '我住在河内，在大学学习汉语。', 'Tôi sống ở Hà Nội, học tiếng Hán ở đại học.', 'Wǒ zhù zài Hénèi, zài dàxué xuéxí Hànyǔ.'],
            ['阮', '我喜欢游泳，我希望去中国学习。', 'Tôi thích bơi, tôi hy vọng đi Trung Quốc học.', 'Wǒ xǐhuan yóu yǒng, wǒ xīwàng qù Zhōngguó xuéxí.'],
            ['李明', '很高兴认识你，请多关照！', 'Rất vui được quen bạn, xin được giúp đỡ nhiều!', 'Hěn gāoxìng rènshi nǐ, qǐng duō guānzhào!'],
          ],
        },
        reorder: [
          ['我|住|在|河内|。', 'Tôi sống ở Hà Nội.'],
          ['我|希望|去|中国|学习|。', 'Tôi hy vọng đi Trung Quốc học.'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi sống ở Hà Nội.', source: '我 / 住 / 河内', pattern: 'S + 住在 + nơi', answers: ['我住在河内。', '我住在河内'] },
          { prompt: 'Nói tôi hy vọng đi Trung Quốc học.', source: '我 / 希望 / 去中国 / 学习', pattern: 'S + 希望 + V', answers: ['我希望去中国学习。', '我希望去中国学习'] },
        ],
        tip: ['Chặng cuối HSK1', 'Hoàn thành bài này nghĩa là bạn đã nắm vững nền tảng. Hãy tập tự giới thiệu to thành tiếng 3 lần, chú ý thanh điệu.'],
      },
    ],
  },
];
