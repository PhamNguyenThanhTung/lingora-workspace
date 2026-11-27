import type { UnitSpec } from '../types.ts';

/**
 * Chinese HSK 2 — Upper beginner (simplified characters, Hanyu Pinyin with tone marks).
 * Can-do: talk about past events, experiences and plans, compare things, describe health,
 * order in a restaurant, make phone calls and give simple directions.
 */
export const ZH_HSK2_UNITS: UnitSpec[] = [
  {
    level: 'HSK2',
    names: { vi: 'Quá khứ, kinh nghiệm và việc đang làm', en: 'Past, Experience and Ongoing Actions' },
    lessons: [
      {
        title: { vi: 'Kể chuyện đã xảy ra (了 hoàn thành)', en: 'Telling What Happened' },
        intro: 'Bạn muốn kể hôm qua và cuối tuần trước mình đã làm gì. Bài này củng cố 了 sau động từ và 没(有) cho phủ định, cùng các từ chỉ thời gian quá khứ.',
        vocab: [
          ['上个周末', 'shàng ge zhōumò', 'noun', 'cuối tuần trước', '上个周末我去爬山了。', 'Cuối tuần trước tôi đã đi leo núi.'],
          ['昨天晚上', 'zuótiān wǎnshang', 'noun', 'tối hôm qua', '昨天晚上我看了一个电影。', 'Tối qua tôi đã xem một bộ phim.'],
          ['爬山', 'páshān', 'verb', 'leo núi', '我喜欢爬山。', 'Tôi thích leo núi.'],
          ['做饭', 'zuòfàn', 'verb', 'nấu cơm', '妈妈在家做饭。', 'Mẹ nấu cơm ở nhà.'],
          ['打扫', 'dǎsǎo', 'verb', 'dọn dẹp', '我们打扫了房间。', 'Chúng tôi đã dọn phòng.'],
          ['洗', 'xǐ', 'verb', 'rửa, giặt', '我洗了衣服。', 'Tôi đã giặt quần áo.'],
          ['买东西', 'mǎi dōngxi', 'verb phrase', 'mua đồ', '周末我去商店买东西。', 'Cuối tuần tôi đi cửa hàng mua đồ.'],
          ['玩', 'wán', 'verb', 'chơi', '孩子们在公园玩。', 'Bọn trẻ chơi ở công viên.'],
          ['累', 'lèi', 'adjective', 'mệt', '我今天很累。', 'Hôm nay tôi rất mệt.'],
          ['高兴', 'gāoxìng', 'adjective', 'vui', '见到你我很高兴。', 'Gặp bạn tôi rất vui.'],
        ],
        grammar: {
          title: 'V + 了 (hoàn thành) và 没(有) + V (phủ định)',
          explain: '了 đặt sau động từ để chỉ việc đã hoàn thành: 我看了一个电影 (tôi đã xem một bộ phim). Khi động từ có tân ngữ mang số lượng, 了 thường đứng sau động từ; nếu không có số lượng, 了 có thể đứng cuối câu: 我去商店了. Phủ định của việc đã xảy ra dùng 没(有) và bỏ 了: 昨天我没去上班. Thời gian quá khứ như 昨天, 上个周末 đứng trước động từ.',
          examples: [
            ['上个周末我去爬山了。', 'Cuối tuần trước tôi đã đi leo núi.', 'Shàng ge zhōumò wǒ qù páshān le.'],
            ['昨天晚上我看了一个电影。', 'Tối qua tôi đã xem một bộ phim.', 'Zuótiān wǎnshang wǒ kàn le yí gè diànyǐng.'],
            ['昨天我没去上班。', 'Hôm qua tôi đã không đi làm.', 'Zuótiān wǒ méi qù shàngbān.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '上个周末你做什么了？', 'Cuối tuần trước bạn đã làm gì?', 'Shàng ge zhōumò nǐ zuò shénme le?'],
            ['阮', '我去爬山了，很累，但是很高兴。', 'Tôi đã đi leo núi, rất mệt nhưng rất vui.', 'Wǒ qù páshān le, hěn lèi, dànshì hěn gāoxìng.'],
            ['李明', '昨天晚上呢？', 'Còn tối qua thì sao?', 'Zuótiān wǎnshang ne?'],
            ['阮', '昨天晚上我看了一个电影，没做饭。', 'Tối qua tôi xem một bộ phim, không nấu cơm.', 'Zuótiān wǎnshang wǒ kàn le yí gè diànyǐng, méi zuòfàn.'],
          ],
        },
        reorder: [
          ['上个周末|我|去|爬山|了|。', 'Cuối tuần trước tôi đã đi leo núi.'],
          ['昨天|我|没|去|上班|。', 'Hôm qua tôi đã không đi làm.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi đã xem một bộ phim” (dùng 了 sau động từ).', source: '我 / 看 / 一个电影', pattern: 'V + 了 + 数量 + N。', answers: ['我看了一个电影。', '我看了一个电影'] },
          { prompt: 'Nói “Hôm qua tôi đã không đi làm”.', source: '昨天 / 我 / 去 / 上班', pattern: '没 + V。', answers: ['昨天我没去上班。', '昨天我没去上班', '我昨天没去上班。', '我昨天没去上班'] },
        ],
        tip: ['没 không đi cùng 了', 'Phủ định việc đã xảy ra chỉ dùng 没(有), và bỏ 了: 我没去. Không nói 我没去了 (trừ nghĩa khác, “đã không còn đi nữa”).'],
      },
      {
        title: { vi: 'Từng làm gì chưa? (过)', en: 'Have You Ever…? (guo)' },
        intro: 'Bạn muốn hỏi và kể những điều đã từng trải qua như du lịch, ăn món lạ. Bài này dạy trợ từ 过 và phủ định 没……过.',
        vocab: [
          ['过', 'guo', 'particle', '(đã từng)', '我去过北京。', 'Tôi đã từng đến Bắc Kinh.'],
          ['北京', 'Běijīng', 'proper noun', 'Bắc Kinh', '北京是中国的首都。', 'Bắc Kinh là thủ đô của Trung Quốc.'],
          ['长城', 'Chángchéng', 'proper noun', 'Vạn Lý Trường Thành', '你爬过长城吗？', 'Bạn đã từng leo Vạn Lý Trường Thành chưa?'],
          ['旅游', 'lǚyóu', 'verb', 'du lịch', '我喜欢去国外旅游。', 'Tôi thích đi du lịch nước ngoài.'],
          ['见面', 'jiànmiàn', 'verb', 'gặp mặt', '我们只见过一次面。', 'Chúng tôi chỉ gặp mặt một lần.'],
          ['次', 'cì', 'measure word', 'lần', '我去过两次中国。', 'Tôi đã đến Trung Quốc hai lần.'],
          ['从来', 'cónglái', 'adverb', 'từ trước đến nay', '我从来没吃过这个菜。', 'Từ trước đến nay tôi chưa ăn món này.'],
          ['饺子', 'jiǎozi', 'noun', 'sủi cảo', '你吃过饺子吗？', 'Bạn đã từng ăn sủi cảo chưa?'],
          ['京剧', 'jīngjù', 'noun', 'kinh kịch', '我看过一次京剧。', 'Tôi đã xem kinh kịch một lần.'],
          ['有意思', 'yǒu yìsi', 'adjective', 'thú vị', '这部电影很有意思。', 'Bộ phim này rất thú vị.'],
        ],
        grammar: {
          title: 'V + 过 / 没(有) + V + 过',
          explain: '过 đặt sau động từ để nói “đã từng” — chỉ trải nghiệm, không nhấn thời điểm cụ thể: 我去过北京. Phủ định: 没(有) + V + 过: 我没去过上海; thường kèm 从来: 我从来没吃过饺子. Hỏi: V + 过 + 吗？ hoặc V + 没 + V + 过？ Số lần đặt sau 过: 我去过两次. Khác với 了 (sự việc đã xảy ra), 过 nhấn vào kinh nghiệm.',
          examples: [
            ['我去过北京。', 'Tôi đã từng đến Bắc Kinh.', 'Wǒ qù guo Běijīng.'],
            ['你吃过饺子吗？', 'Bạn đã từng ăn sủi cảo chưa?', 'Nǐ chī guo jiǎozi ma?'],
            ['我从来没看过京剧。', 'Từ trước đến nay tôi chưa xem kinh kịch.', 'Wǒ cónglái méi kàn guo jīngjù.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你去过北京吗？', 'Bạn đã từng đến Bắc Kinh chưa?', 'Nǐ qù guo Běijīng ma?'],
            ['阮', '去过两次。我还爬过长城。', 'Đi hai lần rồi. Tôi còn từng leo Vạn Lý Trường Thành.', 'Qù guo liǎng cì. Wǒ hái pá guo Chángchéng.'],
            ['李明', '你吃过饺子吗？', 'Bạn đã từng ăn sủi cảo chưa?', 'Nǐ chī guo jiǎozi ma?'],
            ['阮', '吃过，很好吃。但是我从来没看过京剧。', 'Từng ăn rồi, rất ngon. Nhưng tôi chưa từng xem kinh kịch.', 'Chī guo, hěn hǎochī. Dànshì wǒ cónglái méi kàn guo jīngjù.'],
          ],
        },
        reorder: [
          ['我|去|过|北京|。', 'Tôi đã từng đến Bắc Kinh.'],
          ['你|吃|过|饺子|吗|？', 'Bạn đã từng ăn sủi cảo chưa?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi đã từng đến Bắc Kinh” bằng 过.', source: '我 / 去 / 北京', pattern: 'V + 过。', answers: ['我去过北京。', '我去过北京'] },
        ],
        tip: ['过 hay 了?', 'So sánh: 我去了北京 (tôi đã đến Bắc Kinh — việc đó đã xảy ra, có thể vừa về), với 我去过北京 (tôi từng đến Bắc Kinh — kinh nghiệm sống). Hỏi “bạn đã từng…” hãy dùng 过.'],
      },
      {
        title: { vi: 'Đang làm gì? (在・正在・呢)', en: 'What Are You Doing Now?' },
        intro: 'Bạn muốn nói ai đang làm gì ngay lúc này, ví dụ khi nghe điện thoại. Bài này dạy 正在, 在 và 呢 để diễn tả hành động đang diễn ra.',
        vocab: [
          ['正在', 'zhèngzài', 'adverb', 'đang', '我正在看电视。', 'Tôi đang xem tivi.'],
          ['电视', 'diànshì', 'noun', 'tivi', '他在看电视。', 'Anh ấy đang xem tivi.'],
          ['电脑', 'diànnǎo', 'noun', 'máy tính', '我在用电脑工作。', 'Tôi đang dùng máy tính để làm việc.'],
          ['打电话', 'dǎ diànhuà', 'verb phrase', 'gọi điện thoại', '妈妈正在打电话。', 'Mẹ đang gọi điện thoại.'],
          ['听音乐', 'tīng yīnyuè', 'verb phrase', 'nghe nhạc', '他在听音乐。', 'Anh ấy đang nghe nhạc.'],
          ['写', 'xiě', 'verb', 'viết', '我在写作业。', 'Tôi đang viết bài tập.'],
          ['作业', 'zuòyè', 'noun', 'bài tập', '你做完作业了吗？', 'Bạn làm xong bài tập chưa?'],
          ['睡觉', 'shuìjiào', 'verb', 'đi ngủ', '孩子正在睡觉。', 'Đứa bé đang ngủ.'],
          ['等', 'děng', 'verb', 'đợi', '请等一下。', 'Xin đợi một chút.'],
          ['忙着', 'mángzhe', 'adjective', 'đang bận', '我现在忙着做饭。', 'Bây giờ tôi đang bận nấu cơm.'],
        ],
        grammar: {
          title: '正在 / 在 + V (+ 呢)',
          explain: 'Hành động đang diễn ra dùng 在, 正在 hoặc 正 trước động từ, thường kèm 呢 cuối câu: 我正在看电视呢. Phủ định: 没(有) + 在 + V: 他没在看电视. Câu hỏi: 你在做什么？ Tránh nhầm 在 chỉ vị trí (我在家) và 在 chỉ tiến hành (我在看书); cả hai có thể đi cùng: 我在家看书.',
          examples: [
            ['我正在看电视呢。', 'Tôi đang xem tivi đây.', 'Wǒ zhèngzài kàn diànshì ne.'],
            ['你在做什么？', 'Bạn đang làm gì?', 'Nǐ zài zuò shénme?'],
            ['妈妈在打电话。', 'Mẹ đang gọi điện thoại.', 'Māma zài dǎ diànhuà.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '喂，你在做什么呢？', 'A lô, bạn đang làm gì thế?', 'Wéi, nǐ zài zuò shénme ne?'],
            ['阮', '我正在写作业，你呢？', 'Tôi đang viết bài tập, còn bạn?', 'Wǒ zhèngzài xiě zuòyè, nǐ ne?'],
            ['李明', '我在看电视，妈妈在做饭。', 'Tôi đang xem tivi, mẹ đang nấu cơm.', 'Wǒ zài kàn diànshì, māma zài zuòfàn.'],
            ['阮', '你等一下，我写完作业就去找你。', 'Bạn đợi một chút, tôi viết xong bài tập sẽ đến tìm bạn.', 'Nǐ děng yíxià, wǒ xiě wán zuòyè jiù qù zhǎo nǐ.'],
          ],
        },
        reorder: [
          ['我|正在|看|电视|呢|。', 'Tôi đang xem tivi đây.'],
          ['你|在|做|什么|？', 'Bạn đang làm gì?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Mẹ đang gọi điện thoại” bằng 在 hoặc 正在.', source: '妈妈 / 打电话', pattern: '在 / 正在 + V。', answers: ['妈妈在打电话。', '妈妈在打电话', '妈妈正在打电话。', '妈妈正在打电话', '妈妈正在打电话呢。', '妈妈正在打电话呢'] },
        ],
        tip: ['喂 và 你好', 'Khi bắt máy, người Trung Quốc nói 喂 (wéi) hoặc 喂，你好. Trong công ty hoặc cuộc gọi trang trọng nên nói 您好, 请问您找哪位？ (xin hỏi ngài muốn gặp ai?).'],
      },
    ],
  },
  {
    level: 'HSK2',
    names: { vi: 'Kế hoạch, so sánh và lựa chọn', en: 'Plans, Comparisons and Choices' },
    lessons: [
      {
        title: { vi: 'Dự định và lý do (要・打算・因为…所以…)', en: 'Plans and Reasons' },
        intro: 'Bạn muốn nói kế hoạch sắp tới và giải thích lý do. Bài này dạy 要 / 打算 / 准备, cùng cặp liên từ 因为……所以……, 虽然……但是……',
        vocab: [
          ['打算', 'dǎsuàn', 'verb', 'dự định', '我打算明年去中国学习。', 'Tôi dự định sang Trung Quốc học vào năm sau.'],
          ['准备', 'zhǔnbèi', 'verb', 'chuẩn bị', '我在准备考试。', 'Tôi đang chuẩn bị cho kỳ thi.'],
          ['考试', 'kǎoshì', 'noun', 'kỳ thi', '下周有汉语考试。', 'Tuần sau có kỳ thi tiếng Hán.'],
          ['明年', 'míngnián', 'noun', 'năm sau', '明年我要去上海工作。', 'Sang năm tôi sẽ đi Thượng Hải làm việc.'],
          ['因为', 'yīnwèi', 'conjunction', 'bởi vì', '因为下雨，我没出去。', 'Vì trời mưa nên tôi không ra ngoài.'],
          ['所以', 'suǒyǐ', 'conjunction', 'cho nên', '我感冒了，所以没去上班。', 'Tôi bị cảm nên không đi làm.'],
          ['虽然', 'suīrán', 'conjunction', 'tuy', '虽然很累，但是很高兴。', 'Tuy mệt nhưng rất vui.'],
          ['但是', 'dànshì', 'conjunction', 'nhưng', '汉语很难，但是很有意思。', 'Tiếng Hán khó nhưng thú vị.'],
          ['决定', 'juédìng', 'verb', 'quyết định', '我决定学汉语。', 'Tôi quyết định học tiếng Hán.'],
          ['已经', 'yǐjīng', 'adverb', 'đã', '我已经吃饭了。', 'Tôi đã ăn cơm rồi.'],
        ],
        grammar: {
          title: '打算 / 要 + V, 因为…所以…, 虽然…但是…',
          explain: '打算 + V = dự định làm gì (我打算去北京). 要 + V = sắp/muốn làm, nhấn tính chắc chắn hơn. 准备 + V = chuẩn bị làm. Cặp 因为……所以…… nối nguyên nhân – kết quả: 因为下雨，所以我没出去 (trong khẩu ngữ có thể bỏ một vế). Cặp 虽然……但是…… diễn đạt tương phản: 虽然很累，但是很高兴. Trong tiếng Trung, không dùng cùng lúc 虽然 và 但是 trong tiếng Việt “tuy… nhưng…” như tiếng Anh “although… but…”; cả hai đều dùng được.',
          examples: [
            ['我打算明年去中国学习。', 'Tôi dự định sang Trung Quốc học vào năm sau.', 'Wǒ dǎsuàn míngnián qù Zhōngguó xuéxí.'],
            ['因为下雨，所以我没出去。', 'Vì trời mưa nên tôi không ra ngoài.', 'Yīnwèi xià yǔ, suǒyǐ wǒ méi chūqù.'],
            ['虽然汉语很难，但是很有意思。', 'Tuy tiếng Hán khó nhưng rất thú vị.', 'Suīrán Hànyǔ hěn nán, dànshì hěn yǒu yìsi.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '明年你打算做什么？', 'Sang năm bạn dự định làm gì?', 'Míngnián nǐ dǎsuàn zuò shénme?'],
            ['阮', '我打算去中国学习汉语。', 'Tôi dự định sang Trung Quốc học tiếng Hán.', 'Wǒ dǎsuàn qù Zhōngguó xuéxí Hànyǔ.'],
            ['李明', '为什么？', 'Tại sao vậy?', 'Wèi shénme?'],
            ['阮', '因为我喜欢中国文化，所以我决定去。', 'Vì tôi thích văn hóa Trung Quốc nên tôi quyết định đi.', 'Yīnwèi wǒ xǐhuan Zhōngguó wénhuà, suǒyǐ wǒ juédìng qù.'],
          ],
        },
        reorder: [
          ['我|打算|明年|去|中国|学习|。', 'Tôi dự định sang Trung Quốc học vào năm sau.'],
          ['因为|下雨|，|所以|我|没|出去|。', 'Vì trời mưa nên tôi không ra ngoài.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi dự định sang Trung Quốc học” bằng 打算.', source: '我 / 去中国学习', pattern: '我打算 + V。', answers: ['我打算去中国学习。', '我打算去中国学习'] },
        ],
        tip: ['Lược bớt từ nối', 'Trong khẩu ngữ, người Trung thường chỉ dùng một trong hai vế: 因为下雨，我没去 hoặc 下雨了，所以我没去. Dùng cả hai thì lời văn trang trọng hơn.'],
      },
      {
        title: { vi: 'So sánh (比・没有・一样)', en: 'Comparisons' },
        intro: 'Bạn muốn so sánh hai thành phố, hai món ăn hay hai người. Bài này dạy mẫu 比, 没有, 一样 và 更/最.',
        vocab: [
          ['比', 'bǐ', 'preposition', 'so với', '今天比昨天冷。', 'Hôm nay lạnh hơn hôm qua.'],
          ['一样', 'yíyàng', 'adjective', 'giống nhau', '这两个一样大。', 'Hai cái này to bằng nhau.'],
          ['更', 'gèng', 'adverb', 'hơn nữa', '我觉得汉语更难。', 'Tôi thấy tiếng Hán còn khó hơn.'],
          ['最', 'zuì', 'adverb', 'nhất', '我最喜欢吃面条。', 'Tôi thích ăn mì nhất.'],
          ['远', 'yuǎn', 'adjective', 'xa', '学校离这儿不远。', 'Trường không xa chỗ này.'],
          ['近', 'jìn', 'adjective', 'gần', '我家离公司很近。', 'Nhà tôi rất gần công ty.'],
          ['快', 'kuài', 'adjective', 'nhanh', '高铁比汽车快。', 'Tàu cao tốc nhanh hơn ô tô.'],
          ['慢', 'màn', 'adjective', 'chậm', '他说话很慢。', 'Anh ấy nói rất chậm.'],
          ['高铁', 'gāotiě', 'noun', 'tàu cao tốc', '我坐高铁去北京。', 'Tôi đi tàu cao tốc đến Bắc Kinh.'],
          ['觉得', 'juéde', 'verb', 'cảm thấy, nghĩ', '你觉得怎么样？', 'Bạn thấy thế nào?'],
        ],
        grammar: {
          title: 'A 比 B + Adj / A 没有 B + Adj / A 跟 B 一样 + Adj',
          explain: 'So sánh hơn: A 比 B + tính từ (高铁比汽车快). Không dùng 很 trước tính từ trong mẫu này (不说 比……很快). Nhấn mức độ: 更 (hơn nữa) hoặc thêm số lượng sau tính từ: 他比我大三岁. So sánh không bằng: A 没有 B + tính từ (汽车没有高铁快). Bằng nhau: A 跟 B 一样 + tính từ. Nhất: 最 + tính từ (最好).',
          examples: [
            ['高铁比汽车快。', 'Tàu cao tốc nhanh hơn ô tô.', 'Gāotiě bǐ qìchē kuài.'],
            ['今天比昨天冷。', 'Hôm nay lạnh hơn hôm qua.', 'Jīntiān bǐ zuótiān lěng.'],
            ['汽车没有高铁快。', 'Ô tô không nhanh bằng tàu cao tốc.', 'Qìchē méiyǒu gāotiě kuài.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '我们坐高铁还是坐汽车去北京？', 'Chúng ta đi tàu cao tốc hay ô tô đến Bắc Kinh?', 'Wǒmen zuò gāotiě háishi zuò qìchē qù Běijīng?'],
            ['阮', '坐高铁吧，高铁比汽车快。', 'Đi tàu cao tốc đi, tàu cao tốc nhanh hơn ô tô.', 'Zuò gāotiě ba, gāotiě bǐ qìchē kuài.'],
            ['李明', '可是高铁比汽车贵。', 'Nhưng tàu cao tốc đắt hơn ô tô.', 'Kěshì gāotiě bǐ qìchē guì.'],
            ['阮', '没关系，今天比昨天冷，坐高铁更舒服。', 'Không sao, hôm nay lạnh hơn hôm qua, đi tàu cao tốc thoải mái hơn.', 'Méi guānxi, jīntiān bǐ zuótiān lěng, zuò gāotiě gèng shūfu.'],
          ],
        },
        reorder: [
          ['高铁|比|汽车|快|。', 'Tàu cao tốc nhanh hơn ô tô.'],
          ['今天|比|昨天|冷|。', 'Hôm nay lạnh hơn hôm qua.'],
        ],
        grammarQ: [
          { prompt: 'So sánh: “Tàu cao tốc nhanh hơn ô tô” bằng 比.', source: '高铁 / 汽车 / 快', pattern: 'A 比 B + Adj。', answers: ['高铁比汽车快。', '高铁比汽车快'] },
        ],
        tip: ['Không thêm 很 sau 比', 'Sai: 他比我很高. Đúng: 他比我高 hoặc 他比我高很多 (cao hơn nhiều). 很 và 比 không đi cùng nhau trong mẫu so sánh hơn.'],
      },
      {
        title: { vi: 'Lựa chọn (还是・或者・一边…一边…)', en: 'Choosing and Doing Two Things' },
        intro: 'Bạn muốn hỏi người khác muốn chọn gì, rủ đi chơi và nói mình làm hai việc cùng lúc. Bài này dạy 还是, 或者 và 一边……一边……',
        vocab: [
          ['还是', 'háishi', 'conjunction', 'hay là (câu hỏi)', '你喝茶还是喝咖啡？', 'Bạn uống trà hay uống cà phê?'],
          ['或者', 'huòzhě', 'conjunction', 'hoặc (câu trần thuật)', '周末我看书或者看电影。', 'Cuối tuần tôi đọc sách hoặc xem phim.'],
          ['一边', 'yìbiān', 'adverb', 'vừa (làm A vừa làm B)', '他一边听音乐一边做作业。', 'Anh ấy vừa nghe nhạc vừa làm bài tập.'],
          ['一起', 'yìqǐ', 'adverb', 'cùng nhau', '我们一起去吧。', 'Chúng ta cùng đi nhé.'],
          ['可以', 'kěyǐ', 'verb', 'có thể, được phép', '这里可以拍照吗？', 'Ở đây có được chụp ảnh không?'],
          ['对', 'duì', 'adjective', 'đúng', '你说得对。', 'Bạn nói đúng.'],
          ['新鲜', 'xīnxiān', 'adjective', 'tươi', '这里的水果很新鲜。', 'Hoa quả ở đây rất tươi.'],
          ['水果', 'shuǐguǒ', 'noun', 'hoa quả', '我喜欢吃水果。', 'Tôi thích ăn hoa quả.'],
          ['选', 'xuǎn', 'verb', 'chọn', '你选哪一个？', 'Bạn chọn cái nào?'],
          ['怎么样', 'zěnmeyàng', 'pronoun', 'thế nào', '今天天气怎么样？', 'Thời tiết hôm nay thế nào?'],
        ],
        grammar: {
          title: '还是 (hỏi), 或者 (kể), 一边……一边……',
          explain: '还是 dùng trong câu hỏi lựa chọn: 你喝茶还是喝咖啡？ (bạn uống trà hay cà phê?). 或者 dùng trong câu trần thuật để nối các khả năng: 我喝茶或者咖啡. Phân biệt rất quan trọng với người học Việt. 一边……一边…… diễn đạt hai hành động diễn ra đồng thời: 他一边听音乐一边做作业. Có thể rút gọn: 边听音乐边做作业. Rủ ai làm gì: 我们一起……吧.',
          examples: [
            ['你喝茶还是喝咖啡？', 'Bạn uống trà hay uống cà phê?', 'Nǐ hē chá háishi hē kāfēi?'],
            ['周末我看书或者看电影。', 'Cuối tuần tôi đọc sách hoặc xem phim.', 'Zhōumò wǒ kàn shū huòzhě kàn diànyǐng.'],
            ['他一边听音乐一边做作业。', 'Anh ấy vừa nghe nhạc vừa làm bài tập.', 'Tā yìbiān tīng yīnyuè yìbiān zuò zuòyè.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '周末我们一起出去玩吧。你想看电影还是爬山？', 'Cuối tuần chúng ta cùng đi chơi nhé. Bạn muốn xem phim hay leo núi?', 'Zhōumò wǒmen yìqǐ chūqù wán ba. Nǐ xiǎng kàn diànyǐng háishi páshān?'],
            ['阮', '我都可以，你选吧。', 'Tôi sao cũng được, bạn chọn đi.', 'Wǒ dōu kěyǐ, nǐ xuǎn ba.'],
            ['李明', '那我们先看电影，或者去公园。', 'Vậy chúng ta xem phim trước, hoặc đến công viên.', 'Nà wǒmen xiān kàn diànyǐng, huòzhě qù gōngyuán.'],
            ['阮', '好，我们可以一边走路一边聊天。', 'Được, chúng ta có thể vừa đi bộ vừa trò chuyện.', 'Hǎo, wǒmen kěyǐ yìbiān zǒulù yìbiān liáotiān.'],
          ],
        },
        reorder: [
          ['你|喝|茶|还是|喝|咖啡|？', 'Bạn uống trà hay uống cà phê?'],
          ['他|一边|听|音乐|一边|做|作业|。', 'Anh ấy vừa nghe nhạc vừa làm bài tập.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi “Bạn uống trà hay uống cà phê?” bằng 还是.', source: '你 / 茶 / 咖啡', pattern: 'A 还是 B？', answers: ['你喝茶还是喝咖啡？', '你喝茶还是喝咖啡?', '你喝茶还是咖啡？', '你喝茶还是咖啡?', '你喝茶还是喝咖啡', '你喝茶还是咖啡'] },
        ],
        tip: ['Sao cũng được: 都可以', 'Khi bạn không có ý kiến, nói 都可以 (đều được) hoặc 随便 (tùy bạn). Người Trung Quốc thường dùng chúng để thể hiện sự linh hoạt, nhưng đừng lạm dụng vì có thể bị coi là thiếu quyết đoán.'],
      },
    ],
  },
  {
    level: 'HSK2',
    names: { vi: 'Sức khỏe, nhà hàng và điện thoại', en: 'Health, Restaurant and Phone' },
    lessons: [
      {
        title: { vi: 'Khám bệnh và lời khuyên (应该・别)', en: 'At the Clinic and Giving Advice' },
        intro: 'Bạn bị ốm và phải nói triệu chứng với bác sĩ. Bài này dạy từ vựng về cơ thể, bệnh và mẫu 应该, 别, 最好 để khuyên người khác.',
        vocab: [
          ['生病', 'shēngbìng', 'verb', 'bị ốm', '他生病了，没去上课。', 'Anh ấy bị ốm nên không đi học.'],
          ['感冒', 'gǎnmào', 'verb', 'cảm lạnh', '我感冒了。', 'Tôi bị cảm.'],
          ['发烧', 'fāshāo', 'verb', 'sốt', '孩子发烧了。', 'Đứa bé bị sốt.'],
          ['头疼', 'tóuténg', 'verb', 'đau đầu', '我头疼，想休息。', 'Tôi đau đầu, muốn nghỉ.'],
          ['药', 'yào', 'noun', 'thuốc', '我吃了药就好了。', 'Uống thuốc xong tôi sẽ khỏe.'],
          ['休息', 'xiūxi', 'verb', 'nghỉ ngơi', '你应该多休息。', 'Bạn nên nghỉ ngơi nhiều.'],
          ['身体', 'shēntǐ', 'noun', 'cơ thể, sức khỏe', '身体最重要。', 'Sức khỏe là quan trọng nhất.'],
          ['应该', 'yīnggāi', 'verb', 'nên', '你应该去医院。', 'Bạn nên đến bệnh viện.'],
          ['别', 'bié', 'adverb', 'đừng', '别担心，没事。', 'Đừng lo, không sao đâu.'],
          ['最好', 'zuìhǎo', 'adverb', 'tốt nhất là', '最好早点睡觉。', 'Tốt nhất là ngủ sớm một chút.'],
        ],
        grammar: {
          title: '应该 + V / 别 + V / 最好 + V',
          explain: '应该 + động từ = nên làm gì (你应该去医院). 别 + động từ = đừng (别担心); lịch sự hơn: 请别…. 最好 + động từ = tốt nhất là (最好多喝水). Mẫu 了 cuối câu trong 感冒了, 发烧了 chỉ trạng thái mới xuất hiện: “đã bị…”. Hỏi triệu chứng: 你哪儿不舒服？ (bạn khó chịu ở đâu?).',
          examples: [
            ['你应该去医院。', 'Bạn nên đến bệnh viện.', 'Nǐ yīnggāi qù yīyuàn.'],
            ['别担心，吃了药就好了。', 'Đừng lo, uống thuốc xong sẽ khỏe.', 'Bié dānxīn, chī le yào jiù hǎo le.'],
            ['最好早点睡觉。', 'Tốt nhất là ngủ sớm một chút.', 'Zuìhǎo zǎo diǎn shuìjiào.'],
          ],
        },
        dialogue: {
          lines: [
            ['医生', '你哪儿不舒服？', 'Bạn khó chịu ở đâu?', 'Nǐ nǎr bù shūfu?'],
            ['阮', '我头疼，还有点儿发烧。', 'Tôi đau đầu, còn hơi sốt.', 'Wǒ tóuténg, hái yǒu diǎnr fāshāo.'],
            ['医生', '你感冒了。吃药以后，应该多休息。', 'Bạn bị cảm. Sau khi uống thuốc, bạn nên nghỉ ngơi nhiều.', 'Nǐ gǎnmào le. Chī yào yǐhòu, yīnggāi duō xiūxi.'],
            ['阮', '好的，谢谢医生。', 'Vâng, cảm ơn bác sĩ.', 'Hǎo de, xièxie yīshēng.'],
          ],
        },
        reorder: [
          ['你|应该|去|医院|。', 'Bạn nên đến bệnh viện.'],
          ['最好|早点|睡觉|。', 'Tốt nhất là ngủ sớm.'],
        ],
        grammarQ: [
          { prompt: 'Khuyên bạn “nên đến bệnh viện” bằng 应该.', source: '你 / 去医院', pattern: '应该 + V。', answers: ['你应该去医院。', '你应该去医院'] },
        ],
        tip: ['Triệu chứng với 了', '感冒了, 发烧了 dùng 了 để nói “đã bị”. Không nói 我有感冒 hay 我是感冒; hãy dùng 我感冒了.'],
      },
      {
        title: { vi: 'Gọi món ở nhà hàng (请问・给・来)', en: 'Ordering at a Restaurant' },
        intro: 'Bạn đi ăn nhà hàng và muốn gọi món, hỏi giá, tính tiền. Bài này dạy các câu dùng khi gọi món và các lượng từ cho đồ ăn thức uống.',
        vocab: [
          ['菜单', 'càidān', 'noun', 'thực đơn', '请给我菜单。', 'Xin đưa tôi thực đơn.'],
          ['点菜', 'diǎncài', 'verb', 'gọi món', '我们可以点菜了吗？', 'Chúng tôi gọi món được chưa?'],
          ['服务员', 'fúwùyuán', 'noun', 'nhân viên phục vụ', '服务员，请过来一下。', 'Phục vụ ơi, xin lại đây một chút.'],
          ['碗', 'wǎn', 'measure word', 'bát', '我要一碗面条。', 'Tôi lấy một bát mì.'],
          ['杯', 'bēi', 'measure word', 'cốc, ly', '来两杯茶。', 'Cho hai cốc trà.'],
          ['瓶', 'píng', 'measure word', 'chai', '请给我一瓶水。', 'Xin cho tôi một chai nước.'],
          ['给', 'gěi', 'verb', 'cho, đưa', '请给我一杯水。', 'Xin cho tôi một cốc nước.'],
          ['辣', 'là', 'adjective', 'cay', '这个菜太辣了。', 'Món này cay quá.'],
          ['结账', 'jiézhàng', 'verb', 'tính tiền', '服务员，请结账。', 'Phục vụ ơi, xin tính tiền.'],
          ['饱', 'bǎo', 'adjective', 'no', '我吃饱了。', 'Tôi ăn no rồi.'],
        ],
        grammar: {
          title: '请给我… / 来 + 数量 + 菜 / 太…了',
          explain: 'Gọi món dùng 来 + số lượng + lượng từ + món (来一碗面条) hoặc 请给我 + số lượng + lượng từ + món. Số lượng đặt trước lượng từ: 一碗, 两杯, 三瓶 (số 2 dùng 两). Từ chối nhẹ: 不要辣的 (không cay). 太…了 chỉ mức độ quá: 太辣了. Khi đủ no: 我吃饱了; tính tiền: 请结账 / 买单.',
          examples: [
            ['请给我菜单。', 'Xin đưa tôi thực đơn.', 'Qǐng gěi wǒ càidān.'],
            ['我要一碗面条，来两杯茶。', 'Tôi lấy một bát mì, cho hai cốc trà.', 'Wǒ yào yì wǎn miàntiáo, lái liǎng bēi chá.'],
            ['这个菜太辣了。', 'Món này cay quá.', 'Zhège cài tài là le.'],
          ],
        },
        dialogue: {
          lines: [
            ['服务员', '你们好，请看菜单。', 'Xin chào, mời các bạn xem thực đơn.', 'Nǐmen hǎo, qǐng kàn càidān.'],
            ['阮', '我要一碗面条，来两杯茶。不要辣的。', 'Tôi lấy một bát mì, cho hai cốc trà. Đừng cay nhé.', 'Wǒ yào yì wǎn miàntiáo, lái liǎng bēi chá. Bú yào là de.'],
            ['服务员', '好的，还要别的吗？', 'Vâng, còn gọi gì nữa không ạ?', 'Hǎo de, hái yào bié de ma?'],
            ['阮', '不要了，谢谢。我吃饱了，请结账。', 'Không cần nữa, cảm ơn. Tôi no rồi, xin tính tiền.', 'Bú yào le, xièxie. Wǒ chī bǎo le, qǐng jiézhàng.'],
          ],
        },
        reorder: [
          ['我|要|一|碗|面条|。', 'Tôi lấy một bát mì.'],
          ['这个|菜|太|辣|了|。', 'Món này cay quá.'],
        ],
        grammarQ: [
          { prompt: 'Gọi “một bát mì” bằng 要 + lượng từ.', source: '面条', pattern: '我要 + 数 + 碗 + 面条。', answers: ['我要一碗面条。', '我要一碗面条', '来一碗面条。', '来一碗面条'] },
        ],
        tip: ['Lượng từ cho đồ ăn uống', 'Món nước thường dùng 碗 (bát), đồ uống dùng 杯 (cốc) hoặc 瓶 (chai). Lượng từ chung 个 vẫn dùng được nhưng không tự nhiên bằng lượng từ đúng loại.'],
      },
      {
        title: { vi: 'Điện thoại và hẹn gặp (喂・一下・先…再…)', en: 'Phone Calls and Appointments' },
        intro: 'Bạn cần gọi điện đặt lịch hẹn, thông báo đến muộn và sắp xếp thời gian. Bài này dạy các câu điện thoại thông dụng, 一下, 先……再……, và 等一会儿.',
        vocab: [
          ['喂', 'wéi', 'interjection', 'a lô', '喂，你好！', 'A lô, xin chào!'],
          ['找', 'zhǎo', 'verb', 'tìm, gặp', '请问，你找谁？', 'Xin hỏi, bạn tìm ai?'],
          ['一下', 'yíxià', 'quantity', 'một chút (làm thử)', '请等一下。', 'Xin đợi một chút.'],
          ['号码', 'hàomǎ', 'noun', 'số (điện thoại, phòng)', '请告诉我你的号码。', 'Xin cho tôi biết số của bạn.'],
          ['告诉', 'gàosu', 'verb', 'nói cho biết', '请告诉他我来了。', 'Xin nói với anh ấy tôi đã đến.'],
          ['约', 'yuē', 'verb', 'hẹn', '我想约你周末见面。', 'Tôi muốn hẹn bạn gặp vào cuối tuần.'],
          ['开会', 'kāihuì', 'verb', 'họp', '经理正在开会。', 'Giám đốc đang họp.'],
          ['回来', 'huílái', 'verb', 'trở về', '他一会儿就回来。', 'Một lát nữa anh ấy sẽ về.'],
          ['一会儿', 'yíhuìr', 'quantity', 'một lát', '请等一会儿。', 'Xin đợi một lát.'],
          ['先', 'xiān', 'adverb', 'trước', '我们先吃饭，再去看电影。', 'Chúng ta ăn cơm trước rồi đi xem phim.'],
        ],
        grammar: {
          title: 'V + 一下 / 先 + V₁，再 + V₂ / 一会儿',
          explain: 'V + 一下 làm hành động nhẹ nhàng, ngắn gọn hơn: 请等一下 (xin đợi một chút), 看一下 (xem thử). 先……再…… chỉ thứ tự: 先吃饭，再看电影. 一会儿 là “một lát”: 他一会儿就回来. Trong điện thoại: 喂 (bắt máy), 请问找谁？ (xin hỏi bạn tìm ai?), 他不在 (anh ấy không có đây), 请你转告他 (xin nhắn lại cho anh ấy).',
          examples: [
            ['请等一下，他在开会。', 'Xin đợi một chút, anh ấy đang họp.', 'Qǐng děng yíxià, tā zài kāihuì.'],
            ['我们先吃饭，再去看电影。', 'Chúng ta ăn cơm trước, rồi đi xem phim.', 'Wǒmen xiān chīfàn, zài qù kàn diànyǐng.'],
            ['请告诉他我来了。', 'Xin nói với anh ấy tôi đã đến.', 'Qǐng gàosu tā wǒ lái le.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '喂，你好，请问王经理在吗？', 'A lô, xin chào, cho hỏi giám đốc Vương có ở đó không?', 'Wéi, nǐ hǎo, qǐngwèn Wáng jīnglǐ zài ma?'],
            ['秘书', '他正在开会，请等一会儿。', 'Anh ấy đang họp, xin đợi một lát.', 'Tā zhèngzài kāihuì, qǐng děng yíhuìr.'],
            ['阮', '好，请告诉他我来了。我想约他周末见面。', 'Được, xin nói với anh ấy tôi đã đến. Tôi muốn hẹn anh ấy gặp vào cuối tuần.', 'Hǎo, qǐng gàosu tā wǒ lái le. Wǒ xiǎng yuē tā zhōumò jiànmiàn.'],
            ['秘书', '好的，我先记一下你的号码。', 'Vâng, để tôi ghi lại số của bạn trước đã.', 'Hǎo de, wǒ xiān jì yíxià nǐ de hàomǎ.'],
          ],
        },
        reorder: [
          ['请|等|一下|，|他|在|开会|。', 'Xin đợi một chút, anh ấy đang họp.'],
          ['我们|先|吃饭|，|再|去|看|电影|。', 'Chúng ta ăn cơm trước, rồi đi xem phim.'],
        ],
        grammarQ: [
          { prompt: 'Nhờ ai “đợi một chút” bằng 一下.', source: '请 / 等', pattern: '请 + V + 一下。', answers: ['请等一下。', '请等一下', '请等一下，他在开会。', '请你等一下。', '请你等一下'] },
        ],
        tip: ['Gọi điện cho cấp trên', 'Với cấp trên hoặc người lớn tuổi hãy dùng 您 thay 你 và 请问您是哪位？ khi nhấc máy. Kết thúc cuộc gọi bằng 谢谢，再见 — đừng cúp máy đột ngột.'],
      },
    ],
  },
  {
    level: 'HSK2',
    names: { vi: 'Công việc, thời tiết và du lịch', en: 'Work, Weather and Travel' },
    lessons: [
      {
        title: { vi: 'Công việc và học tập (会・能・可以)', en: 'Work and Study' },
        intro: 'Bạn muốn nói về công việc, việc học và những gì mình có thể làm. Bài này phân biệt 会, 能, 可以 và dạy từ vựng nơi làm việc.',
        vocab: [
          ['工作', 'gōngzuò', 'verb', 'làm việc; công việc', '我在银行工作。', 'Tôi làm việc ở ngân hàng.'],
          ['公司', 'gōngsī', 'noun', 'công ty', '我的公司离家很近。', 'Công ty tôi rất gần nhà.'],
          ['经理', 'jīnglǐ', 'noun', 'giám đốc, quản lý', '王经理在办公室。', 'Giám đốc Vương đang ở văn phòng.'],
          ['同事', 'tóngshì', 'noun', 'đồng nghiệp', '我的同事很友好。', 'Đồng nghiệp của tôi rất thân thiện.'],
          ['办公室', 'bàngōngshì', 'noun', 'văn phòng', '我在办公室等你。', 'Tôi đợi bạn ở văn phòng.'],
          ['打印', 'dǎyìn', 'verb', 'in', '我想打印一份文件。', 'Tôi muốn in một bản tài liệu.'],
          ['文件', 'wénjiàn', 'noun', 'tài liệu', '请把文件给我。', 'Xin đưa tài liệu cho tôi.'],
          ['学习', 'xuéxí', 'verb', 'học tập', '我在大学学习经济。', 'Tôi học kinh tế ở đại học.'],
          ['练习', 'liànxí', 'verb', 'luyện tập', '我每天练习写汉字。', 'Mỗi ngày tôi luyện viết chữ Hán.'],
          ['汉字', 'Hànzì', 'noun', 'chữ Hán', '汉字很难写。', 'Chữ Hán khó viết.'],
        ],
        grammar: {
          title: '会 / 能 / 可以 + V',
          explain: '会 = biết làm nhờ đã học (我会写汉字). 能 = có khả năng hoặc có điều kiện thực hiện (我今天能来, vì rảnh). 可以 = được phép hoặc có thể (这里可以拍照吗？). Phủ định: 不会, 不能, 不可以/不能 (cấm dùng 不可以 mạnh hơn). 会 còn dùng để dự đoán tương lai: 明天会下雨. Lưu ý: trong câu hỏi xin phép, 可以 và 能 đều dùng được.',
          examples: [
            ['我会写一百个汉字。', 'Tôi biết viết một trăm chữ Hán.', 'Wǒ huì xiě yì bǎi gè Hànzì.'],
            ['你今天能来吗？', 'Hôm nay bạn có thể đến không?', 'Nǐ jīntiān néng lái ma?'],
            ['这里可以拍照吗？', 'Ở đây có được chụp ảnh không?', 'Zhèlǐ kěyǐ pāizhào ma?'],
          ],
        },
        dialogue: {
          lines: [
            ['经理', '你会用电脑吗？', 'Bạn biết dùng máy tính không?', 'Nǐ huì yòng diànnǎo ma?'],
            ['阮', '会，我还会写一点儿汉字。', 'Biết, tôi còn biết viết một chút chữ Hán.', 'Huì, wǒ hái huì xiě yìdiǎnr Hànzì.'],
            ['经理', '明天你能来办公室吗？', 'Ngày mai bạn có thể đến văn phòng không?', 'Míngtiān nǐ néng lái bàngōngshì ma?'],
            ['阮', '可以，我九点能到。', 'Được, tôi có thể đến lúc chín giờ.', 'Kěyǐ, wǒ jiǔ diǎn néng dào.'],
          ],
        },
        reorder: [
          ['我|会|写|一百|个|汉字|。', 'Tôi biết viết một trăm chữ Hán.'],
          ['这里|可以|拍照|吗|？', 'Ở đây được chụp ảnh không?'],
        ],
        grammarQ: [
          { prompt: 'Hỏi xin phép “Ở đây có được chụp ảnh không?” bằng 可以.', source: '这里 / 拍照', pattern: '可以 + V + 吗？', answers: ['这里可以拍照吗？', '这里可以拍照吗?', '这里可以拍照吗'] },
        ],
        tip: ['会 và 能 khác nhau', '“我会游泳” = tôi biết bơi (đã học). “我能游泳” = tôi có thể bơi (hôm nay sức khỏe tốt, hoặc hồ bơi mở). Cùng một người có thể 会 nhưng hôm nay không 能.'],
      },
      {
        title: { vi: 'Thời tiết và mùa (天气・太…了)', en: 'Weather and Seasons' },
        intro: 'Bạn muốn nói thời tiết hôm nay, so sánh các mùa và khuyên bạn mang ô, mặc ấm. Bài này dạy từ vựng thời tiết, mùa và nhiệt độ.',
        vocab: [
          ['天气', 'tiānqì', 'noun', 'thời tiết', '今天天气很好。', 'Hôm nay thời tiết rất đẹp.'],
          ['下雨', 'xiàyǔ', 'verb', 'mưa', '明天会下雨。', 'Ngày mai sẽ mưa.'],
          ['下雪', 'xiàxuě', 'verb', 'tuyết rơi', '北京冬天常常下雪。', 'Bắc Kinh mùa đông thường có tuyết.'],
          ['热', 'rè', 'adjective', 'nóng', '夏天很热。', 'Mùa hè rất nóng.'],
          ['冷', 'lěng', 'adjective', 'lạnh', '今天太冷了。', 'Hôm nay lạnh quá.'],
          ['春天', 'chūntiān', 'noun', 'mùa xuân', '春天天气很舒服。', 'Mùa xuân thời tiết rất dễ chịu.'],
          ['秋天', 'qiūtiān', 'noun', 'mùa thu', '秋天是我最喜欢的季节。', 'Mùa thu là mùa tôi thích nhất.'],
          ['度', 'dù', 'measure word', 'độ (nhiệt)', '今天三十度。', 'Hôm nay ba mươi độ.'],
          ['雨伞', 'yǔsǎn', 'noun', 'cái ô', '带雨伞吧。', 'Mang theo ô đi.'],
          ['舒服', 'shūfu', 'adjective', 'dễ chịu, thoải mái', '今天很舒服。', 'Hôm nay rất dễ chịu.'],
        ],
        grammar: {
          title: '天气 + Adj / 太 + Adj + 了 / 会 + 下雨',
          explain: 'Mô tả thời tiết bằng 天气 + tính từ hoặc động từ khí tượng: 天气很好, 下雨了, 下雪了. 太……了 diễn tả mức quá: 太冷了 (lạnh quá). 会 + V dự đoán: 明天会下雨 (ngày mai sẽ mưa). Hỏi nhiệt độ: 今天多少度？ Hỏi thời tiết: 今天天气怎么样？ Khuyên: 带雨伞吧, 多穿点儿.',
          examples: [
            ['今天天气很好。', 'Hôm nay thời tiết rất đẹp.', 'Jīntiān tiānqì hěn hǎo.'],
            ['明天会下雨，带雨伞吧。', 'Ngày mai sẽ mưa, mang ô đi.', 'Míngtiān huì xiàyǔ, dài yǔsǎn ba.'],
            ['今天太冷了，多穿点儿。', 'Hôm nay lạnh quá, mặc thêm chút nhé.', 'Jīntiān tài lěng le, duō chuān diǎnr.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '今天天气怎么样？', 'Hôm nay thời tiết thế nào?', 'Jīntiān tiānqì zěnmeyàng?'],
            ['阮', '今天太冷了，只有五度。', 'Hôm nay lạnh quá, chỉ có năm độ.', 'Jīntiān tài lěng le, zhǐ yǒu wǔ dù.'],
            ['李明', '明天呢？', 'Còn ngày mai?', 'Míngtiān ne?'],
            ['阮', '明天会下雨，你带雨伞吧。', 'Ngày mai sẽ mưa, bạn mang ô đi.', 'Míngtiān huì xiàyǔ, nǐ dài yǔsǎn ba.'],
          ],
        },
        reorder: [
          ['今天|天气|很|好|。', 'Hôm nay thời tiết rất đẹp.'],
          ['明天|会|下雨|，|带|雨伞|吧|。', 'Ngày mai sẽ mưa, mang ô đi.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Hôm nay lạnh quá” bằng 太……了.', source: '今天 / 冷', pattern: '太 + Adj + 了。', answers: ['今天太冷了。', '今天太冷了'] },
        ],
        tip: ['下雨 là động từ ly hợp', '下雨 (xiàyǔ) gồm động từ 下 + tân ngữ 雨 nên khi cần thêm 了 thì 了 đứng giữa hoặc cuối câu: 下雨了 hoặc 下了雨. Hai cách đều dùng được, 下雨了 phổ biến hơn.'],
      },
      {
        title: { vi: 'Du lịch và chỉ đường (从…到・离・往)', en: 'Travel and Directions' },
        intro: 'Bạn đi du lịch ở Trung Quốc và cần hỏi đường, nói khoảng cách và mua vé. Bài này dạy 从……到……, 离, 往 và cách chỉ đường chi tiết.',
        vocab: [
          ['离', 'lí', 'preposition', 'cách (khoảng cách)', '学校离我家很近。', 'Trường cách nhà tôi rất gần.'],
          ['从', 'cóng', 'preposition', 'từ', '从这儿到机场要一个小时。', 'Từ đây đến sân bay mất một tiếng.'],
          ['到', 'dào', 'verb', 'đến', '我八点到公司。', 'Tôi đến công ty lúc tám giờ.'],
          ['往', 'wǎng', 'preposition', 'hướng về', '往前走一百米。', 'Đi thẳng về phía trước một trăm mét.'],
          ['机场', 'jīchǎng', 'noun', 'sân bay', '我们去机场接朋友。', 'Chúng tôi đi sân bay đón bạn.'],
          ['火车站', 'huǒchēzhàn', 'noun', 'ga tàu hỏa', '火车站离这里很远。', 'Ga tàu hỏa cách đây rất xa.'],
          ['票', 'piào', 'noun', 'vé', '我想买两张票。', 'Tôi muốn mua hai tấm vé.'],
          ['小时', 'xiǎoshí', 'noun', 'giờ (khoảng thời gian)', '飞机要飞三个小时。', 'Máy bay bay mất ba tiếng.'],
          ['路', 'lù', 'noun', 'con đường', '这条路很长。', 'Con đường này rất dài.'],
          ['红绿灯', 'hónglǜdēng', 'noun', 'đèn giao thông', '过了红绿灯往左走。', 'Qua đèn giao thông thì rẽ trái.'],
        ],
        grammar: {
          title: 'A 离 B + 远/近, 从 A 到 B, 往 + hướng + 走',
          explain: '离 chỉ khoảng cách giữa hai điểm: 学校离我家很近 (trường cách nhà tôi rất gần). 从……到…… chỉ phạm vi thời gian hoặc nơi chốn: 从这儿到机场要一个小时 (từ đây đến sân bay mất một tiếng). 往 + hướng + 走 dùng chỉ đường: 往前走, 往左拐 (rẽ trái), 往右拐. Hỏi: 离这儿远吗？ Số mét, kilômét: 一百米, 两公里. Dùng 要 chỉ khoảng thời gian cần thiết: 要三十分钟.',
          examples: [
            ['学校离我家很近。', 'Trường cách nhà tôi rất gần.', 'Xuéxiào lí wǒ jiā hěn jìn.'],
            ['从这儿到机场要一个小时。', 'Từ đây đến sân bay mất một tiếng.', 'Cóng zhèr dào jīchǎng yào yí gè xiǎoshí.'],
            ['往前走，过了红绿灯往左拐。', 'Đi thẳng, qua đèn giao thông thì rẽ trái.', 'Wǎng qián zǒu, guò le hónglǜdēng wǎng zuǒ guǎi.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '请问，火车站离这儿远吗？', 'Xin hỏi, ga tàu hỏa cách đây có xa không?', 'Qǐngwèn, huǒchēzhàn lí zhèr yuǎn ma?'],
            ['路人', '不太远，走路要二十分钟。', 'Không xa lắm, đi bộ mất hai mươi phút.', 'Bú tài yuǎn, zǒulù yào èrshí fēnzhōng.'],
            ['阮', '怎么走？', 'Đi thế nào ạ?', 'Zěnme zǒu?'],
            ['路人', '往前走，过了红绿灯往左拐，就到了。', 'Đi thẳng, qua đèn giao thông thì rẽ trái là tới.', 'Wǎng qián zǒu, guò le hónglǜdēng wǎng zuǒ guǎi, jiù dào le.'],
          ],
        },
        reorder: [
          ['学校|离|我家|很|近|。', 'Trường cách nhà tôi rất gần.'],
          ['往|前|走|，|过了|红绿灯|往|左|拐|。', 'Đi thẳng, qua đèn giao thông thì rẽ trái.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Trường cách nhà tôi rất gần” bằng 离.', source: '学校 / 我家 / 近', pattern: 'A 离 B + Adj。', answers: ['学校离我家很近。', '学校离我家很近'] },
        ],
        tip: ['离 khác 从', '离 nói về khoảng cách giữa hai điểm (A 离 B 近/远); 从 chỉ điểm xuất phát (从 A 到 B). Đừng dùng 从 khi muốn nói “cách”: nói 离学校很远 chứ không phải 从学校很远.'],
      },
    ],
  },
];
