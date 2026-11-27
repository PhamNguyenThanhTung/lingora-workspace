import type { UnitSpec } from '../types.ts';

/**
 * Chinese HSK 1 — Beginner (simplified characters, Hanyu Pinyin with tone marks).
 * Can-do: greet and introduce yourself, talk about family and things, tell the time, order food,
 * shop and ask the way using short everyday sentences.
 */
export const ZH_HSK1_UNITS: UnitSpec[] = [
  {
    level: 'HSK1',
    names: { vi: 'Làm quen và giới thiệu', en: 'Meeting People' },
    lessons: [
      {
        title: { vi: 'Chào hỏi cơ bản', en: 'Basic Greetings' },
        intro: 'Bạn gặp một người bạn Trung Quốc lần đầu. Sau bài này bạn biết chào hỏi, hỏi tên, cảm ơn, xin lỗi và tạm biệt bằng những câu tiếng Trung ngắn, đúng thanh điệu.',
        vocab: [
          ['你好', 'nǐ hǎo', 'phrase', 'xin chào', '你好，我叫李明。', 'Xin chào, tôi tên là Lý Minh.'],
          ['您好', 'nín hǎo', 'phrase', 'xin chào (kính trọng)', '老师，您好！', 'Chào thầy/cô ạ!'],
          ['谢谢', 'xièxie', 'verb', 'cảm ơn', '谢谢你的帮助。', 'Cảm ơn sự giúp đỡ của bạn.'],
          ['不客气', 'bú kèqi', 'phrase', 'không có gì', '不客气，请坐。', 'Không có gì, mời ngồi.'],
          ['对不起', 'duìbuqǐ', 'phrase', 'xin lỗi', '对不起，我来晚了。', 'Xin lỗi, tôi đến muộn.'],
          ['没关系', 'méi guānxi', 'phrase', 'không sao đâu', '没关系，我们等你。', 'Không sao, chúng tôi đợi bạn.'],
          ['再见', 'zàijiàn', 'phrase', 'tạm biệt', '明天见，再见！', 'Mai gặp, tạm biệt!'],
          ['请', 'qǐng', 'verb', 'mời; xin vui lòng', '请坐，请喝茶。', 'Mời ngồi, mời uống trà.'],
          ['叫', 'jiào', 'verb', 'tên là, gọi là', '我叫王芳。', 'Tôi tên là Vương Phương.'],
          ['名字', 'míngzi', 'noun', 'tên', '你叫什么名字？', 'Bạn tên là gì?'],
        ],
        grammar: {
          title: '你好 / 我叫… / 你叫什么名字？',
          explain: 'Lời chào cơ bản là 你好 (nǐ hǎo); với người lớn tuổi hoặc cần kính trọng dùng 您好. Giới thiệu tên bằng 我叫 + tên. Hỏi tên: 你叫什么名字？ (nǐ jiào shénme míngzi). Trong tiếng Trung, câu hỏi dùng từ để hỏi (什么) không đổi trật tự từ như tiếng Việt; chỉ cần đặt 什么 vào vị trí của thông tin cần hỏi.',
          examples: [
            ['你好，我叫李明。', 'Xin chào, tôi tên là Lý Minh.', 'Nǐ hǎo, wǒ jiào Lǐ Míng.'],
            ['你叫什么名字？', 'Bạn tên là gì?', 'Nǐ jiào shénme míngzi?'],
            ['谢谢，不客气。', 'Cảm ơn — không có gì.', 'Xièxie, bú kèqi.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你好！我叫李明。你叫什么名字？', 'Xin chào! Tôi tên là Lý Minh. Bạn tên là gì?', 'Nǐ hǎo! Wǒ jiào Lǐ Míng. Nǐ jiào shénme míngzi?'],
            ['阮', '你好，我叫阮明。', 'Xin chào, tôi tên là Nguyễn Minh.', 'Nǐ hǎo, wǒ jiào Ruǎn Míng.'],
            ['李明', '很高兴认识你。', 'Rất vui được làm quen với bạn.', 'Hěn gāoxìng rènshi nǐ.'],
            ['阮', '我也是。谢谢你，再见！', 'Tôi cũng vậy. Cảm ơn bạn, tạm biệt!', 'Wǒ yě shì. Xièxie nǐ, zàijiàn!'],
          ],
        },
        reorder: [
          ['你|叫|什么|名字|？', 'Bạn tên là gì?'],
          ['我|叫|王芳|。', 'Tôi tên là Vương Phương.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi tên người đối diện bằng 什么.', source: '你 / 名字', pattern: '你叫什么名字？', answers: ['你叫什么名字？', '你叫什么名字?', '你叫什么名字'] },
        ],
        tip: ['Thanh điệu quyết định nghĩa', 'Tiếng Trung có 4 thanh điệu và thanh nhẹ. 妈 (mā), 麻 (má), 马 (mǎ), 骂 (mà) khác nhau hoàn toàn về nghĩa. Hãy luyện đọc to và bắt chước người bản xứ ngay từ đầu.'],
      },
      {
        title: { vi: 'Tôi là… (是 và 吗)', en: 'I Am… (shì and ma)' },
        intro: 'Bạn muốn nói mình là ai, làm nghề gì và là người nước nào. Bài này dạy động từ 是, cách phủ định 不 và câu hỏi có/không với 吗.',
        vocab: [
          ['我', 'wǒ', 'pronoun', 'tôi', '我是学生。', 'Tôi là học sinh.'],
          ['你', 'nǐ', 'pronoun', 'bạn', '你是老师吗？', 'Bạn là giáo viên à?'],
          ['他', 'tā', 'pronoun', 'anh ấy', '他是医生。', 'Anh ấy là bác sĩ.'],
          ['是', 'shì', 'verb', 'là', '我是越南人。', 'Tôi là người Việt Nam.'],
          ['不', 'bù', 'adverb', 'không', '我不是老师。', 'Tôi không phải là giáo viên.'],
          ['学生', 'xuésheng', 'noun', 'học sinh', '她是大学生。', 'Cô ấy là sinh viên đại học.'],
          ['老师', 'lǎoshī', 'noun', 'giáo viên', '王老师很好。', 'Thầy Vương rất tốt.'],
          ['医生', 'yīshēng', 'noun', 'bác sĩ', '他是医生。', 'Anh ấy là bác sĩ.'],
          ['人', 'rén', 'noun', 'người', '你是哪国人？', 'Bạn là người nước nào?'],
          ['中国', 'Zhōngguó', 'proper noun', 'Trung Quốc', '我想去中国。', 'Tôi muốn đi Trung Quốc.'],
        ],
        grammar: {
          title: 'A 是 B / A 不是 B / …吗？',
          explain: 'Câu khẳng định với 是: A 是 B (A là B): 我是学生. Phủ định đặt 不 trước 是: 我不是老师 (chú ý 不 + thanh 4 đọc thành bú: bú shì). Câu hỏi có/không chỉ cần thêm 吗 ở cuối: 你是老师吗？ Trả lời khẳng định: 是 / 是的; phủ định: 不是. Hỏi quốc tịch: 你是哪国人？ (nǎ guó rén).',
          examples: [
            ['我是学生。', 'Tôi là học sinh.', 'Wǒ shì xuésheng.'],
            ['他不是老师。', 'Anh ấy không phải là giáo viên.', 'Tā bú shì lǎoshī.'],
            ['你是中国人吗？', 'Bạn là người Trung Quốc à?', 'Nǐ shì Zhōngguó rén ma?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你是中国人吗？', 'Bạn là người Trung Quốc à?', 'Nǐ shì Zhōngguó rén ma?'],
            ['阮', '不是，我是越南人。你是老师吗？', 'Không, tôi là người Việt Nam. Bạn là giáo viên à?', 'Bú shì, wǒ shì Yuènán rén. Nǐ shì lǎoshī ma?'],
            ['李明', '不是，我是学生。他是老师。', 'Không, tôi là học sinh. Anh ấy là giáo viên.', 'Bú shì, wǒ shì xuésheng. Tā shì lǎoshī.'],
            ['阮', '哦，王老师很好。', 'Ồ, thầy Vương rất tốt.', 'Ó, Wáng lǎoshī hěn hǎo.'],
          ],
        },
        reorder: [
          ['我|是|学生|。', 'Tôi là học sinh.'],
          ['你|是|中国人|吗|？', 'Bạn là người Trung Quốc à?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi không phải là giáo viên”.', source: '我 / 老师', pattern: '我不是……', answers: ['我不是老师。', '我不是老师'] },
          { prompt: 'Hỏi “Bạn là giáo viên à?” bằng 吗.', source: '你 / 老师', pattern: '你是……吗？', answers: ['你是老师吗？', '你是老师吗?', '你是老师吗'] },
        ],
        tip: ['不 đổi thanh', 'Khi 不 đứng trước âm tiết thanh 4 thì đọc thành thanh 2: 不是 đọc là “bú shì”. Dù vậy trong pinyin chuẩn vẫn viết bù; nhiều sách ghi bú để tiện luyện đọc.'],
      },
      {
        title: { vi: 'Số đếm, tuổi và số điện thoại', en: 'Numbers, Age and Phone Numbers' },
        intro: 'Bạn muốn nói tuổi, số điện thoại và đếm số lượng nhỏ. Sau bài này bạn biết đếm từ 1 đến 100, hỏi tuổi với 几 và 多大, và đọc số điện thoại.',
        vocab: [
          ['一', 'yī', 'number', 'một', '我有一个哥哥。', 'Tôi có một người anh trai.'],
          ['二', 'èr', 'number', 'hai (số thứ tự)', '二月是冬天。', 'Tháng Hai là mùa đông.'],
          ['三', 'sān', 'number', 'ba', '我家有三口人。', 'Nhà tôi có ba người.'],
          ['四', 'sì', 'number', 'bốn', '他有四本书。', 'Anh ấy có bốn quyển sách.'],
          ['五', 'wǔ', 'number', 'năm', '现在五点。', 'Bây giờ là năm giờ.'],
          ['十', 'shí', 'number', 'mười', '十个学生在教室里。', 'Mười học sinh đang ở trong lớp.'],
          ['百', 'bǎi', 'number', 'trăm', '一百块钱。', 'Một trăm đồng.'],
          ['岁', 'suì', 'measure word', 'tuổi', '我今年二十岁。', 'Năm nay tôi hai mươi tuổi.'],
          ['几', 'jǐ', 'pronoun', 'mấy', '你有几个朋友？', 'Bạn có mấy người bạn?'],
          ['电话号码', 'diànhuà hàomǎ', 'noun', 'số điện thoại', '你的电话号码是多少？', 'Số điện thoại của bạn là bao nhiêu?'],
        ],
        grammar: {
          title: 'Số đếm 1–100, 几 / 多大 và lượng từ 岁',
          explain: 'Các số 1–10: yī, èr, sān, sì, wǔ, liù, qī, bā, jiǔ, shí. Số từ 11–19: 十 + số (十一). Hàng chục: 二十, 三十…; ghép 二十五. Số 2 đọc là 二 khi đếm hoặc số điện thoại, còn dùng 两 (liǎng) trước lượng từ. Hỏi tuổi trẻ nhỏ: 你几岁？; hỏi tuổi người lớn: 你多大？; kính trọng: 您多大年纪？ Số điện thoại đọc từng chữ số, số 1 thường đọc là yāo.',
          examples: [
            ['我二十五岁。', 'Tôi hai mươi lăm tuổi.', 'Wǒ èrshíwǔ suì.'],
            ['你今年多大？', 'Năm nay bạn bao nhiêu tuổi?', 'Nǐ jīnnián duō dà?'],
            ['我的电话号码是一三八，一二三四，五六七八。', 'Số điện thoại của tôi là 138-1234-5678.', 'Wǒ de diànhuà hàomǎ shì yāo sān bā, yāo èr sān sì, wǔ liù qī bā.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你今年多大？', 'Năm nay bạn bao nhiêu tuổi?', 'Nǐ jīnnián duō dà?'],
            ['阮', '我今年二十岁。你呢？', 'Năm nay tôi hai mươi tuổi. Còn bạn?', 'Wǒ jīnnián èrshí suì. Nǐ ne?'],
            ['李明', '我二十五岁。你的电话号码是多少？', 'Tôi hai mươi lăm tuổi. Số điện thoại của bạn là bao nhiêu?', 'Wǒ èrshíwǔ suì. Nǐ de diànhuà hàomǎ shì duōshao?'],
            ['阮', '是一三八，一二三四，五六七八。', 'Là 138-1234-5678.', 'Shì yāo sān bā, yāo èr sān sì, wǔ liù qī bā.'],
          ],
        },
        reorder: [
          ['我|今年|二十岁|。', 'Năm nay tôi hai mươi tuổi.'],
          ['你|的|电话号码|是|多少|？', 'Số điện thoại của bạn là bao nhiêu?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Năm nay tôi hai mươi tuổi”.', source: '我 / 二十 / 岁', pattern: '我今年……岁。', answers: ['我今年二十岁。', '我今年二十岁', '我二十岁。', '我二十岁'] },
        ],
        tip: ['Số 1 trong số điện thoại', 'Khi đọc số điện thoại hoặc số phòng, 一 thường đọc là “yāo” để tránh nhầm với 七 (qī). Ví dụ 110 đọc là “yāo yāo líng”.'],
      },
    ],
  },
  {
    level: 'HSK1',
    names: { vi: 'Đồ vật và gia đình', en: 'Things and Family' },
    lessons: [
      {
        title: { vi: 'Đây là gì? (这・那・的)', en: 'What Is This? (zhè, nà, de)' },
        intro: 'Bạn muốn hỏi và gọi tên đồ vật xung quanh. Bài này dạy 这, 那, từ để hỏi 什么 / 谁 và trợ từ sở hữu 的.',
        vocab: [
          ['这', 'zhè', 'pronoun', 'đây, này', '这是我的书。', 'Đây là sách của tôi.'],
          ['那', 'nà', 'pronoun', 'đó, kia', '那是谁的包？', 'Kia là túi của ai?'],
          ['什么', 'shénme', 'pronoun', 'cái gì', '这是什么？', 'Đây là cái gì?'],
          ['谁', 'shéi', 'pronoun', 'ai', '他是谁？', 'Anh ấy là ai?'],
          ['的', 'de', 'particle', 'của', '这是老师的书。', 'Đây là sách của thầy.'],
          ['书', 'shū', 'noun', 'sách', '我喜欢看书。', 'Tôi thích đọc sách.'],
          ['杯子', 'bēizi', 'noun', 'cái cốc', '这是我的杯子。', 'Đây là cốc của tôi.'],
          ['手机', 'shǒujī', 'noun', 'điện thoại di động', '他的手机很新。', 'Điện thoại của anh ấy rất mới.'],
          ['桌子', 'zhuōzi', 'noun', 'cái bàn', '桌子上有一本书。', 'Trên bàn có một quyển sách.'],
          ['东西', 'dōngxi', 'noun', 'đồ đạc', '这些东西是谁的？', 'Những thứ này là của ai?'],
        ],
        grammar: {
          title: '这 / 那 + 是 + N, 什么 / 谁, và 的',
          explain: '这 (zhè) chỉ vật gần, 那 (nà) chỉ vật xa. Mẫu: 这是 + danh từ; 那不是 + danh từ. Câu hỏi dùng 什么 (cái gì) hoặc 谁 (ai) ở đúng vị trí cần hỏi: 这是什么？ 那是谁？ Trợ từ 的 nối người sở hữu với vật: 我的书 (sách của tôi). Với người thân hoặc cụm thân thiết có thể lược 的: 我妈妈, 我朋友.',
          examples: [
            ['这是我的书。', 'Đây là sách của tôi.', 'Zhè shì wǒ de shū.'],
            ['那是什么？', 'Kia là cái gì?', 'Nà shì shénme?'],
            ['这是谁的手机？', 'Đây là điện thoại của ai?', 'Zhè shì shéi de shǒujī?'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '请问，这是什么？', 'Xin hỏi, đây là cái gì?', 'Qǐngwèn, zhè shì shénme?'],
            ['李明', '这是我的手机。', 'Đây là điện thoại của tôi.', 'Zhè shì wǒ de shǒujī.'],
            ['阮', '那是谁的书？', 'Kia là sách của ai?', 'Nà shì shéi de shū?'],
            ['李明', '那是老师的书。', 'Đó là sách của thầy giáo.', 'Nà shì lǎoshī de shū.'],
          ],
        },
        reorder: [
          ['这|是|我|的|书|。', 'Đây là sách của tôi.'],
          ['那|是|谁|的|书|？', 'Kia là sách của ai?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Đây là sách của tôi” bằng 的.', source: '这 / 我 / 书', pattern: '这是……的……。', answers: ['这是我的书。', '这是我的书'] },
        ],
        tip: ['这 đọc zhè hay zhèi', 'Trong khẩu ngữ, người miền Bắc thường đọc 这 là “zhèi” (và 那 là “nèi”) khi đi với lượng từ. Cách viết giống nhau, bạn chỉ cần nghe quen.'],
      },
      {
        title: { vi: 'Gia đình của tôi (有・没有)', en: 'My Family (you, meiyou)' },
        intro: 'Bạn muốn giới thiệu gia đình với bạn mới. Bài này dạy từ chỉ người thân, mẫu 有 / 没有 và lượng từ 口 (số người), 个.',
        vocab: [
          ['家', 'jiā', 'noun', 'nhà, gia đình', '我家有五口人。', 'Nhà tôi có năm người.'],
          ['爸爸', 'bàba', 'noun', 'bố', '我爸爸是医生。', 'Bố tôi là bác sĩ.'],
          ['妈妈', 'māma', 'noun', 'mẹ', '我妈妈是老师。', 'Mẹ tôi là giáo viên.'],
          ['哥哥', 'gēge', 'noun', 'anh trai', '我有一个哥哥。', 'Tôi có một người anh trai.'],
          ['姐姐', 'jiějie', 'noun', 'chị gái', '我姐姐在北京工作。', 'Chị gái tôi làm việc ở Bắc Kinh.'],
          ['弟弟', 'dìdi', 'noun', 'em trai', '我弟弟很小。', 'Em trai tôi còn nhỏ.'],
          ['妹妹', 'mèimei', 'noun', 'em gái', '我妹妹喜欢唱歌。', 'Em gái tôi thích hát.'],
          ['有', 'yǒu', 'verb', 'có', '我有两个朋友。', 'Tôi có hai người bạn.'],
          ['没有', 'méiyǒu', 'verb', 'không có', '我没有妹妹。', 'Tôi không có em gái.'],
          ['口', 'kǒu', 'measure word', '(lượng từ cho số người trong gia đình)', '你家有几口人？', 'Nhà bạn có mấy người?'],
        ],
        grammar: {
          title: '有 / 没有 + 数量 + 名词',
          explain: '有 diễn đạt sở hữu hoặc tồn tại: 我有哥哥 (tôi có anh trai). Phủ định dùng 没有 (không dùng 不有): 我没有妹妹. Khi có số lượng, cần lượng từ: 一个哥哥, 两个朋友 (số 2 đọc là 两 trước lượng từ). Với số người trong gia đình dùng lượng từ 口: 我家有五口人. Hỏi số lượng: 几 + lượng từ + danh từ.',
          examples: [
            ['我有一个哥哥和一个妹妹。', 'Tôi có một anh trai và một em gái.', 'Wǒ yǒu yí gè gēge hé yí gè mèimei.'],
            ['我没有姐姐。', 'Tôi không có chị gái.', 'Wǒ méiyǒu jiějie.'],
            ['你家有几口人？', 'Nhà bạn có mấy người?', 'Nǐ jiā yǒu jǐ kǒu rén?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你家有几口人？', 'Nhà bạn có mấy người?', 'Nǐ jiā yǒu jǐ kǒu rén?'],
            ['阮', '我家有四口人：爸爸、妈妈、妹妹和我。', 'Nhà tôi có bốn người: bố, mẹ, em gái và tôi.', 'Wǒ jiā yǒu sì kǒu rén: bàba, māma, mèimei hé wǒ.'],
            ['李明', '你有哥哥吗？', 'Bạn có anh trai không?', 'Nǐ yǒu gēge ma?'],
            ['阮', '我没有哥哥，我有一个妹妹。', 'Tôi không có anh trai, tôi có một em gái.', 'Wǒ méiyǒu gēge, wǒ yǒu yí gè mèimei.'],
          ],
        },
        reorder: [
          ['你|家|有|几|口|人|？', 'Nhà bạn có mấy người?'],
          ['我|没有|哥哥|。', 'Tôi không có anh trai.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi không có em gái” bằng 没有.', source: '我 / 妹妹', pattern: '我没有……。', answers: ['我没有妹妹。', '我没有妹妹'] },
        ],
        tip: ['没有 chứ không phải 不有', 'Phủ định của 有 luôn là 没有 (méiyǒu), không bao giờ là 不有. Trong khẩu ngữ có thể rút gọn thành 没.'],
      },
      {
        title: { vi: 'Mô tả người và vật (很 + tính từ)', en: 'Describing People and Things' },
        intro: 'Bạn muốn nhận xét một người cao, một món ăn ngon hay trời nóng. Bài này dạy tính từ làm vị ngữ với 很, phủ định bằng 不 và mẫu 吗/呢.',
        vocab: [
          ['很', 'hěn', 'adverb', 'rất', '这个菜很好吃。', 'Món này rất ngon.'],
          ['大', 'dà', 'adjective', 'to, lớn', '这个房间很大。', 'Phòng này rất rộng.'],
          ['小', 'xiǎo', 'adjective', 'nhỏ', '我的狗很小。', 'Con chó của tôi rất nhỏ.'],
          ['高', 'gāo', 'adjective', 'cao', '他哥哥很高。', 'Anh trai anh ấy rất cao.'],
          ['好吃', 'hǎochī', 'adjective', 'ngon', '中国菜很好吃。', 'Món Trung Quốc rất ngon.'],
          ['好看', 'hǎokàn', 'adjective', 'đẹp, dễ nhìn', '这件衣服很好看。', 'Bộ quần áo này rất đẹp.'],
          ['贵', 'guì', 'adjective', 'đắt', '这本书不贵。', 'Quyển sách này không đắt.'],
          ['便宜', 'piányi', 'adjective', 'rẻ', '这里的水果很便宜。', 'Hoa quả ở đây rất rẻ.'],
          ['新', 'xīn', 'adjective', 'mới', '我有一个新手机。', 'Tôi có một chiếc điện thoại mới.'],
          ['忙', 'máng', 'adjective', 'bận', '最近很忙。', 'Dạo này rất bận.'],
        ],
        grammar: {
          title: 'Chủ ngữ + 很 + tính từ',
          explain: 'Trong tiếng Trung, tính từ làm vị ngữ trực tiếp, không cần 是: 他很高 (anh ấy cao), không phải 他是高. Thường thêm 很 trước tính từ: 这个菜很好吃. 很 ở đây gần như không nhấn mạnh; nếu bỏ 很 câu mang nghĩa so sánh ngầm. Phủ định: 不 + tính từ (不贵). Câu hỏi: tính từ + 吗 hoặc dạng 好不好. Hỏi lại cùng chủ đề: 你呢？',
          examples: [
            ['这个菜很好吃。', 'Món này rất ngon.', 'Zhège cài hěn hǎochī.'],
            ['这本书不贵。', 'Quyển sách này không đắt.', 'Zhè běn shū bú guì.'],
            ['你最近忙吗？', 'Dạo này bạn có bận không?', 'Nǐ zuìjìn máng ma?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你最近忙吗？', 'Dạo này bạn có bận không?', 'Nǐ zuìjìn máng ma?'],
            ['阮', '很忙。你呢？', 'Rất bận. Còn bạn?', 'Hěn máng. Nǐ ne?'],
            ['李明', '我不太忙。这个菜很好吃，你尝尝。', 'Tôi không bận lắm. Món này rất ngon, bạn nếm thử đi.', 'Wǒ bú tài máng. Zhège cài hěn hǎochī, nǐ chángchang.'],
            ['阮', '谢谢！这本书不贵，你也看看吧。', 'Cảm ơn! Quyển sách này không đắt, bạn cũng xem đi.', 'Xièxie! Zhè běn shū bú guì, nǐ yě kànkan ba.'],
          ],
        },
        reorder: [
          ['这个|菜|很|好吃|。', 'Món này rất ngon.'],
          ['这本|书|不|贵|。', 'Quyển sách này không đắt.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Món này rất ngon” (tính từ làm vị ngữ, thêm 很).', source: '这个菜 / 好吃', pattern: 'S + 很 + Adj。', answers: ['这个菜很好吃。', '这个菜很好吃'] },
        ],
        tip: ['Không cần 是 trước tính từ', 'Người học Việt hay nói “他是很高”. Câu đúng là 他很高. Chỉ dùng 是 khi nối với danh từ (他是老师) hoặc để nhấn mạnh.'],
      },
    ],
  },
  {
    level: 'HSK1',
    names: { vi: 'Một ngày của tôi', en: 'My Day' },
    lessons: [
      {
        title: { vi: 'Thời gian và thói quen hằng ngày', en: 'Time and Daily Routines' },
        intro: 'Bạn muốn kể mình dậy, đi học, ăn cơm và đi ngủ lúc mấy giờ. Bài này dạy cách nói giờ với 点 và 分, từ chỉ thời gian và vị trí của thời gian trong câu.',
        vocab: [
          ['现在', 'xiànzài', 'noun', 'bây giờ', '现在几点？', 'Bây giờ là mấy giờ?'],
          ['点', 'diǎn', 'measure word', 'giờ (đúng)', '我七点起床。', 'Tôi thức dậy lúc bảy giờ.'],
          ['分', 'fēn', 'measure word', 'phút', '现在八点十分。', 'Bây giờ là tám giờ mười phút.'],
          ['起床', 'qǐchuáng', 'verb', 'thức dậy', '我每天早上六点起床。', 'Mỗi sáng tôi dậy lúc sáu giờ.'],
          ['睡觉', 'shuìjiào', 'verb', 'đi ngủ', '我晚上十一点睡觉。', 'Buổi tối tôi đi ngủ lúc mười một giờ.'],
          ['上班', 'shàngbān', 'verb', 'đi làm', '爸爸八点上班。', 'Bố tôi đi làm lúc tám giờ.'],
          ['吃饭', 'chīfàn', 'verb', 'ăn cơm', '我们十二点吃饭。', 'Chúng tôi ăn cơm lúc mười hai giờ.'],
          ['每天', 'měitiān', 'noun', 'mỗi ngày', '我每天学习汉语。', 'Mỗi ngày tôi học tiếng Hán.'],
          ['早上', 'zǎoshang', 'noun', 'buổi sáng', '早上我喝牛奶。', 'Buổi sáng tôi uống sữa.'],
          ['晚上', 'wǎnshang', 'noun', 'buổi tối', '晚上我看电视。', 'Buổi tối tôi xem tivi.'],
        ],
        grammar: {
          title: 'Chủ ngữ + thời gian + động từ',
          explain: 'Trong tiếng Trung, từ chỉ thời gian đứng trước động từ (sau chủ ngữ hoặc đầu câu): 我七点起床; 每天早上我六点起床. Cách nói giờ: số + 点 (七点), phút: số + 分 (七点十分); “rưỡi” là 半 (七点半); “kém 15” dùng 差 (差五分八点). Hỏi giờ: 现在几点？ Không cần giới từ như tiếng Việt “lúc”.',
          examples: [
            ['我每天早上七点起床。', 'Mỗi sáng tôi dậy lúc bảy giờ.', 'Wǒ měitiān zǎoshang qī diǎn qǐchuáng.'],
            ['现在几点？', 'Bây giờ là mấy giờ?', 'Xiànzài jǐ diǎn?'],
            ['我晚上十一点睡觉。', 'Buổi tối tôi đi ngủ lúc mười một giờ.', 'Wǒ wǎnshang shíyī diǎn shuìjiào.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你每天几点起床？', 'Mỗi ngày bạn dậy lúc mấy giờ?', 'Nǐ měitiān jǐ diǎn qǐchuáng?'],
            ['阮', '我每天早上六点起床。你呢？', 'Mỗi sáng tôi dậy lúc sáu giờ. Còn bạn?', 'Wǒ měitiān zǎoshang liù diǎn qǐchuáng. Nǐ ne?'],
            ['李明', '我七点起床。你几点上班？', 'Tôi dậy lúc bảy giờ. Bạn đi làm lúc mấy giờ?', 'Wǒ qī diǎn qǐchuáng. Nǐ jǐ diǎn shàngbān?'],
            ['阮', '我八点上班，晚上十一点睡觉。', 'Tôi đi làm lúc tám giờ, buổi tối đi ngủ lúc mười một giờ.', 'Wǒ bā diǎn shàngbān, wǎnshang shíyī diǎn shuìjiào.'],
          ],
        },
        reorder: [
          ['我|每天|早上|六点|起床|。', 'Mỗi sáng tôi dậy lúc sáu giờ.'],
          ['现在|几点|？', 'Bây giờ là mấy giờ?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi dậy lúc bảy giờ”.', source: '我 / 七点 / 起床', pattern: '我 + 时间 + 动词。', answers: ['我七点起床。', '我七点起床'] },
        ],
        tip: ['Thời gian đứng trước động từ', 'Khác với tiếng Việt (“tôi dậy lúc bảy giờ”), tiếng Trung đặt thời điểm trước động từ: 我七点起床. Đặt sau (我起床七点) là sai.'],
      },
      {
        title: { vi: 'Ăn uống và sở thích (想・喜欢)', en: 'Food, Drinks and Likes' },
        intro: 'Bạn đi ăn cùng bạn Trung Quốc và muốn gọi món, nói mình thích gì. Bài này dạy 想, 喜欢, 要 và từ vựng ăn uống.',
        vocab: [
          ['吃', 'chī', 'verb', 'ăn', '我想吃米饭。', 'Tôi muốn ăn cơm.'],
          ['喝', 'hē', 'verb', 'uống', '你想喝什么？', 'Bạn muốn uống gì?'],
          ['米饭', 'mǐfàn', 'noun', 'cơm', '我每天吃米饭。', 'Mỗi ngày tôi ăn cơm.'],
          ['面条', 'miàntiáo', 'noun', 'mì sợi', '我喜欢吃面条。', 'Tôi thích ăn mì.'],
          ['水', 'shuǐ', 'noun', 'nước', '请给我一杯水。', 'Cho tôi một cốc nước.'],
          ['茶', 'chá', 'noun', 'trà', '爸爸喜欢喝茶。', 'Bố tôi thích uống trà.'],
          ['咖啡', 'kāfēi', 'noun', 'cà phê', '我不喝咖啡。', 'Tôi không uống cà phê.'],
          ['想', 'xiǎng', 'verb', 'muốn; nhớ', '我想喝水。', 'Tôi muốn uống nước.'],
          ['喜欢', 'xǐhuan', 'verb', 'thích', '我喜欢中国菜。', 'Tôi thích món Trung Quốc.'],
          ['菜', 'cài', 'noun', 'món ăn; rau', '这个菜很好吃。', 'Món này rất ngon.'],
        ],
        grammar: {
          title: '想 + V, 喜欢 + N/V, 要 + N',
          explain: '想 + động từ = muốn làm gì (我想喝茶). 喜欢 + danh từ/động từ = thích (我喜欢面条; 我喜欢喝茶). 要 dùng khi gọi món hoặc đòi hỏi trực tiếp: 我要一杯茶. 想 nhẹ nhàng, lịch sự hơn 要. Phủ định: 不想, 不喜欢. Câu hỏi: 你想吃什么？ (bạn muốn ăn gì?).',
          examples: [
            ['我想喝茶。', 'Tôi muốn uống trà.', 'Wǒ xiǎng hē chá.'],
            ['我喜欢吃面条。', 'Tôi thích ăn mì.', 'Wǒ xǐhuan chī miàntiáo.'],
            ['你想吃什么？', 'Bạn muốn ăn gì?', 'Nǐ xiǎng chī shénme?'],
          ],
        },
        dialogue: {
          lines: [
            ['服务员', '你们想吃什么？', 'Các bạn muốn ăn gì ạ?', 'Nǐmen xiǎng chī shénme?'],
            ['李明', '我想吃米饭和这个菜。你呢？', 'Tôi muốn ăn cơm và món này. Còn bạn?', 'Wǒ xiǎng chī mǐfàn hé zhège cài. Nǐ ne?'],
            ['阮', '我喜欢吃面条。', 'Tôi thích ăn mì.', 'Wǒ xǐhuan chī miàntiáo.'],
            ['服务员', '喝点儿什么？', 'Các bạn uống gì ạ?', 'Hē diǎnr shénme?'],
            ['李明', '我们喝茶。', 'Chúng tôi uống trà.', 'Wǒmen hē chá.'],
          ],
        },
        reorder: [
          ['我|想|喝|茶|。', 'Tôi muốn uống trà.'],
          ['我|喜欢|吃|面条|。', 'Tôi thích ăn mì.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi muốn uống trà” bằng 想.', source: '我 / 喝 / 茶', pattern: '我想 + V + N。', answers: ['我想喝茶。', '我想喝茶'] },
          { prompt: 'Nói “Tôi thích ăn mì” bằng 喜欢.', source: '我 / 吃 / 面条', pattern: '我喜欢 + V + N。', answers: ['我喜欢吃面条。', '我喜欢吃面条'] },
        ],
        tip: ['想 có hai nghĩa', '想 vừa là “muốn” (想喝茶) vừa là “nhớ” (我想家 = tôi nhớ nhà). Ngữ cảnh quyết định: trước động từ là “muốn”, trước danh từ chỉ người hoặc nơi chốn thường là “nhớ”.'],
      },
      {
        title: { vi: 'Nơi chốn và vị trí (在・哪儿)', en: 'Places and Locations (zai, nar)' },
        intro: 'Bạn muốn nói ai đang ở đâu, vật gì ở đâu và hỏi vị trí. Bài này dạy 在, 哪儿, và các từ phương vị 上, 下, 里, 前, 后.',
        vocab: [
          ['在', 'zài', 'verb', 'ở, tại', '我在家。', 'Tôi đang ở nhà.'],
          ['哪儿', 'nǎr', 'pronoun', 'ở đâu', '你在哪儿？', 'Bạn đang ở đâu?'],
          ['学校', 'xuéxiào', 'noun', 'trường học', '我在学校学习汉语。', 'Tôi học tiếng Hán ở trường.'],
          ['商店', 'shāngdiàn', 'noun', 'cửa hàng', '商店在银行旁边。', 'Cửa hàng ở cạnh ngân hàng.'],
          ['医院', 'yīyuàn', 'noun', 'bệnh viện', '医院在学校后面。', 'Bệnh viện ở phía sau trường.'],
          ['上', 'shàng', 'noun', 'trên', '书在桌子上。', 'Sách ở trên bàn.'],
          ['下', 'xià', 'noun', 'dưới', '猫在椅子下。', 'Mèo ở dưới ghế.'],
          ['里', 'lǐ', 'noun', 'trong', '手机在包里。', 'Điện thoại ở trong túi.'],
          ['前面', 'qiánmiàn', 'noun', 'phía trước', '车站在学校前面。', 'Bến xe ở phía trước trường.'],
          ['旁边', 'pángbiān', 'noun', 'bên cạnh', '我家在公园旁边。', 'Nhà tôi ở cạnh công viên.'],
        ],
        grammar: {
          title: 'S + 在 + nơi chốn / N + 在 + 方位',
          explain: '在 mang nghĩa “ở” khi dùng như động từ chính: 我在学校 (tôi ở trường). Hỏi vị trí: 你在哪儿？ (nǐ zài nǎr). Mẫu vị trí vật: Vật + 在 + nơi chốn + từ phương vị: 书在桌子上 (sách ở trên bàn), 手机在包里. Từ phương vị gồm 上, 下, 里, 前面, 后面, 旁边, 左边, 右边. Phủ định: 不在 (bú zài).',
          examples: [
            ['我在学校。', 'Tôi ở trường.', 'Wǒ zài xuéxiào.'],
            ['书在桌子上。', 'Sách ở trên bàn.', 'Shū zài zhuōzi shàng.'],
            ['商店在银行旁边。', 'Cửa hàng ở cạnh ngân hàng.', 'Shāngdiàn zài yínháng pángbiān.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '请问，医院在哪儿？', 'Xin hỏi, bệnh viện ở đâu ạ?', 'Qǐngwèn, yīyuàn zài nǎr?'],
            ['路人', '医院在学校后面。', 'Bệnh viện ở phía sau trường học.', 'Yīyuàn zài xuéxiào hòumiàn.'],
            ['李明', '商店在哪儿？', 'Cửa hàng ở đâu ạ?', 'Shāngdiàn zài nǎr?'],
            ['路人', '商店在银行旁边。', 'Cửa hàng ở cạnh ngân hàng.', 'Shāngdiàn zài yínháng pángbiān.'],
          ],
        },
        reorder: [
          ['书|在|桌子|上|。', 'Sách ở trên bàn.'],
          ['医院|在|学校|后面|。', 'Bệnh viện ở phía sau trường.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Sách ở trên bàn” bằng 在.', source: '书 / 桌子 / 上', pattern: 'N + 在 + 地点 + 方位。', answers: ['书在桌子上。', '书在桌子上'] },
        ],
        tip: ['在 và 有', '“书在桌子上” (sách ở trên bàn) nhấn vật cụ thể ở đâu; “桌子上有书” (trên bàn có sách) nhấn trên bàn có gì. Hai mẫu này dùng khác nhau tùy thông tin đã biết.'],
      },
    ],
  },
  {
    level: 'HSK1',
    names: { vi: 'Mua sắm và đi lại', en: 'Shopping and Getting Around' },
    lessons: [
      {
        title: { vi: 'Mua sắm và hỏi giá (多少钱)', en: 'Shopping and Prices' },
        intro: 'Bạn vào cửa hàng ở Trung Quốc, muốn hỏi giá và mặc cả nhẹ. Bài này dạy 多少钱, cách đọc số tiền với 块 và 毛, và các câu thường dùng khi mua đồ.',
        vocab: [
          ['多少钱', 'duōshao qián', 'phrase', 'bao nhiêu tiền', '这个多少钱？', 'Cái này bao nhiêu tiền?'],
          ['块', 'kuài', 'measure word', 'đồng (tiền khẩu ngữ)', '这件衣服五十块。', 'Bộ quần áo này năm mươi đồng.'],
          ['买', 'mǎi', 'verb', 'mua', '我想买一件衣服。', 'Tôi muốn mua một cái áo.'],
          ['卖', 'mài', 'verb', 'bán', '这里卖水果吗？', 'Ở đây có bán hoa quả không?'],
          ['苹果', 'píngguǒ', 'noun', 'quả táo', '苹果三块钱一斤。', 'Táo ba đồng một cân.'],
          ['衣服', 'yīfu', 'noun', 'quần áo', '这件衣服很好看。', 'Bộ quần áo này rất đẹp.'],
          ['钱', 'qián', 'noun', 'tiền', '我没有钱。', 'Tôi không có tiền.'],
          ['太', 'tài', 'adverb', 'quá', '太贵了，便宜一点吧。', 'Đắt quá, bớt chút đi.'],
          ['一点儿', 'yìdiǎnr', 'quantity', 'một chút', '请便宜一点儿。', 'Xin bớt một chút.'],
          ['个', 'gè', 'measure word', 'cái (lượng từ chung)', '我要两个苹果。', 'Tôi lấy hai quả táo.'],
        ],
        grammar: {
          title: '多少钱 / 数 + 块 / 太…了 / 要 + 数量',
          explain: 'Hỏi giá: 这个多少钱？ Trả lời: số + 块 (五十块); giá lẻ thêm 毛 (một đồng = 10 毛). Muốn mua: 我要 + số lượng + lượng từ + danh từ (我要两个苹果). 太 + tính từ + 了 diễn tả “quá…” (太贵了). Để mặc cả nhẹ: 便宜一点儿吧 (bớt một chút nhé). Lượng từ 个 dùng được với nhiều danh từ.',
          examples: [
            ['这件衣服多少钱？', 'Bộ quần áo này bao nhiêu tiền?', 'Zhè jiàn yīfu duōshao qián?'],
            ['我要两个苹果。', 'Tôi lấy hai quả táo.', 'Wǒ yào liǎng gè píngguǒ.'],
            ['太贵了，便宜一点儿吧。', 'Đắt quá, bớt một chút nhé.', 'Tài guì le, piányi yìdiǎnr ba.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '你好，这件衣服多少钱？', 'Xin chào, bộ quần áo này bao nhiêu tiền?', 'Nǐ hǎo, zhè jiàn yīfu duōshao qián?'],
            ['店员', '一百块。', 'Một trăm đồng.', 'Yì bǎi kuài.'],
            ['阮', '太贵了，便宜一点儿吧。', 'Đắt quá, bớt một chút nhé.', 'Tài guì le, piányi yìdiǎnr ba.'],
            ['店员', '八十块，你买吗？', 'Tám mươi đồng, bạn có mua không?', 'Bāshí kuài, nǐ mǎi ma?'],
            ['阮', '好，我买。', 'Được, tôi mua.', 'Hǎo, wǒ mǎi.'],
          ],
        },
        reorder: [
          ['这个|多少|钱|？', 'Cái này bao nhiêu tiền?'],
          ['我|要|两|个|苹果|。', 'Tôi lấy hai quả táo.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi giá của bộ quần áo này.', source: '这件衣服', pattern: '……多少钱？', answers: ['这件衣服多少钱？', '这件衣服多少钱?', '这件衣服多少钱'] },
        ],
        tip: ['块 và 元', 'Khi nói chuyện người Trung dùng 块 (kuài), còn trên hóa đơn, biển giá ghi 元 (yuán). Cùng nghĩa, nhưng 块 khẩu ngữ hơn, 元 trang trọng hơn.'],
      },
      {
        title: { vi: 'Đi lại và hỏi đường (坐・去)', en: 'Getting Around' },
        intro: 'Bạn cần hỏi đường, đi tàu điện ngầm hay taxi. Bài này dạy 去, 坐, 怎么 + động từ và cách chỉ đường cơ bản.',
        vocab: [
          ['去', 'qù', 'verb', 'đi', '我去学校。', 'Tôi đi đến trường.'],
          ['来', 'lái', 'verb', 'đến', '请来我家玩。', 'Xin mời đến nhà tôi chơi.'],
          ['坐', 'zuò', 'verb', 'ngồi; đi (xe)', '我坐地铁去公司。', 'Tôi đi tàu điện ngầm đến công ty.'],
          ['地铁', 'dìtiě', 'noun', 'tàu điện ngầm', '地铁很方便。', 'Tàu điện ngầm rất tiện.'],
          ['出租车', 'chūzūchē', 'noun', 'taxi', '我们坐出租车去机场。', 'Chúng tôi đi taxi ra sân bay.'],
          ['飞机', 'fēijī', 'noun', 'máy bay', '我坐飞机去北京。', 'Tôi đi máy bay đến Bắc Kinh.'],
          ['怎么', 'zěnme', 'pronoun', 'như thế nào', '去机场怎么走？', 'Đi đến sân bay thế nào?'],
          ['走', 'zǒu', 'verb', 'đi bộ; rời đi', '从这儿往前走。', 'Từ đây đi thẳng về phía trước.'],
          ['左', 'zuǒ', 'noun', 'bên trái', '往左走就到了。', 'Rẽ trái là đến.'],
          ['右', 'yòu', 'noun', 'bên phải', '银行在右边。', 'Ngân hàng ở bên phải.'],
        ],
        grammar: {
          title: '坐 + phương tiện + 去 / 怎么 + 走 / 往 + hướng + 走',
          explain: 'Mẫu chỉ phương tiện: 坐 + phương tiện + 去 + nơi chốn (我坐地铁去公司). Hỏi cách đi: 去 + nơi chốn + 怎么走？ Chỉ đường dùng 往 + hướng + 走: 往前走, 往左走, 往右走. 就到了 nghĩa là “là đến nơi”. Hỏi gần/xa: 远不远？ Chú ý: 坐 dùng cho xe có ghế ngồi (tàu, taxi, máy bay), còn xe đạp, xe máy dùng 骑.',
          examples: [
            ['我坐地铁去公司。', 'Tôi đi tàu điện ngầm đến công ty.', 'Wǒ zuò dìtiě qù gōngsī.'],
            ['去机场怎么走？', 'Đi đến sân bay thế nào?', 'Qù jīchǎng zěnme zǒu?'],
            ['往前走，往右走就到了。', 'Đi thẳng, rẽ phải là đến.', 'Wǎng qián zǒu, wǎng yòu zǒu jiù dào le.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '请问，去机场怎么走？', 'Xin hỏi, đi sân bay thế nào ạ?', 'Qǐngwèn, qù jīchǎng zěnme zǒu?'],
            ['路人', '你可以坐地铁去。', 'Bạn có thể đi tàu điện ngầm.', 'Nǐ kěyǐ zuò dìtiě qù.'],
            ['阮', '地铁站在哪儿？', 'Ga tàu điện ngầm ở đâu ạ?', 'Dìtiězhàn zài nǎr?'],
            ['路人', '往前走，往右走就到了。', 'Đi thẳng, rẽ phải là đến.', 'Wǎng qián zǒu, wǎng yòu zǒu jiù dào le.'],
          ],
        },
        reorder: [
          ['我|坐|地铁|去|公司|。', 'Tôi đi tàu điện ngầm đến công ty.'],
          ['去|机场|怎么|走|？', 'Đi sân bay thế nào?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi đi tàu điện ngầm đến công ty” bằng 坐.', source: '我 / 地铁 / 公司', pattern: '我坐 + 交通工具 + 去 + 地点。', answers: ['我坐地铁去公司。', '我坐地铁去公司'] },
        ],
        tip: ['Hỏi đường lịch sự', 'Bắt đầu bằng 请问 (xin hỏi) và kết thúc bằng 谢谢. Người Trung Quốc thường chỉ đường bằng cả tay; hãy chú ý tay họ để hiểu nhanh hơn.'],
      },
      {
        title: { vi: 'Hoạt động cuối tuần (会・能・了)', en: 'Weekend Activities' },
        intro: 'Bạn muốn kể cuối tuần đã làm gì và nói mình biết làm gì. Bài này dạy 了 chỉ hành động đã xảy ra, 会 (biết làm nhờ học) và 能 (có khả năng, được phép).',
        vocab: [
          ['周末', 'zhōumò', 'noun', 'cuối tuần', '周末你做什么？', 'Cuối tuần bạn làm gì?'],
          ['昨天', 'zuótiān', 'noun', 'hôm qua', '昨天我去商店了。', 'Hôm qua tôi đã đi đến cửa hàng.'],
          ['明天', 'míngtiān', 'noun', 'ngày mai', '明天我想看电影。', 'Ngày mai tôi muốn xem phim.'],
          ['看', 'kàn', 'verb', 'xem, nhìn', '我们去看电影吧。', 'Chúng ta đi xem phim nhé.'],
          ['电影', 'diànyǐng', 'noun', 'phim', '我喜欢看电影。', 'Tôi thích xem phim.'],
          ['听', 'tīng', 'verb', 'nghe', '我爱听音乐。', 'Tôi thích nghe nhạc.'],
          ['说', 'shuō', 'verb', 'nói', '他会说汉语。', 'Anh ấy biết nói tiếng Hán.'],
          ['会', 'huì', 'verb', 'biết (làm)', '我会做饭。', 'Tôi biết nấu cơm.'],
          ['能', 'néng', 'verb', 'có thể, được phép', '你能来吗？', 'Bạn có thể đến không?'],
          ['朋友', 'péngyou', 'noun', 'bạn bè', '我和朋友一起去玩。', 'Tôi cùng bạn đi chơi.'],
        ],
        grammar: {
          title: 'Động từ + 了 / 会 + V / 能 + V',
          explain: '了 đặt sau động từ để chỉ hành động đã hoàn thành: 昨天我看了电影 (hôm qua tôi đã xem phim). Trong câu ngắn, 了 thường đứng cuối câu: 我去商店了. Phủ định dùng 没(有) và bỏ 了: 昨天我没去. 会 + V: biết làm nhờ học (我会说汉语). 能 + V: có khả năng hoặc được phép (你能来吗？). Với tính chất kỹ năng đã học thì dùng 会, với điều kiện cho phép dùng 能.',
          examples: [
            ['昨天我去商店了。', 'Hôm qua tôi đã đi đến cửa hàng.', 'Zuótiān wǒ qù shāngdiàn le.'],
            ['我会说汉语。', 'Tôi biết nói tiếng Hán.', 'Wǒ huì shuō Hànyǔ.'],
            ['你明天能来吗？', 'Ngày mai bạn có thể đến không?', 'Nǐ míngtiān néng lái ma?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '周末你做什么了？', 'Cuối tuần bạn đã làm gì?', 'Zhōumò nǐ zuò shénme le?'],
            ['阮', '我和朋友去看电影了。', 'Tôi cùng bạn đi xem phim.', 'Wǒ hé péngyou qù kàn diànyǐng le.'],
            ['李明', '你会说汉语，电影看懂了吗？', 'Bạn biết nói tiếng Hán, phim xem hiểu không?', 'Nǐ huì shuō Hànyǔ, diànyǐng kàn dǒng le ma?'],
            ['阮', '会一点儿。明天你能来我家吗？', 'Hiểu một chút. Ngày mai bạn có thể đến nhà tôi không?', 'Huì yìdiǎnr. Míngtiān nǐ néng lái wǒ jiā ma?'],
          ],
        },
        reorder: [
          ['昨天|我|去|商店|了|。', 'Hôm qua tôi đã đi đến cửa hàng.'],
          ['我|会|说|汉语|。', 'Tôi biết nói tiếng Hán.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Hôm qua tôi đã đi đến cửa hàng” (dùng 了).', source: '昨天 / 我 / 去 / 商店', pattern: '……了。', answers: ['昨天我去商店了。', '昨天我去商店了', '我昨天去商店了。', '我昨天去商店了'] },
        ],
        tip: ['了 không phải “thì quá khứ”', 'Tiếng Trung không chia động từ theo thì. 了 chỉ hoàn thành, không phải quá khứ tuyệt đối: 明天我吃了饭就去 (ngày mai ăn cơm xong là đi) vẫn dùng 了 cho hành động tương lai đã hoàn thành.'],
      },
    ],
  },
];
