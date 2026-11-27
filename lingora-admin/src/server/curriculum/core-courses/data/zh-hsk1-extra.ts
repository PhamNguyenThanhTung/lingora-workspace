import type { UnitSpec } from '../types.ts';

/**
 * Chinese HSK 1 — extension units (5–7): calendar and festivals, people and appearance, food/clothes/shopping.
 * Same conventions as zh-hsk1.ts: simplified characters, Hanyu Pinyin with tone marks.
 */
export const ZH_HSK1_EXTRA_UNITS: UnitSpec[] = [
  {
    level: 'HSK1',
    names: { vi: 'Lịch và ngày lễ', en: 'Calendar and Festivals' },
    lessons: [
      {
        title: { vi: 'Thứ, ngày và tháng (星期・月・号)', en: 'Days, Dates and Months' },
        intro: 'Bạn hẹn bạn bè vào thứ Bảy hoặc hỏi hôm nay là ngày mấy. Bài này dạy tên các thứ, cách đọc tháng, ngày và mẫu câu hỏi ngày tháng.',
        vocab: [
          ['星期一', 'xīngqī yī', 'noun', 'thứ Hai', '星期一我去上班。', 'Thứ Hai tôi đi làm.'],
          ['星期六', 'xīngqī liù', 'noun', 'thứ Bảy', '星期六我们去玩。', 'Thứ Bảy chúng tôi đi chơi.'],
          ['星期天', 'xīngqī tiān', 'noun', 'chủ nhật', '星期天我在家休息。', 'Chủ nhật tôi nghỉ ở nhà.'],
          ['星期几', 'xīngqī jǐ', 'phrase', 'thứ mấy', '今天星期几？', 'Hôm nay là thứ mấy?'],
          ['今天', 'jīntiān', 'noun', 'hôm nay', '今天天气很好。', 'Hôm nay thời tiết rất đẹp.'],
          ['月', 'yuè', 'noun', 'tháng', '现在是三月。', 'Bây giờ là tháng Ba.'],
          ['号', 'hào', 'measure word', 'ngày (trong tháng)', '今天是五号。', 'Hôm nay là ngày mồng năm.'],
          ['年', 'nián', 'noun', 'năm', '今年是二〇二六年。', 'Năm nay là năm 2026.'],
          ['今年', 'jīnnián', 'noun', 'năm nay', '今年我二十岁。', 'Năm nay tôi hai mươi tuổi.'],
          ['生日', 'shēngrì', 'noun', 'sinh nhật', '你的生日是几月几号？', 'Sinh nhật của bạn là ngày mấy tháng mấy?'],
        ],
        grammar: {
          title: 'Ngày tháng: 几月几号 / 星期几 (không cần 是 với danh từ thời gian)',
          explain: 'Tiếng Trung nói ngày theo thứ tự lớn → nhỏ: 年 → 月 → 号 → 星期. Ví dụ 二〇二六年三月五号, 星期五. Hỏi: 今天几月几号？ (hôm nay ngày mấy tháng mấy), 今天星期几？ (hôm nay thứ mấy). Với câu có danh từ thời gian làm vị ngữ, thường không cần 是: 今天星期五 (hôm nay thứ Sáu), nhưng 是 vẫn được phép: 今天是五号.',
          examples: [
            ['今天星期几？', 'Hôm nay là thứ mấy?', 'Jīntiān xīngqī jǐ?'],
            ['今天是三月五号。', 'Hôm nay là ngày mồng năm tháng Ba.', 'Jīntiān shì sānyuè wǔ hào.'],
            ['你的生日是几月几号？', 'Sinh nhật của bạn là ngày mấy tháng mấy?', 'Nǐ de shēngrì shì jǐ yuè jǐ hào?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '今天星期几？', 'Hôm nay là thứ mấy?', 'Jīntiān xīngqī jǐ?'],
            ['阮', '今天星期六。', 'Hôm nay thứ Bảy.', 'Jīntiān xīngqī liù.'],
            ['李明', '你的生日是几月几号？', 'Sinh nhật của bạn là ngày mấy tháng mấy?', 'Nǐ de shēngrì shì jǐ yuè jǐ hào?'],
            ['阮', '我的生日是三月五号。', 'Sinh nhật tôi là ngày mồng năm tháng Ba.', 'Wǒ de shēngrì shì sānyuè wǔ hào.'],
          ],
        },
        reorder: [
          ['今天|星期|几|？', 'Hôm nay là thứ mấy?'],
          ['今天|是|三月|五号|。', 'Hôm nay là ngày mồng năm tháng Ba.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi hôm nay là thứ mấy.', source: '今天 / 星期', pattern: '今天星期几？', answers: ['今天星期几？', '今天星期几?', '今天星期几'] },
          { prompt: 'Hỏi sinh nhật của bạn là ngày mấy tháng mấy.', source: '你的生日 / 几月几号', pattern: 'S + 是 + 几月几号？', answers: ['你的生日是几月几号？', '你的生日是几月几号?', '你的生日是几月几号'] },
        ],
        tip: ['Thứ tự ngày tháng', 'Người Trung Quốc viết ngày theo thứ tự lớn đến nhỏ: năm, tháng, ngày. Khi nói không đảo ngược như tiếng Anh.'],
      },
      {
        title: { vi: 'Buổi trong ngày và giờ giấc', en: 'Parts of the Day and Clock Times' },
        intro: 'Bạn kể mình thường làm gì vào buổi sáng, buổi trưa hay buổi chiều. Bài này dạy các mốc thời gian trong ngày và giờ rưỡi, giờ kém.',
        vocab: [
          ['上午', 'shàngwǔ', 'noun', 'buổi sáng (trước trưa)', '上午我有课。', 'Buổi sáng tôi có tiết học.'],
          ['中午', 'zhōngwǔ', 'noun', 'buổi trưa', '中午我在学校吃饭。', 'Buổi trưa tôi ăn ở trường.'],
          ['下午', 'xiàwǔ', 'noun', 'buổi chiều', '下午我去图书馆。', 'Buổi chiều tôi đến thư viện.'],
          ['半', 'bàn', 'number', 'rưỡi, một nửa', '现在八点半。', 'Bây giờ là tám giờ rưỡi.'],
          ['刻', 'kè', 'measure word', 'mười lăm phút', '现在三点一刻。', 'Bây giờ là ba giờ mười lăm.'],
          ['差', 'chà', 'verb', 'kém, thiếu', '现在差五分九点。', 'Bây giờ là chín giờ kém năm.'],
          ['时候', 'shíhou', 'noun', 'lúc, khi', '你什么时候下班？', 'Khi nào bạn tan làm?'],
          ['什么时候', 'shénme shíhou', 'phrase', 'khi nào', '你什么时候回家？', 'Khi nào bạn về nhà?'],
          ['下班', 'xiàbān', 'verb', 'tan làm', '我六点下班。', 'Tôi tan làm lúc sáu giờ.'],
          ['回家', 'huí jiā', 'verb phrase', 'về nhà', '我六点半回家。', 'Sáu giờ rưỡi tôi về nhà.'],
        ],
        grammar: {
          title: 'Từ chỉ thời gian đứng trước động từ: 我六点下班',
          explain: 'Trong câu tiếng Trung, từ chỉ thời gian đứng trước động từ và sau chủ ngữ (hoặc đầu câu): 我下午去图书馆 / 下午我去图书馆. Giờ rưỡi dùng 半: 八点半. Mười lăm phút dùng 一刻: 三点一刻. Kém giờ dùng 差: 差五分九点 (chín giờ kém năm). Hỏi thời điểm: 什么时候 hoặc 几点.',
          examples: [
            ['我六点半回家。', 'Sáu giờ rưỡi tôi về nhà.', 'Wǒ liù diǎn bàn huí jiā.'],
            ['你什么时候下班？', 'Khi nào bạn tan làm?', 'Nǐ shénme shíhou xiàbān?'],
            ['下午我去图书馆。', 'Buổi chiều tôi đến thư viện.', 'Xiàwǔ wǒ qù túshūguǎn.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你什么时候下班？', 'Khi nào bạn tan làm?', 'Nǐ shénme shíhou xiàbān?'],
            ['阮', '我六点下班，六点半回家。', 'Tôi tan làm lúc sáu giờ, sáu giờ rưỡi về nhà.', 'Wǒ liù diǎn xiàbān, liù diǎn bàn huí jiā.'],
            ['李明', '现在几点？', 'Bây giờ mấy giờ?', 'Xiànzài jǐ diǎn?'],
            ['阮', '现在差五分六点。', 'Bây giờ là sáu giờ kém năm.', 'Xiànzài chà wǔ fēn liù diǎn.'],
          ],
        },
        reorder: [
          ['我|六点半|回家|。', 'Sáu giờ rưỡi tôi về nhà.'],
          ['你|什么时候|下班|？', 'Khi nào bạn tan làm?'],
        ],
        grammarQ: [
          { prompt: 'Hỏi khi nào bạn tan làm.', source: '你 / 什么时候 / 下班', pattern: 'S + 什么时候 + V？', answers: ['你什么时候下班？', '你什么时候下班?', '你什么时候下班'] },
          { prompt: 'Nói buổi chiều bạn đến thư viện.', source: '下午 / 图书馆', pattern: 'Thời gian + S + V', answers: ['下午我去图书馆。', '下午我去图书馆'] },
        ],
        tip: ['Giờ trước, động từ sau', 'Từ chỉ thời gian luôn đứng trước động từ. Đây là lỗi hay gặp của người Việt: không nói “我去图书馆下午”.'],
      },
      {
        title: { vi: 'Sinh nhật và ngày lễ (祝・快乐)', en: 'Birthdays and Festivals' },
        intro: 'Bạn muốn chúc mừng sinh nhật hoặc năm mới bạn bè Trung Quốc. Bài này dạy từ vựng ngày lễ, quà tặng và các câu chúc thông dụng.',
        vocab: [
          ['祝', 'zhù', 'verb', 'chúc', '祝你生日快乐！', 'Chúc bạn sinh nhật vui vẻ!'],
          ['快乐', 'kuàilè', 'adjective', 'vui vẻ', '新年快乐！', 'Chúc mừng năm mới!'],
          ['新年', 'xīnnián', 'noun', 'năm mới', '新年我回老家。', 'Năm mới tôi về quê.'],
          ['春节', 'Chūnjié', 'proper noun', 'Tết Nguyên đán', '春节我们吃饺子。', 'Tết Nguyên đán chúng tôi ăn sủi cảo.'],
          ['礼物', 'lǐwù', 'noun', 'món quà', '这是给你的礼物。', 'Đây là quà dành cho bạn.'],
          ['蛋糕', 'dàngāo', 'noun', 'bánh ngọt', '生日蛋糕很好吃。', 'Bánh sinh nhật rất ngon.'],
          ['送', 'sòng', 'verb', 'tặng', '我送你一本书。', 'Tôi tặng bạn một quyển sách.'],
          ['花', 'huā', 'noun', 'hoa', '我送妈妈一束花。', 'Tôi tặng mẹ một bó hoa.'],
          ['过', 'guò', 'verb', 'đón, trải qua (ngày lễ)', '你在哪儿过春节？', 'Bạn đón Tết ở đâu?'],
          ['聚会', 'jùhuì', 'noun', 'buổi tụ họp', '明天有一个聚会。', 'Ngày mai có một buổi tụ họp.'],
        ],
        grammar: {
          title: '祝你…！ và 送 + người + vật',
          explain: 'Mẫu chúc: 祝你 + điều tốt đẹp (祝你生日快乐 – chúc bạn sinh nhật vui vẻ, 祝你新年快乐). Câu chúc thường nói ngắn: 生日快乐！ 新年快乐！ Động từ 送 có hai tân ngữ: 送 + người + vật (我送你一本书 – tôi tặng bạn một quyển sách). Đáp lại lời chúc: 谢谢！ 也祝你…',
          examples: [
            ['祝你生日快乐！', 'Chúc bạn sinh nhật vui vẻ!', 'Zhù nǐ shēngrì kuàilè!'],
            ['我送你一本书。', 'Tôi tặng bạn một quyển sách.', 'Wǒ sòng nǐ yì běn shū.'],
            ['你在哪儿过春节？', 'Bạn đón Tết ở đâu?', 'Nǐ zài nǎr guò Chūnjié?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '阮明，祝你生日快乐！', 'Nguyễn Minh, chúc bạn sinh nhật vui vẻ!', 'Ruǎn Míng, zhù nǐ shēngrì kuàilè!'],
            ['阮', '谢谢！你送我什么礼物？', 'Cảm ơn! Bạn tặng tôi quà gì thế?', 'Xièxie! Nǐ sòng wǒ shénme lǐwù?'],
            ['李明', '我送你一本书。这是给你的蛋糕。', 'Tôi tặng bạn một quyển sách. Đây là bánh cho bạn.', 'Wǒ sòng nǐ yì běn shū. Zhè shì gěi nǐ de dàngāo.'],
            ['阮', '太好了，谢谢你！', 'Tuyệt quá, cảm ơn bạn!', 'Tài hǎo le, xièxie nǐ!'],
          ],
        },
        reorder: [
          ['祝|你|生日|快乐|！', 'Chúc bạn sinh nhật vui vẻ!'],
          ['我|送|你|一|本|书|。', 'Tôi tặng bạn một quyển sách.'],
        ],
        grammarQ: [
          { prompt: 'Chúc bạn sinh nhật vui vẻ.', source: '祝 / 生日 / 快乐', pattern: '祝你 + …！', answers: ['祝你生日快乐！', '祝你生日快乐!', '祝你生日快乐'] },
          { prompt: 'Nói tôi tặng bạn một quyển sách.', source: '送 / 你 / 书', pattern: '送 + người + vật', answers: ['我送你一本书。', '我送你一本书'] },
        ],
        tip: ['Quà tặng kiêng kỵ', 'Người Trung Quốc kiêng tặng đồng hồ (送钟 đồng âm 送终) và giày. Hãy chọn trái cây, trà hoặc sách.'],
      },
    ],
  },
  {
    level: 'HSK1',
    names: { vi: 'Con người và ngoại hình', en: 'People and Appearance' },
    lessons: [
      {
        title: { vi: 'Bạn bè và ngoại hình', en: 'Friends and Appearance' },
        intro: 'Bạn muốn tả một người bạn: cao hay thấp, trẻ hay già, trông thế nào. Bài này dạy tính từ miêu tả và cách dùng 很 / 不太 / 有点儿.',
        vocab: [
          ['漂亮', 'piàoliang', 'adjective', 'xinh đẹp', '她很漂亮。', 'Cô ấy rất xinh.'],
          ['帅', 'shuài', 'adjective', 'đẹp trai', '他哥哥很帅。', 'Anh trai anh ấy rất đẹp trai.'],
          ['年轻', 'niánqīng', 'adjective', 'trẻ', '我们老师很年轻。', 'Giáo viên của chúng tôi rất trẻ.'],
          ['矮', 'ǎi', 'adjective', 'thấp', '我弟弟有点儿矮。', 'Em trai tôi hơi thấp.'],
          ['胖', 'pàng', 'adjective', 'béo', '那只猫很胖。', 'Con mèo kia rất béo.'],
          ['瘦', 'shòu', 'adjective', 'gầy', '他不太瘦。', 'Anh ấy không gầy lắm.'],
          ['头发', 'tóufa', 'noun', 'tóc', '她的头发很长。', 'Tóc cô ấy rất dài.'],
          ['长', 'cháng', 'adjective', 'dài', '这条路很长。', 'Con đường này rất dài.'],
          ['眼睛', 'yǎnjing', 'noun', 'mắt', '她的眼睛很大。', 'Mắt cô ấy rất to.'],
          ['有点儿', 'yǒudiǎnr', 'adverb', 'hơi', '我有点儿累。', 'Tôi hơi mệt.'],
        ],
        grammar: {
          title: 'Mức độ: 很 / 不太 / 有点儿 + tính từ',
          explain: 'Để điều chỉnh mức độ, đặt trạng từ trước tính từ: 很高 (rất cao), 不太高 (không cao lắm), 有点儿矮 (hơi thấp). 有点儿 thường dùng với ý hơi tiêu cực hoặc không mong muốn: 有点儿累 (hơi mệt), 有点儿贵 (hơi đắt). Để miêu tả một bộ phận, dùng cấu trúc chủ đề–bình luận: 她头发很长 (tóc cô ấy rất dài).',
          examples: [
            ['她的头发很长。', 'Tóc cô ấy rất dài.', 'Tā de tóufa hěn cháng.'],
            ['我弟弟有点儿矮。', 'Em trai tôi hơi thấp.', 'Wǒ dìdi yǒudiǎnr ǎi.'],
            ['他不太瘦。', 'Anh ấy không gầy lắm.', 'Tā bú tài shòu.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '这是你的朋友吗？', 'Đây là bạn của bạn à?', 'Zhè shì nǐ de péngyou ma?'],
            ['阮', '对，她叫小红，她很漂亮。', 'Đúng, cô ấy tên Tiểu Hồng, cô ấy rất xinh.', 'Duì, tā jiào Xiǎohóng, tā hěn piàoliang.'],
            ['李明', '她的头发很长，眼睛也很大。', 'Tóc cô ấy rất dài, mắt cũng rất to.', 'Tā de tóufa hěn cháng, yǎnjing yě hěn dà.'],
            ['阮', '她弟弟有点儿矮，但是很帅。', 'Em trai cô ấy hơi thấp, nhưng rất đẹp trai.', 'Tā dìdi yǒudiǎnr ǎi, dànshì hěn shuài.'],
          ],
        },
        reorder: [
          ['她|的|头发|很|长|。', 'Tóc cô ấy rất dài.'],
          ['我|弟弟|有点儿|矮|。', 'Em trai tôi hơi thấp.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tóc cô ấy rất dài”.', source: '她的头发 / 长', pattern: 'S + 很 + Adj', answers: ['她的头发很长。', '她的头发很长'] },
          { prompt: 'Nói em trai tôi hơi thấp bằng 有点儿.', source: '我弟弟 / 矮', pattern: 'S + 有点儿 + Adj', answers: ['我弟弟有点儿矮。', '我弟弟有点儿矮'] },
        ],
        tip: ['Tế nhị khi nhận xét', 'Trong tiếng Trung, nói “胖” hay “瘦” với người khác có thể là nhận xét thẳng. Hãy khen 漂亮, 帅, 年轻 là an toàn hơn.'],
      },
      {
        title: { vi: 'Nghề nghiệp và nơi làm việc', en: 'Jobs and Workplaces' },
        intro: 'Bạn giới thiệu nghề nghiệp của mình và hỏi người khác làm nghề gì. Bài này dạy từ vựng nghề nghiệp và mẫu 在…工作.',
        vocab: [
          ['护士', 'hùshi', 'noun', 'y tá', '我姐姐是护士。', 'Chị tôi là y tá.'],
          ['司机', 'sījī', 'noun', 'tài xế', '他爸爸是出租车司机。', 'Bố anh ấy là tài xế taxi.'],
          ['警察', 'jǐngchá', 'noun', 'cảnh sát', '警察在路口。', 'Cảnh sát đang ở ngã tư.'],
          ['律师', 'lǜshī', 'noun', 'luật sư', '她是一个律师。', 'Cô ấy là một luật sư.'],
          ['厨师', 'chúshī', 'noun', 'đầu bếp', '那个厨师做的菜很好吃。', 'Món do đầu bếp đó làm rất ngon.'],
          ['工人', 'gōngrén', 'noun', 'công nhân', '他是工厂的工人。', 'Anh ấy là công nhân nhà máy.'],
          ['工厂', 'gōngchǎng', 'noun', 'nhà máy', '工厂在城外。', 'Nhà máy ở ngoài thành phố.'],
          ['银行', 'yínháng', 'noun', 'ngân hàng', '我在银行工作。', 'Tôi làm việc ở ngân hàng.'],
          ['职业', 'zhíyè', 'noun', 'nghề nghiệp', '你的职业是什么？', 'Nghề nghiệp của bạn là gì?'],
          ['做', 'zuò', 'verb', 'làm', '你做什么工作？', 'Bạn làm công việc gì?'],
        ],
        grammar: {
          title: '在 + nơi + 工作 / 是 + nghề',
          explain: 'Nói nghề dùng 是 + danh từ nghề: 我是护士. Nói nơi làm dùng 在 + nơi + 工作: 我在银行工作 (tôi làm việc ở ngân hàng). 在 và nơi chốn đứng trước động từ. Hỏi nghề: 你做什么工作？ hoặc 你的职业是什么？ Hỏi nơi làm: 你在哪儿工作？',
          examples: [
            ['我在银行工作。', 'Tôi làm việc ở ngân hàng.', 'Wǒ zài yínháng gōngzuò.'],
            ['你做什么工作？', 'Bạn làm công việc gì?', 'Nǐ zuò shénme gōngzuò?'],
            ['我姐姐是护士。', 'Chị tôi là y tá.', 'Wǒ jiějie shì hùshi.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你做什么工作？', 'Bạn làm công việc gì?', 'Nǐ zuò shénme gōngzuò?'],
            ['阮', '我在银行工作。你呢？', 'Tôi làm việc ở ngân hàng. Còn bạn?', 'Wǒ zài yínháng gōngzuò. Nǐ ne?'],
            ['李明', '我是警察。我爸爸是司机。', 'Tôi là cảnh sát. Bố tôi là tài xế.', 'Wǒ shì jǐngchá. Wǒ bàba shì sījī.'],
            ['阮', '我姐姐是护士，在医院工作。', 'Chị tôi là y tá, làm việc ở bệnh viện.', 'Wǒ jiějie shì hùshi, zài yīyuàn gōngzuò.'],
          ],
        },
        reorder: [
          ['我|在|银行|工作|。', 'Tôi làm việc ở ngân hàng.'],
          ['你|做|什么|工作|？', 'Bạn làm công việc gì?'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi làm việc ở ngân hàng.', source: '我 / 银行 / 工作', pattern: 'S + 在 + nơi + 工作', answers: ['我在银行工作。', '我在银行工作'] },
          { prompt: 'Hỏi bạn làm công việc gì.', source: '你 / 做 / 工作', pattern: '你做什么工作？', answers: ['你做什么工作？', '你做什么工作?', '你做什么工作'] },
        ],
        tip: ['Hỏi nghề lịch sự', 'Hỏi 你做什么工作？ là cách phổ biến. Với người lớn tuổi có thể dùng 您做什么工作？'],
      },
      {
        title: { vi: 'Quốc tịch và ngôn ngữ', en: 'Countries and Languages' },
        intro: 'Bạn giới thiệu mình đến từ nước nào và biết nói ngôn ngữ nào. Bài này dạy tên nước, ngôn ngữ và mẫu 是…人, 说…语.',
        vocab: [
          ['越南', 'Yuènán', 'proper noun', 'Việt Nam', '我是越南人。', 'Tôi là người Việt Nam.'],
          ['美国', 'Měiguó', 'proper noun', 'nước Mỹ', '他是美国人。', 'Anh ấy là người Mỹ.'],
          ['日本', 'Rìběn', 'proper noun', 'Nhật Bản', '她从日本来。', 'Cô ấy đến từ Nhật Bản.'],
          ['国家', 'guójiā', 'noun', 'quốc gia', '你是哪个国家的人？', 'Bạn là người nước nào?'],
          ['哪', 'nǎ', 'pronoun', 'nào', '你是哪国人？', 'Bạn là người nước nào?'],
          ['汉语', 'Hànyǔ', 'noun', 'tiếng Hán', '我在学汉语。', 'Tôi đang học tiếng Hán.'],
          ['英语', 'Yīngyǔ', 'noun', 'tiếng Anh', '他说英语。', 'Anh ấy nói tiếng Anh.'],
          ['语言', 'yǔyán', 'noun', 'ngôn ngữ', '你会几种语言？', 'Bạn biết mấy ngôn ngữ?'],
          ['种', 'zhǒng', 'measure word', 'loại, thứ', '我会两种语言。', 'Tôi biết hai ngôn ngữ.'],
          ['从', 'cóng', 'preposition', 'từ', '我从越南来。', 'Tôi đến từ Việt Nam.'],
        ],
        grammar: {
          title: '是…人 / 说 + ngôn ngữ / 从 + nơi + 来',
          explain: 'Quốc tịch: 国家名 + 人 (越南人, 美国人). Hỏi: 你是哪国人？ Nơi xuất xứ: 从 + nơi + 来 (我从越南来). Ngôn ngữ: 说 + ngôn ngữ (他说英语) hoặc 学 + ngôn ngữ (我在学汉语). Hỏi khả năng: 你会说汉语吗？ — 会 đứng trước 说.',
          examples: [
            ['我是越南人。', 'Tôi là người Việt Nam.', 'Wǒ shì Yuènán rén.'],
            ['我从越南来。', 'Tôi đến từ Việt Nam.', 'Wǒ cóng Yuènán lái.'],
            ['你会说汉语吗？', 'Bạn biết nói tiếng Hán không?', 'Nǐ huì shuō Hànyǔ ma?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你是哪国人？', 'Bạn là người nước nào?', 'Nǐ shì nǎ guó rén?'],
            ['阮', '我是越南人，我从河内来。', 'Tôi là người Việt Nam, tôi đến từ Hà Nội.', 'Wǒ shì Yuènán rén, wǒ cóng Hénèi lái.'],
            ['李明', '你会说汉语吗？', 'Bạn biết nói tiếng Hán không?', 'Nǐ huì shuō Hànyǔ ma?'],
            ['阮', '我会说一点儿，我还会说英语。', 'Tôi nói được một chút, tôi còn biết nói tiếng Anh.', 'Wǒ huì shuō yìdiǎnr, wǒ hái huì shuō Yīngyǔ.'],
          ],
        },
        reorder: [
          ['我|是|越南|人|。', 'Tôi là người Việt Nam.'],
          ['你|会|说|汉语|吗|？', 'Bạn biết nói tiếng Hán không?'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi đến từ Việt Nam.', source: '我 / 越南 / 来', pattern: 'S + 从 + nơi + 来', answers: ['我从越南来。', '我从越南来'] },
          { prompt: 'Hỏi bạn biết nói tiếng Hán không.', source: '你 / 会 / 说 / 汉语', pattern: 'S + 会 + V + 吗？', answers: ['你会说汉语吗？', '你会说汉语吗?', '你会说汉语吗'] },
        ],
        tip: ['汉语 hay 中文?', 'Cả 汉语 và 中文 đều chỉ tiếng Trung. 汉语 trang trọng hơn, 中文 hay dùng trong đời thường và khi viết.'],
      },
    ],
  },
  {
    level: 'HSK1',
    names: { vi: 'Ăn mặc và mua sắm', en: 'Food, Clothes and Shopping' },
    lessons: [
      {
        title: { vi: 'Hoa quả, bữa sáng và lượng từ', en: 'Fruit, Breakfast and Measure Words' },
        intro: 'Bạn đi chợ mua hoa quả hoặc ăn sáng. Bài này dạy tên các loại thức ăn quen thuộc và các lượng từ 个, 斤, 瓶, 杯 đi kèm.',
        vocab: [
          ['香蕉', 'xiāngjiāo', 'noun', 'quả chuối', '我买两斤香蕉。', 'Tôi mua hai cân chuối.'],
          ['西瓜', 'xīguā', 'noun', 'dưa hấu', '夏天我爱吃西瓜。', 'Mùa hè tôi thích ăn dưa hấu.'],
          ['鸡蛋', 'jīdàn', 'noun', 'trứng gà', '我早上吃两个鸡蛋。', 'Buổi sáng tôi ăn hai quả trứng.'],
          ['牛奶', 'niúnǎi', 'noun', 'sữa bò', '我每天喝一杯牛奶。', 'Mỗi ngày tôi uống một ly sữa.'],
          ['面包', 'miànbāo', 'noun', 'bánh mì', '早饭我吃面包。', 'Bữa sáng tôi ăn bánh mì.'],
          ['早饭', 'zǎofàn', 'noun', 'bữa sáng', '你吃早饭了吗？', 'Bạn đã ăn sáng chưa?'],
          ['斤', 'jīn', 'measure word', 'cân (500g)', '一斤多少钱？', 'Một cân bao nhiêu tiền?'],
          ['蔬菜', 'shūcài', 'noun', 'rau xanh', '多吃蔬菜对身体好。', 'Ăn nhiều rau tốt cho sức khỏe.'],
          ['鱼', 'yú', 'noun', 'cá', '我爱吃鱼。', 'Tôi thích ăn cá.'],
          ['肉', 'ròu', 'noun', 'thịt', '她不吃肉。', 'Cô ấy không ăn thịt.'],
        ],
        grammar: {
          title: 'Số + lượng từ + danh từ: 两斤香蕉 / 一杯牛奶',
          explain: 'Khi đếm đồ vật, tiếng Trung cần lượng từ giữa số và danh từ: số + lượng từ + danh từ. 个 (cái chung), 斤 (cân), 杯 (ly), 瓶 (chai), 本 (quyển), 件 (chiếc – áo). Số 2 đứng trước lượng từ dùng 两 chứ không dùng 二: 两个鸡蛋, 两斤香蕉. Hỏi số lượng: 几 + lượng từ (几个?), hoặc 多少 với số lớn.',
          examples: [
            ['我买两斤香蕉。', 'Tôi mua hai cân chuối.', 'Wǒ mǎi liǎng jīn xiāngjiāo.'],
            ['我每天喝一杯牛奶。', 'Mỗi ngày tôi uống một ly sữa.', 'Wǒ měitiān hē yì bēi niúnǎi.'],
            ['你吃早饭了吗？', 'Bạn đã ăn sáng chưa?', 'Nǐ chī zǎofàn le ma?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你吃早饭了吗？', 'Bạn đã ăn sáng chưa?', 'Nǐ chī zǎofàn le ma?'],
            ['阮', '吃了，我吃了面包，还喝了一杯牛奶。', 'Ăn rồi, tôi ăn bánh mì, còn uống một ly sữa.', 'Chī le, wǒ chī le miànbāo, hái hē le yì bēi niúnǎi.'],
            ['李明', '我现在去买水果。', 'Bây giờ tôi đi mua hoa quả.', 'Wǒ xiànzài qù mǎi shuǐguǒ.'],
            ['阮', '帮我买两斤香蕉吧。', 'Mua giúp tôi hai cân chuối nhé.', 'Bāng wǒ mǎi liǎng jīn xiāngjiāo ba.'],
          ],
        },
        reorder: [
          ['我|买|两|斤|香蕉|。', 'Tôi mua hai cân chuối.'],
          ['你|吃|早饭|了|吗|？', 'Bạn đã ăn sáng chưa?'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi mua hai cân chuối (dùng 两 + 斤).', source: '买 / 两 / 斤 / 香蕉', pattern: 'S + 买 + 两 + 斤 + N', answers: ['我买两斤香蕉。', '我买两斤香蕉'] },
          { prompt: 'Hỏi bạn đã ăn sáng chưa.', source: '你 / 早饭', pattern: 'S + V + 了 + 吗？', answers: ['你吃早饭了吗？', '你吃早饭了吗?', '你吃早饭了吗'] },
        ],
        tip: ['两 hay 二?', 'Khi đếm số lượng trước lượng từ, nói 两 (liǎng) chứ không nói 二 (èr): 两个人, 两本书. Chỉ dùng 二 khi đọc số.'],
      },
      {
        title: { vi: 'Quần áo và màu sắc', en: 'Clothes and Colours' },
        intro: 'Bạn muốn mua áo, thử đồ hay nói màu mình thích. Bài này dạy từ vựng quần áo, màu sắc, động từ 穿 và mẫu hỏi kích cỡ.',
        vocab: [
          ['裤子', 'kùzi', 'noun', 'quần', '这条裤子很便宜。', 'Chiếc quần này rất rẻ.'],
          ['鞋', 'xié', 'noun', 'giày', '我想买一双鞋。', 'Tôi muốn mua một đôi giày.'],
          ['帽子', 'màozi', 'noun', 'mũ', '他戴着一顶帽子。', 'Anh ấy đội một chiếc mũ.'],
          ['红色', 'hóngsè', 'noun', 'màu đỏ', '我喜欢红色。', 'Tôi thích màu đỏ.'],
          ['白色', 'báisè', 'noun', 'màu trắng', '她穿白色的衣服。', 'Cô ấy mặc quần áo màu trắng.'],
          ['黑色', 'hēisè', 'noun', 'màu đen', '这条黑色的裤子很好看。', 'Chiếc quần đen này rất đẹp.'],
          ['穿', 'chuān', 'verb', 'mặc, đi (giày)', '今天我穿红色的衣服。', 'Hôm nay tôi mặc áo đỏ.'],
          ['试', 'shì', 'verb', 'thử', '我可以试一下吗？', 'Tôi có thể thử một chút không?'],
          ['件', 'jiàn', 'measure word', 'chiếc (áo), việc', '我要这件衣服。', 'Tôi lấy chiếc áo này.'],
          ['合适', 'héshì', 'adjective', 'vừa vặn, phù hợp', '这双鞋很合适。', 'Đôi giày này rất vừa.'],
        ],
        grammar: {
          title: 'Tính từ + 的 + danh từ; 穿 / 试 + 一下',
          explain: 'Tính từ/màu sắc có thể bổ nghĩa cho danh từ bằng 的: 红色的衣服 (quần áo màu đỏ). Động từ 穿 dùng cho quần áo và giày, cả hai bộ phận. 试 + 一下 diễn đạt “thử một chút”: 我想试一下这件衣服. Nhận xét độ vừa: 很合适 (rất vừa), 太大了 (quá to), 太小了 (quá nhỏ). Hỏi: 这件衣服怎么样？',
          examples: [
            ['我想试一下这件衣服。', 'Tôi muốn thử chiếc áo này.', 'Wǒ xiǎng shì yíxià zhè jiàn yīfu.'],
            ['今天我穿红色的衣服。', 'Hôm nay tôi mặc áo màu đỏ.', 'Jīntiān wǒ chuān hóngsè de yīfu.'],
            ['这双鞋很合适。', 'Đôi giày này rất vừa.', 'Zhè shuāng xié hěn héshì.'],
          ],
        },
        dialogue: {
          lines: [
            ['店员', '你好，你想买什么？', 'Xin chào, bạn muốn mua gì?', 'Nǐ hǎo, nǐ xiǎng mǎi shénme?'],
            ['阮', '我想买一件白色的衣服。', 'Tôi muốn mua một chiếc áo màu trắng.', 'Wǒ xiǎng mǎi yí jiàn báisè de yīfu.'],
            ['店员', '这件怎么样？你可以试一下。', 'Chiếc này thế nào? Bạn có thể thử một chút.', 'Zhè jiàn zěnmeyàng? Nǐ kěyǐ shì yíxià.'],
            ['阮', '很合适，我要这件。', 'Rất vừa, tôi lấy chiếc này.', 'Hěn héshì, wǒ yào zhè jiàn.'],
          ],
        },
        reorder: [
          ['我|想|试|一下|这|件|衣服|。', 'Tôi muốn thử chiếc áo này.'],
          ['这|双|鞋|很|合适|。', 'Đôi giày này rất vừa.'],
        ],
        grammarQ: [
          { prompt: 'Nói muốn thử chiếc áo này một chút.', source: '想 / 试 / 一下 / 这件衣服', pattern: 'S + 想 + 试 + 一下 + N', answers: ['我想试一下这件衣服。', '我想试一下这件衣服'] },
          { prompt: 'Nói hôm nay tôi mặc áo màu đỏ.', source: '今天 / 穿 / 红色的衣服', pattern: 'S + 穿 + Adj + 的 + N', answers: ['今天我穿红色的衣服。', '今天我穿红色的衣服'] },
        ],
        tip: ['Lượng từ cho đồ mặc', 'Áo dùng 件, quần dùng 条, giày/tất dùng 双. Chọn đúng lượng từ để nói tự nhiên hơn.'],
      },
      {
        title: { vi: 'Ở siêu thị và trả giá', en: 'At the Supermarket and Bargaining' },
        intro: 'Bạn mua sắm ở siêu thị và chợ, hỏi giá và trả giá. Bài này dạy từ vựng siêu thị, cách trả tiền và câu trả giá cơ bản.',
        vocab: [
          ['超市', 'chāoshì', 'noun', 'siêu thị', '我去超市买东西。', 'Tôi đi siêu thị mua đồ.'],
          ['打折', 'dǎzhé', 'verb phrase', 'giảm giá', '这件衣服打折。', 'Chiếc áo này đang giảm giá.'],
          ['袋子', 'dàizi', 'noun', 'cái túi', '请给我一个袋子。', 'Xin cho tôi một cái túi.'],
          ['找钱', 'zhǎo qián', 'verb phrase', 'trả tiền thừa', '老板找我五块钱。', 'Chủ quán trả lại tôi năm đồng.'],
          ['老板', 'lǎobǎn', 'noun', 'ông chủ, chủ quán', '老板，这个多少钱？', 'Ông chủ, cái này bao nhiêu tiền?'],
          ['付款', 'fùkuǎn', 'verb', 'thanh toán', '你可以用手机付款。', 'Bạn có thể thanh toán bằng điện thoại.'],
          ['现金', 'xiànjīn', 'noun', 'tiền mặt', '你付现金还是刷卡？', 'Bạn trả tiền mặt hay quẹt thẻ?'],
          ['刷卡', 'shuākǎ', 'verb phrase', 'quẹt thẻ', '我想刷卡。', 'Tôi muốn quẹt thẻ.'],
          ['再', 'zài', 'adverb', 'lại, nữa', '再便宜一点儿吧。', 'Rẻ thêm chút nữa đi.'],
          ['算', 'suàn', 'verb', 'tính', '一共算你五十块。', 'Tổng cộng tính cho bạn năm mươi đồng.'],
        ],
        grammar: {
          title: 'Trả giá: 太…了 / 再 + tính từ + 一点儿 / 能不能…',
          explain: 'Khi trả giá: 太贵了 (đắt quá), 再便宜一点儿吧 (rẻ thêm chút nữa đi), 能不能便宜一点儿？ (có thể rẻ hơn không?). Mẫu 太…了 nhấn mạnh: 太贵了, 太好了. 再 + Adj + 一点儿 đề nghị mức hơn nữa. Hỏi tổng: 一共多少钱？ và trả tiền: 我付现金 / 我刷卡.',
          examples: [
            ['太贵了，再便宜一点儿吧。', 'Đắt quá, rẻ thêm chút nữa đi.', 'Tài guì le, zài piányi yìdiǎnr ba.'],
            ['一共多少钱？', 'Tổng cộng bao nhiêu tiền?', 'Yígòng duōshao qián?'],
            ['你可以用手机付款。', 'Bạn có thể thanh toán bằng điện thoại.', 'Nǐ kěyǐ yòng shǒujī fùkuǎn.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '老板，这个多少钱？', 'Ông chủ, cái này bao nhiêu tiền?', 'Lǎobǎn, zhège duōshao qián?'],
            ['老板', '八十块。', 'Tám mươi đồng.', 'Bāshí kuài.'],
            ['阮', '太贵了，再便宜一点儿吧。', 'Đắt quá, rẻ thêm chút nữa đi.', 'Tài guì le, zài piányi yìdiǎnr ba.'],
            ['老板', '好吧，一共算你七十块。', 'Được rồi, tổng cộng tính cho bạn bảy mươi đồng.', 'Hǎo ba, yígòng suàn nǐ qīshí kuài.'],
          ],
        },
        reorder: [
          ['太|贵|了|，|再|便宜|一点儿|吧|。', 'Đắt quá, rẻ thêm chút nữa đi.'],
          ['一共|多少|钱|？', 'Tổng cộng bao nhiêu tiền?'],
        ],
        grammarQ: [
          { prompt: 'Trả giá: nói đắt quá, rẻ thêm chút nữa đi.', source: '太贵了 / 再便宜一点儿', pattern: '太…了，再…一点儿吧', answers: ['太贵了，再便宜一点儿吧。', '太贵了，再便宜一点儿吧', '太贵了,再便宜一点儿吧。'] },
          { prompt: 'Hỏi tổng cộng bao nhiêu tiền.', source: '一共 / 多少 / 钱', pattern: '一共多少钱？', answers: ['一共多少钱？', '一共多少钱?', '一共多少钱'] },
        ],
        tip: ['Trả giá ở chợ', 'Ở chợ nhỏ có thể trả giá, còn siêu thị đã niêm yết giá. Trả giá nhẹ nhàng, cười và không quá gay gắt.'],
      },
    ],
  },
];
