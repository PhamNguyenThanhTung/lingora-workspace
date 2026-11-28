import type { UnitSpec } from '../types.ts';

/**
 * Chinese HSK 2 — extension units (8–10): services, change and comparison, and review.
 * Same conventions as zh-hsk2.ts: simplified characters, Hanyu Pinyin with tone marks.
 */
export const ZH_HSK2_EXTRA2_UNITS: UnitSpec[] = [
  {
    level: 'HSK2',
    names: { vi: 'Dịch vụ: khách sạn, ngân hàng, bưu điện', en: 'Services: Hotel, Bank and Post Office' },
    lessons: [
      {
        title: { vi: 'Đặt phòng khách sạn', en: 'Booking a Hotel Room' },
        intro: 'Bạn đặt phòng, hỏi giá và nhận phòng. Bài này dạy từ vựng khách sạn và các câu hỏi lịch sự thường dùng ở quầy lễ tân.',
        vocab: [
          ['酒店', 'jiǔdiàn', 'noun', 'khách sạn', '这家酒店很干净。', 'Khách sạn này rất sạch.'],
          ['房间', 'fángjiān', 'noun', 'căn phòng', '我想订一个房间。', 'Tôi muốn đặt một phòng.'],
          ['订', 'dìng', 'verb', 'đặt trước', '我已经订好房间了。', 'Tôi đã đặt phòng rồi.'],
          ['单人间', 'dānrénjiān', 'noun', 'phòng đơn', '单人间一晚多少钱？', 'Phòng đơn một đêm bao nhiêu tiền?'],
          ['双人间', 'shuāngrénjiān', 'noun', 'phòng đôi', '我要一个双人间。', 'Tôi cần một phòng đôi.'],
          ['晚', 'wǎn', 'measure word', 'đêm', '我们住两晚。', 'Chúng tôi ở hai đêm.'],
          ['住', 'zhù', 'verb', 'ở, sống', '你住在哪家酒店？', 'Bạn ở khách sạn nào?'],
          ['护照', 'hùzhào', 'noun', 'hộ chiếu', '请给我看一下护照。', 'Xin cho tôi xem hộ chiếu.'],
          ['早餐', 'zǎocān', 'noun', 'bữa sáng', '早餐几点开始？', 'Bữa sáng mấy giờ bắt đầu?'],
          ['退房', 'tuì fáng', 'verb phrase', 'trả phòng', '明天中午十二点退房。', 'Trưa mai mười hai giờ trả phòng.'],
        ],
        grammar: {
          title: 'Hỏi và đặt: 我想订… / …多少钱一晚？',
          explain: 'Để đặt phòng dùng 我想订 + số lượng + loại phòng: 我想订一个双人间. Hỏi giá theo đêm: 一晚多少钱？ Nói thời gian ở: 住 + số + 晚 (住两晚). Khi cần xác nhận, dùng 请问 mở đầu để lịch sự và kết thúc bằng 可以吗？ hoặc 好吗？ Số lượng đứng trước loại từ: 一个房间, hai phòng là 两个房间 (không dùng 二个).',
          examples: [
            ['我想订一个双人间。', 'Tôi muốn đặt một phòng đôi.', 'Wǒ xiǎng dìng yí ge shuāngrénjiān.'],
            ['单人间一晚多少钱？', 'Phòng đơn một đêm bao nhiêu tiền?', 'Dānrénjiān yì wǎn duōshao qián?'],
            ['我们住两晚。', 'Chúng tôi ở hai đêm.', 'Wǒmen zhù liǎng wǎn.'],
          ],
        },
        dialogue: {
          lines: [
            ['前台', '您好，请问有什么可以帮您？', 'Xin chào, tôi có thể giúp gì cho quý khách?', 'Nín hǎo, qǐngwèn yǒu shénme kěyǐ bāng nín?'],
            ['阮', '我想订一个双人间，住两晚。', 'Tôi muốn đặt một phòng đôi, ở hai đêm.', 'Wǒ xiǎng dìng yí ge shuāngrénjiān, zhù liǎng wǎn.'],
            ['前台', '好的，请给我看一下护照。', 'Được ạ, xin cho tôi xem hộ chiếu.', 'Hǎo de, qǐng gěi wǒ kàn yíxià hùzhào.'],
            ['阮', '早餐几点开始？明天几点退房？', 'Bữa sáng mấy giờ bắt đầu? Mai mấy giờ trả phòng?', 'Zǎocān jǐ diǎn kāishǐ? Míngtiān jǐ diǎn tuì fáng?'],
          ],
        },
        reorder: [
          ['我|想|订|一个|双人间|。', 'Tôi muốn đặt một phòng đôi.'],
          ['单人间|一晚|多少|钱|？', 'Phòng đơn một đêm bao nhiêu tiền?'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi muốn đặt một phòng đôi.', source: '我 / 订 / 双人间', pattern: '我想订 + số + loại phòng', answers: ['我想订一个双人间。', '我想订一个双人间'] },
          { prompt: 'Hỏi phòng đơn một đêm bao nhiêu tiền.', source: '单人间 / 一晚 / 多少钱', pattern: 'N + 一晚 + 多少钱？', answers: ['单人间一晚多少钱？', '单人间一晚多少钱', '单人间一晚多少钱?'] },
        ],
        tip: ['两 và 二', 'Trước loại từ nói 两 (两晚, 两个房间), còn 二 dùng khi đếm số hoặc đọc số điện thoại, số phòng.'],
      },
      {
        title: { vi: 'Ở ngân hàng', en: 'At the Bank' },
        intro: 'Bạn mở tài khoản, đổi tiền hoặc rút tiền. Bài này dạy từ vựng ngân hàng cơ bản và cách nhờ nhân viên giúp đỡ.',
        vocab: [
          ['银行', 'yínháng', 'noun', 'ngân hàng', '银行在邮局旁边。', 'Ngân hàng ở cạnh bưu điện.'],
          ['换钱', 'huàn qián', 'verb phrase', 'đổi tiền', '我想换钱。', 'Tôi muốn đổi tiền.'],
          ['美元', 'měiyuán', 'noun', 'đô la Mỹ', '我有一百美元。', 'Tôi có một trăm đô la Mỹ.'],
          ['人民币', 'rénmínbì', 'noun', 'nhân dân tệ', '一美元换多少人民币？', 'Một đô la đổi được bao nhiêu nhân dân tệ?'],
          ['取钱', 'qǔ qián', 'verb phrase', 'rút tiền', '我要去取钱。', 'Tôi phải đi rút tiền.'],
          ['存钱', 'cún qián', 'verb phrase', 'gửi tiền', '他每个月都存钱。', 'Tháng nào anh ấy cũng gửi tiền tiết kiệm.'],
          ['卡', 'kǎ', 'noun', 'thẻ', '我的卡丢了。', 'Thẻ của tôi bị mất rồi.'],
          ['密码', 'mìmǎ', 'noun', 'mật khẩu', '请输入密码。', 'Xin nhập mật khẩu.'],
          ['填', 'tián', 'verb', 'điền', '请填一下这张表。', 'Xin điền vào tờ đơn này.'],
          ['表', 'biǎo', 'noun', 'biểu mẫu, bảng', '这张表怎么填？', 'Tờ đơn này điền thế nào?'],
        ],
        grammar: {
          title: 'Nhờ giúp đỡ: 请 + V + 一下 / 能不能…？',
          explain: 'Ở ngân hàng ta thường nhờ nhân viên bằng 请 + động từ + 一下 (một chút): 请填一下这张表. Hỏi khả năng lịch sự dùng 能不能 + động từ: 能不能帮我换钱？ Kết hợp 把 để nói rõ việc: 请把卡给我. Hỏi cách làm: 怎么 + động từ？ như 这张表怎么填？ (tờ đơn này điền thế nào?).',
          examples: [
            ['请填一下这张表。', 'Xin điền vào tờ đơn này.', 'Qǐng tián yíxià zhè zhāng biǎo.'],
            ['能不能帮我换钱？', 'Có thể giúp tôi đổi tiền được không?', 'Néng bu néng bāng wǒ huàn qián?'],
            ['这张表怎么填？', 'Tờ đơn này điền thế nào?', 'Zhè zhāng biǎo zěnme tián?'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '你好，我想换钱。', 'Xin chào, tôi muốn đổi tiền.', 'Nǐ hǎo, wǒ xiǎng huàn qián.'],
            ['职员', '您换什么钱？', 'Quý khách đổi loại tiền nào?', 'Nín huàn shénme qián?'],
            ['阮', '一百美元，换人民币。', 'Một trăm đô la Mỹ, đổi sang nhân dân tệ.', 'Yì bǎi měiyuán, huàn rénmínbì.'],
            ['职员', '好的，请填一下这张表。', 'Vâng, xin điền vào tờ đơn này.', 'Hǎo de, qǐng tián yíxià zhè zhāng biǎo.'],
          ],
        },
        reorder: [
          ['请|填|一下|这|张|表|。', 'Xin điền vào tờ đơn này.'],
          ['能不能|帮|我|换钱|？', 'Có thể giúp tôi đổi tiền được không?'],
        ],
        grammarQ: [
          { prompt: 'Nhờ ai điền tờ đơn.', source: '请 / 填 / 一下 / 这张表', pattern: '请 + V + 一下 + N', answers: ['请填一下这张表。', '请填一下这张表'] },
          { prompt: 'Hỏi lịch sự liệu có thể giúp đổi tiền.', source: '能不能 / 帮我 / 换钱', pattern: '能不能 + 帮我 + V？', answers: ['能不能帮我换钱？', '能不能帮我换钱', '能不能帮我换钱?'] },
        ],
        tip: ['一下 làm câu nhẹ nhàng', 'Thêm 一下 sau động từ khiến lời nhờ nghe nhẹ và lịch sự hơn: 请等一下, 请看一下.'],
      },
      {
        title: { vi: 'Gửi thư và bưu kiện', en: 'Sending Mail and Parcels' },
        intro: 'Bạn muốn gửi thư, bưu kiện hay mua tem. Bài này dạy từ vựng bưu điện và cách hỏi thời gian, phí gửi.',
        vocab: [
          ['邮局', 'yóujú', 'noun', 'bưu điện', '邮局几点关门？', 'Bưu điện mấy giờ đóng cửa?'],
          ['寄', 'jì', 'verb', 'gửi (thư, bưu kiện)', '我想寄一个包裹。', 'Tôi muốn gửi một bưu kiện.'],
          ['包裹', 'bāoguǒ', 'noun', 'bưu kiện', '这个包裹很重。', 'Bưu kiện này rất nặng.'],
          ['信', 'xìn', 'noun', 'lá thư', '我给妈妈寄了一封信。', 'Tôi gửi cho mẹ một lá thư.'],
          ['封', 'fēng', 'measure word', 'lá (thư)', '这封信要寄到越南。', 'Lá thư này cần gửi đến Việt Nam.'],
          ['邮票', 'yóupiào', 'noun', 'tem thư', '请给我两张邮票。', 'Xin cho tôi hai con tem.'],
          ['重', 'zhòng', 'adjective', 'nặng', '这个箱子太重了。', 'Cái va-li này nặng quá.'],
          ['地址', 'dìzhǐ', 'noun', 'địa chỉ', '请写一下地址。', 'Xin viết địa chỉ.'],
          ['多久', 'duōjiǔ', 'phrase', 'bao lâu', '寄到那儿要多久？', 'Gửi đến đó mất bao lâu?'],
          ['快递', 'kuàidì', 'noun', 'chuyển phát nhanh', '我用快递寄给你。', 'Tôi gửi chuyển phát nhanh cho bạn.'],
        ],
        grammar: {
          title: 'Hỏi thời gian: 要多久？ và 到…要…',
          explain: 'Hỏi một việc mất bao lâu dùng 要 + 多久: 寄到那儿要多久？ (gửi đến đó mất bao lâu?). Trả lời: 要 + khoảng thời gian: 要三天 (mất ba ngày). Cũng có thể nói 大概 + khoảng thời gian: 大概一个星期. Mẫu 把…寄到…: 我想把这个包裹寄到越南 — gửi bưu kiện đến một nơi.',
          examples: [
            ['寄到那儿要多久？', 'Gửi đến đó mất bao lâu?', 'Jì dào nàr yào duōjiǔ?'],
            ['大概要三天。', 'Khoảng ba ngày.', 'Dàgài yào sān tiān.'],
            ['我想把这个包裹寄到越南。', 'Tôi muốn gửi bưu kiện này đến Việt Nam.', 'Wǒ xiǎng bǎ zhège bāoguǒ jì dào Yuènán.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '你好，我想把这个包裹寄到越南。', 'Xin chào, tôi muốn gửi bưu kiện này đến Việt Nam.', 'Nǐ hǎo, wǒ xiǎng bǎ zhège bāoguǒ jì dào Yuènán.'],
            ['职员', '好的，请先写一下地址。', 'Vâng, xin viết địa chỉ trước.', 'Hǎo de, qǐng xiān xiě yíxià dìzhǐ.'],
            ['阮', '寄到那儿要多久？', 'Gửi đến đó mất bao lâu?', 'Jì dào nàr yào duōjiǔ?'],
            ['职员', '快递大概要三天。', 'Chuyển phát nhanh khoảng ba ngày.', 'Kuàidì dàgài yào sān tiān.'],
          ],
        },
        reorder: [
          ['寄|到|那儿|要|多久|？', 'Gửi đến đó mất bao lâu?'],
          ['大概|要|三|天|。', 'Khoảng ba ngày.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi gửi đến đó mất bao lâu.', source: '寄 / 到那儿 / 多久', pattern: 'V + 到 + nơi + 要多久？', answers: ['寄到那儿要多久？', '寄到那儿要多久', '寄到那儿要多久?'] },
          { prompt: 'Trả lời khoảng ba ngày.', source: '大概 / 三天', pattern: '大概 + 要 + thời gian', answers: ['大概要三天。', '大概要三天'] },
        ],
        tip: ['多久 và 多长时间', '多久 và 多长时间 đều hỏi khoảng thời gian; 多久 ngắn gọn hơn và rất phổ biến trong khẩu ngữ.'],
      },
    ],
  },
  {
    level: 'HSK2',
    names: { vi: 'Thay đổi, so sánh thêm và thói quen', en: 'Change, More Comparison and Habits' },
    lessons: [
      {
        title: { vi: 'Thay đổi: 越来越… và 变得…', en: 'Change: 越来越 and 变得' },
        intro: 'Bạn nói thời tiết nóng dần, tiếng Hán ngày càng dễ. Bài này dạy 越来越, 变, 了 để diễn tả sự thay đổi theo thời gian.',
        vocab: [
          ['越来越', 'yuè lái yuè', 'adverb', 'ngày càng', '天气越来越热了。', 'Thời tiết ngày càng nóng.'],
          ['变', 'biàn', 'verb', 'thay đổi, trở nên', '这个城市变了很多。', 'Thành phố này đã thay đổi rất nhiều.'],
          ['城市', 'chéngshì', 'noun', 'thành phố', '我喜欢这个城市。', 'Tôi thích thành phố này.'],
          ['胖', 'pàng', 'adjective', 'béo', '他最近变胖了。', 'Gần đây anh ấy mập lên.'],
          ['瘦', 'shòu', 'adjective', 'gầy', '她比以前瘦了。', 'Cô ấy gầy hơn trước.'],
          ['以前', 'yǐqián', 'noun', 'trước đây', '以前我不会说汉语。', 'Trước đây tôi không biết nói tiếng Hán.'],
          ['现在', 'xiànzài', 'noun', 'bây giờ', '现在我会说一点儿了。', 'Bây giờ tôi biết nói một chút rồi.'],
          ['进步', 'jìnbù', 'verb', 'tiến bộ', '你的汉语进步很快。', 'Tiếng Hán của bạn tiến bộ rất nhanh.'],
          ['容易', 'róngyì', 'adjective', 'dễ', '汉语越来越容易了。', 'Tiếng Hán ngày càng dễ.'],
          ['健康', 'jiànkāng', 'adjective', 'khỏe mạnh', '他的身体很健康。', 'Cơ thể anh ấy rất khỏe mạnh.'],
        ],
        grammar: {
          title: '越来越 + Adj / V + 了',
          explain: '越来越 + tính từ/động từ diễn tả mức độ tăng dần theo thời gian: 天气越来越热了 (trời ngày càng nóng). Cuối câu thường có 了. Có thể dùng với động từ tâm lý: 我越来越喜欢这里. Để nói “trở nên”, dùng 变 + 得/了: 他变胖了. So sánh với quá khứ: 比以前 + tính từ + 了: 她比以前瘦了.',
          examples: [
            ['天气越来越热了。', 'Thời tiết ngày càng nóng.', 'Tiānqì yuè lái yuè rè le.'],
            ['你的汉语进步很快。', 'Tiếng Hán của bạn tiến bộ rất nhanh.', 'Nǐ de Hànyǔ jìnbù hěn kuài.'],
            ['她比以前瘦了。', 'Cô ấy gầy hơn trước.', 'Tā bǐ yǐqián shòu le.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '好久不见！你变瘦了。', 'Lâu quá không gặp! Bạn gầy đi rồi.', 'Hǎojiǔ bú jiàn! Nǐ biàn shòu le.'],
            ['阮', '是啊，我现在每天运动。', 'Đúng vậy, bây giờ tôi tập thể dục mỗi ngày.', 'Shì a, wǒ xiànzài měi tiān yùndòng.'],
            ['李明', '你的汉语也进步了。', 'Tiếng Hán của bạn cũng tiến bộ rồi.', 'Nǐ de Hànyǔ yě jìnbù le.'],
            ['阮', '谢谢，我觉得汉语越来越容易了。', 'Cảm ơn, tôi thấy tiếng Hán ngày càng dễ.', 'Xièxie, wǒ juéde Hànyǔ yuè lái yuè róngyì le.'],
          ],
        },
        reorder: [
          ['天气|越来越|热|了|。', 'Thời tiết ngày càng nóng.'],
          ['她|比|以前|瘦|了|。', 'Cô ấy gầy hơn trước.'],
        ],
        grammarQ: [
          { prompt: 'Nói thời tiết ngày càng nóng.', source: '天气 / 越来越 / 热', pattern: 'S + 越来越 + Adj + 了', answers: ['天气越来越热了。', '天气越来越热了'] },
          { prompt: 'Nói cô ấy gầy hơn trước.', source: '她 / 以前 / 瘦', pattern: 'S + 比以前 + Adj + 了', answers: ['她比以前瘦了。', '她比以前瘦了'] },
        ],
        tip: ['越来越 không đi với số lượng', '越来越 chỉ đi với tính từ hoặc động từ tâm lý (热, 喜欢, 忙), không đi với số đếm cụ thể như “nhiều hơn ba cái”.'],
      },
      {
        title: { vi: 'So sánh: 越…越… và 更・最', en: 'More Comparison: 越…越…' },
        intro: 'Bạn nói “càng học càng thích”, “càng nhiều càng tốt”. Bài này dạy mẫu 越…越… và ôn lại 更, 最, 比较 để so sánh sâu hơn.',
        vocab: [
          ['越', 'yuè', 'adverb', 'càng', '他越说越快。', 'Anh ấy càng nói càng nhanh.'],
          ['比较', 'bǐjiào', 'adverb', 'khá, tương đối', '这个比较便宜。', 'Cái này khá rẻ.'],
          ['特别', 'tèbié', 'adverb', 'đặc biệt', '这里的菜特别好吃。', 'Đồ ăn ở đây đặc biệt ngon.'],
          ['有点儿', 'yǒudiǎnr', 'adverb', 'hơi', '今天有点儿冷。', 'Hôm nay hơi lạnh.'],
          ['一点儿', 'yìdiǎnr', 'quantity', 'một chút', '请说慢一点儿。', 'Xin nói chậm một chút.'],
          ['差不多', 'chàbuduō', 'adverb', 'gần như, xấp xỉ', '我们差不多高。', 'Chúng tôi cao gần bằng nhau.'],
          ['相同', 'xiāngtóng', 'adjective', 'giống nhau', '我们的爱好相同。', 'Sở thích của chúng tôi giống nhau.'],
          ['爱好', 'àihào', 'noun', 'sở thích', '你的爱好是什么？', 'Sở thích của bạn là gì?'],
          ['多', 'duō', 'adjective', 'nhiều', '越多越好。', 'Càng nhiều càng tốt.'],
          ['练习', 'liànxí', 'verb', 'luyện tập', '越练习越好。', 'Càng luyện tập càng giỏi.'],
        ],
        grammar: {
          title: '越…越… / 有点儿 và 一点儿',
          explain: '越 + A + 越 + B diễn tả hai mức độ tăng cùng nhau: 越练习越好 (càng luyện càng giỏi), 越多越好 (càng nhiều càng tốt). Hai chủ ngữ khác nhau vẫn dùng được: 你越说，我越不明白. Phân biệt 有点儿 (hơi, thường chê, đặt trước tính từ: 有点儿冷) và 一点儿 (một chút, đặt sau tính từ: 便宜一点儿).',
          examples: [
            ['越练习越好。', 'Càng luyện tập càng giỏi.', 'Yuè liànxí yuè hǎo.'],
            ['今天有点儿冷。', 'Hôm nay hơi lạnh.', 'Jīntiān yǒudiǎnr lěng.'],
            ['请说慢一点儿。', 'Xin nói chậm một chút.', 'Qǐng shuō màn yìdiǎnr.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你的爱好是什么？', 'Sở thích của bạn là gì?', 'Nǐ de àihào shì shénme?'],
            ['阮', '我喜欢唱歌，越唱越高兴。', 'Tôi thích hát, càng hát càng vui.', 'Wǒ xǐhuan chànggē, yuè chàng yuè gāoxìng.'],
            ['李明', '我们的爱好差不多。', 'Sở thích của chúng ta gần giống nhau.', 'Wǒmen de àihào chàbuduō.'],
            ['阮', '那我们一起练习吧，越多越好。', 'Vậy chúng ta cùng luyện tập nhé, càng nhiều càng tốt.', 'Nà wǒmen yìqǐ liànxí ba, yuè duō yuè hǎo.'],
          ],
        },
        reorder: [
          ['越|练习|越|好|。', 'Càng luyện tập càng giỏi.'],
          ['今天|有点儿|冷|。', 'Hôm nay hơi lạnh.'],
        ],
        grammarQ: [
          { prompt: 'Nói càng luyện tập càng giỏi.', source: '越 / 练习 / 好', pattern: '越 + V + 越 + Adj', answers: ['越练习越好。', '越练习越好'] },
          { prompt: 'Nói hôm nay hơi lạnh.', source: '今天 / 有点儿 / 冷', pattern: 'S + 有点儿 + Adj', answers: ['今天有点儿冷。', '今天有点儿冷'] },
        ],
        tip: ['有点儿 nghiêng về phàn nàn', '有点儿 thường dùng với điều không vừa ý: 有点儿贵, 有点儿累. Khi muốn yêu cầu, dùng Adj + 一点儿: 便宜一点儿.'],
      },
      {
        title: { vi: 'Thói quen và tần suất', en: 'Habits and Frequency' },
        intro: 'Bạn kể mình thường làm gì, bao lâu một lần. Bài này dạy các trạng từ tần suất và cách hỏi 多长时间一次.',
        vocab: [
          ['总是', 'zǒngshì', 'adverb', 'luôn luôn', '他总是很早起床。', 'Anh ấy luôn dậy rất sớm.'],
          ['经常', 'jīngcháng', 'adverb', 'thường xuyên', '我经常去图书馆。', 'Tôi thường xuyên đến thư viện.'],
          ['有时候', 'yǒu shíhou', 'adverb', 'đôi khi', '我有时候坐地铁上班。', 'Đôi khi tôi đi tàu điện ngầm đi làm.'],
          ['很少', 'hěn shǎo', 'adverb', 'rất ít khi', '他很少看电视。', 'Anh ấy rất ít khi xem tivi.'],
          ['从来不', 'cónglái bù', 'adverb', 'chưa bao giờ', '我从来不喝咖啡。', 'Tôi chưa bao giờ uống cà phê.'],
          ['每天', 'měi tiān', 'noun', 'mỗi ngày', '我每天跑步。', 'Tôi chạy bộ mỗi ngày.'],
          ['每周', 'měi zhōu', 'noun', 'mỗi tuần', '我每周打两次球。', 'Mỗi tuần tôi chơi bóng hai lần.'],
          ['次', 'cì', 'measure word', 'lần', '我一个月去一次。', 'Một tháng tôi đi một lần.'],
          ['习惯', 'xíguàn', 'noun', 'thói quen', '早起是个好习惯。', 'Dậy sớm là một thói quen tốt.'],
          ['锻炼', 'duànliàn', 'verb', 'rèn luyện', '他每天早上锻炼。', 'Sáng nào anh ấy cũng rèn luyện.'],
        ],
        grammar: {
          title: 'Trạng từ tần suất và 一…次',
          explain: 'Các trạng từ tần suất xếp theo mức độ: 总是 (luôn) > 经常 (thường) > 有时候 (đôi khi) > 很少 (ít khi) > 从来不 (chưa bao giờ). Chúng đứng trước động từ: 我经常去图书馆. Số lần dùng 次 đặt sau động từ: 每周打两次球 (mỗi tuần chơi hai lần). Hỏi tần suất: 你多长时间去一次？(Bao lâu bạn đi một lần?). Trả lời: 一个月一次.',
          examples: [
            ['我经常去图书馆。', 'Tôi thường xuyên đến thư viện.', 'Wǒ jīngcháng qù túshūguǎn.'],
            ['我每周打两次球。', 'Mỗi tuần tôi chơi bóng hai lần.', 'Wǒ měi zhōu dǎ liǎng cì qiú.'],
            ['你多长时间去一次？', 'Bao lâu bạn đi một lần?', 'Nǐ duō cháng shíjiān qù yí cì?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你经常锻炼吗？', 'Bạn có thường xuyên rèn luyện không?', 'Nǐ jīngcháng duànliàn ma?'],
            ['阮', '我每周打两次球，有时候跑步。', 'Mỗi tuần tôi chơi bóng hai lần, đôi khi chạy bộ.', 'Wǒ měi zhōu dǎ liǎng cì qiú, yǒu shíhou pǎobù.'],
            ['李明', '你喝咖啡吗？', 'Bạn có uống cà phê không?', 'Nǐ hē kāfēi ma?'],
            ['阮', '我从来不喝，早起是个好习惯。', 'Tôi chưa bao giờ uống, dậy sớm là thói quen tốt.', 'Wǒ cónglái bù hē, zǎoqǐ shì ge hǎo xíguàn.'],
          ],
        },
        reorder: [
          ['我|经常|去|图书馆|。', 'Tôi thường xuyên đến thư viện.'],
          ['我|每周|打|两|次|球|。', 'Mỗi tuần tôi chơi bóng hai lần.'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi thường xuyên đến thư viện.', source: '我 / 经常 / 图书馆', pattern: 'S + 经常 + V + nơi', answers: ['我经常去图书馆。', '我经常去图书馆'] },
          { prompt: 'Nói mỗi tuần tôi chơi bóng hai lần.', source: '每周 / 打球 / 两次', pattern: 'S + 每周 + V + số + 次 + O', answers: ['我每周打两次球。', '我每周打两次球'] },
        ],
        tip: ['Trạng từ đứng trước động từ', 'Trạng từ tần suất luôn đứng trước động từ, không đứng cuối câu như tiếng Việt “tôi đi thường xuyên”.'],
      },
    ],
  },
  {
    level: 'HSK2',
    names: { vi: 'Mua sắm trực tuyến, kế hoạch và ôn tập HSK2', en: 'Online Shopping, Plans and HSK2 Review' },
    lessons: [
      {
        title: { vi: 'Mua sắm trực tuyến', en: 'Shopping Online' },
        intro: 'Bạn đặt hàng, thanh toán và hỏi giao hàng. Bài này dạy từ vựng mua sắm online và cách nói về thanh toán, giao hàng.',
        vocab: [
          ['网上', 'wǎngshàng', 'noun', 'trên mạng', '我常在网上买东西。', 'Tôi thường mua đồ trên mạng.'],
          ['网站', 'wǎngzhàn', 'noun', 'trang web', '这个网站很方便。', 'Trang web này rất tiện.'],
          ['方便', 'fāngbiàn', 'adjective', 'tiện lợi', '网上买东西很方便。', 'Mua đồ trên mạng rất tiện.'],
          ['下单', 'xià dān', 'verb phrase', 'đặt hàng', '我昨天下单了。', 'Hôm qua tôi đã đặt hàng.'],
          ['付款', 'fù kuǎn', 'verb phrase', 'thanh toán', '你可以用手机付款。', 'Bạn có thể thanh toán bằng điện thoại.'],
          ['送', 'sòng', 'verb', 'tặng', '他们会送货上门。', 'Họ sẽ giao hàng tận nhà.'],
          ['送货', 'sòng huò', 'verb phrase', 'giao hàng', '什么时候送货？', 'Khi nào giao hàng?'],
          ['便宜', 'piányi', 'adjective', 'rẻ', '网上的东西比较便宜。', 'Đồ trên mạng khá rẻ.'],
          ['退', 'tuì', 'verb', 'trả lại, hoàn', '这件衣服太小，我想退。', 'Cái áo này nhỏ quá, tôi muốn trả lại.'],
          ['评价', 'píngjià', 'noun', 'đánh giá', '我看了很多评价。', 'Tôi đã đọc rất nhiều đánh giá.'],
        ],
        grammar: {
          title: 'Dùng 用 + phương tiện + V và 把 trong mua sắm',
          explain: 'Để nói bằng cách nào, dùng 用 + phương tiện + động từ: 用手机付款 (thanh toán bằng điện thoại). Hỏi khi nào: 什么时候 + V？ như 什么时候送货？ Dùng 把 khi muốn xử lý món hàng: 我想把这件衣服退了. Dùng 比较 để so giá: 网上比较便宜. Và 可以 để hỏi/cho phép: 可以退货吗？',
          examples: [
            ['你可以用手机付款。', 'Bạn có thể thanh toán bằng điện thoại.', 'Nǐ kěyǐ yòng shǒujī fù kuǎn.'],
            ['什么时候送货？', 'Khi nào giao hàng?', 'Shénme shíhou sòng huò?'],
            ['我想把这件衣服退了。', 'Tôi muốn trả lại cái áo này.', 'Wǒ xiǎng bǎ zhè jiàn yīfu tuì le.'],
          ],
        },
        dialogue: {
          lines: [
            ['阮', '你常在网上买东西吗？', 'Bạn có hay mua đồ trên mạng không?', 'Nǐ cháng zài wǎngshàng mǎi dōngxi ma?'],
            ['李明', '常买，很方便，也比较便宜。', 'Hay mua, rất tiện mà cũng khá rẻ.', 'Cháng mǎi, hěn fāngbiàn, yě bǐjiào piányi.'],
            ['阮', '怎么付款？什么时候送货？', 'Thanh toán thế nào? Khi nào giao hàng?', 'Zěnme fù kuǎn? Shénme shíhou sòng huò?'],
            ['李明', '用手机付款，三天就送到。', 'Thanh toán bằng điện thoại, ba ngày là giao đến.', 'Yòng shǒujī fù kuǎn, sān tiān jiù sòngdào.'],
          ],
        },
        reorder: [
          ['你|可以|用|手机|付款|。', 'Bạn có thể thanh toán bằng điện thoại.'],
          ['什么|时候|送货|？', 'Khi nào giao hàng?'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn có thể thanh toán bằng điện thoại.', source: '你 / 可以 / 手机 / 付款', pattern: 'S + 可以 + 用 + N + V', answers: ['你可以用手机付款。', '你可以用手机付款'] },
          { prompt: 'Hỏi khi nào giao hàng.', source: '什么时候 / 送货', pattern: '什么时候 + V？', answers: ['什么时候送货？', '什么时候送货', '什么时候送货?'] },
        ],
        tip: ['用 chỉ phương tiện', '用 + danh từ + động từ nghĩa là “dùng cái gì để làm gì”: 用筷子吃饭, 用手机付款. Rất dùng trong HSK2.'],
      },
      {
        title: { vi: 'Kế hoạch nghỉ lễ', en: 'Holiday Plans' },
        intro: 'Bạn bàn kế hoạch kỳ nghỉ: đi đâu, bằng gì, bao lâu. Bài này kết hợp 打算, 想, 要 với cách hỏi chi tiết.',
        vocab: [
          ['假期', 'jiàqī', 'noun', 'kỳ nghỉ', '假期你有什么打算？', 'Kỳ nghỉ bạn có dự định gì?'],
          ['旅行', 'lǚxíng', 'verb', 'du lịch', '我想去北京旅行。', 'Tôi muốn đi Bắc Kinh du lịch.'],
          ['景点', 'jǐngdiǎn', 'noun', 'điểm tham quan', '那儿有很多景点。', 'Ở đó có rất nhiều điểm tham quan.'],
          ['长城', 'Chángchéng', 'proper noun', 'Vạn Lý Trường Thành', '我想去爬长城。', 'Tôi muốn đi leo Vạn Lý Trường Thành.'],
          ['爬', 'pá', 'verb', 'leo, trèo', '我们明天去爬山。', 'Ngày mai chúng ta đi leo núi.'],
          ['照相', 'zhào xiàng', 'verb phrase', 'chụp ảnh', '我想在这里照相。', 'Tôi muốn chụp ảnh ở đây.'],
          ['行李', 'xíngli', 'noun', 'hành lý', '你的行李准备好了吗？', 'Hành lý của bạn chuẩn bị xong chưa?'],
          ['安排', 'ānpái', 'verb', 'sắp xếp', '我们来安排一下时间。', 'Chúng ta sắp xếp thời gian một chút.'],
          ['导游', 'dǎoyóu', 'noun', 'hướng dẫn viên', '导游说得很有意思。', 'Hướng dẫn viên nói rất thú vị.'],
          ['有意思', 'yǒu yìsi', 'adjective', 'thú vị', '这个地方很有意思。', 'Nơi này rất thú vị.'],
        ],
        grammar: {
          title: 'Nói về kế hoạch: 打算 / 想 / 准备 + V',
          explain: 'Để nói dự định, dùng 打算 / 想 / 准备 + động từ: 假期我打算去旅行. Hỏi kế hoạch: 你有什么打算？ Nối các hoạt động bằng 先…再…然后…: 先去北京，再去上海. Đưa ra gợi ý: 我们…吧. Nói bằng phương tiện gì: 坐飞机去 (đi bằng máy bay) với 坐 + phương tiện + 去.',
          examples: [
            ['假期我打算去北京旅行。', 'Kỳ nghỉ tôi dự định đi Bắc Kinh du lịch.', 'Jiàqī wǒ dǎsuàn qù Běijīng lǚxíng.'],
            ['我们先去长城，再去故宫。', 'Chúng ta đi Trường Thành trước, sau đó đến Cố Cung.', 'Wǒmen xiān qù Chángchéng, zài qù Gùgōng.'],
            ['你的行李准备好了吗？', 'Hành lý của bạn chuẩn bị xong chưa?', 'Nǐ de xíngli zhǔnbèi hǎo le ma?'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '假期你有什么打算？', 'Kỳ nghỉ bạn có dự định gì?', 'Jiàqī nǐ yǒu shénme dǎsuàn?'],
            ['阮', '我打算去北京旅行，先爬长城。', 'Tôi dự định đi Bắc Kinh du lịch, trước hết leo Vạn Lý Trường Thành.', 'Wǒ dǎsuàn qù Běijīng lǚxíng, xiān pá Chángchéng.'],
            ['李明', '那儿的景点很有意思。', 'Các điểm tham quan ở đó rất thú vị.', 'Nàr de jǐngdiǎn hěn yǒu yìsi.'],
            ['阮', '对，我还想多照相。', 'Đúng, tôi còn muốn chụp thật nhiều ảnh.', 'Duì, wǒ hái xiǎng duō zhào xiàng.'],
          ],
        },
        reorder: [
          ['假期|我|打算|去|北京|旅行|。', 'Kỳ nghỉ tôi dự định đi Bắc Kinh du lịch.'],
          ['我们|先|去|长城|，|再|去|故宫|。', 'Chúng ta đi Trường Thành trước, sau đó đến Cố Cung.'],
        ],
        grammarQ: [
          { prompt: 'Nói kỳ nghỉ tôi dự định đi Bắc Kinh du lịch.', source: '假期 / 打算 / 北京 / 旅行', pattern: '假期 + S + 打算 + V', answers: ['假期我打算去北京旅行。', '假期我打算去北京旅行'] },
          { prompt: 'Nói chúng ta đi Trường Thành trước, rồi đến Cố Cung.', source: '先 / 长城 / 再 / 故宫', pattern: '先 + V + 再 + V', answers: ['我们先去长城，再去故宫。', '我们先去长城,再去故宫。', '我们先去长城再去故宫'] },
        ],
        tip: ['先…再… và 然后', '先…再… nối hai bước kế tiếp. Muốn thêm bước nữa, dùng 然后 (sau đó): 先去长城，然后去故宫，最后去吃饭.'],
      },
      {
        title: { vi: 'Ôn tập HSK2: giới thiệu và kế hoạch', en: 'HSK2 Review: Introduction and Plans' },
        intro: 'Bài ôn tập này gom các mẫu quan trọng của HSK2: 了, 过, 把, 被, 越来越, 要…了 và kế hoạch. Bạn tự giới thiệu và kể chuyến đi ở mức cao hơn.',
        vocab: [
          ['自我介绍', 'zìwǒ jièshào', 'verb phrase', 'tự giới thiệu', '请你做一下自我介绍。', 'Xin bạn tự giới thiệu một chút.'],
          ['介绍', 'jièshào', 'verb', 'giới thiệu', '我来介绍一下我的家人。', 'Để tôi giới thiệu gia đình tôi.'],
          ['经验', 'jīngyàn', 'noun', 'kinh nghiệm', '他有很多工作经验。', 'Anh ấy có nhiều kinh nghiệm làm việc.'],
          ['特点', 'tèdiǎn', 'noun', 'đặc điểm', '这个城市有什么特点？', 'Thành phố này có đặc điểm gì?'],
          ['回答', 'huídá', 'verb', 'trả lời', '请回答我的问题。', 'Xin hãy trả lời câu hỏi của tôi.'],
          ['希望', 'xīwàng', 'verb', 'hy vọng', '我希望你玩得开心。', 'Tôi hy vọng bạn chơi vui vẻ.'],
          ['开心', 'kāixīn', 'adjective', 'vui vẻ', '今天我很开心。', 'Hôm nay tôi rất vui.'],
          ['以后', 'yǐhòu', 'noun', 'sau này', '以后我想当老师。', 'Sau này tôi muốn làm giáo viên.'],
          ['当', 'dāng', 'verb', 'làm (nghề), trở thành', '他想当医生。', 'Anh ấy muốn làm bác sĩ.'],
          ['总结', 'zǒngjié', 'verb', 'tổng kết', '我们来总结一下。', 'Chúng ta tổng kết một chút.'],
        ],
        grammar: {
          title: 'Ôn tập: kể kinh nghiệm, kết quả và dự định',
          explain: 'Khi tự giới thiệu, kết hợp nhiều mẫu đã học: 了 để kể việc đã làm (我去了北京), 过 để nói từng trải (我去过上海), 在/正在 cho việc đang làm, 越来越 cho thay đổi, 要…了 cho việc sắp xảy ra, và 打算 cho kế hoạch. Dùng 因为…所以… để giải thích và 虽然…但是… để đối lập. Bắt đầu bằng 大家好, 我叫… rồi kể từ quá khứ đến tương lai.',
          examples: [
            ['我去过北京，也去过上海。', 'Tôi từng đi Bắc Kinh, cũng từng đi Thượng Hải.', 'Wǒ qù guo Běijīng, yě qù guo Shànghǎi.'],
            ['我的汉语越来越好了。', 'Tiếng Hán của tôi ngày càng tốt.', 'Wǒ de Hànyǔ yuè lái yuè hǎo le.'],
            ['以后我想当老师。', 'Sau này tôi muốn làm giáo viên.', 'Yǐhòu wǒ xiǎng dāng lǎoshī.'],
          ],
        },
        dialogue: {
          lines: [
            ['老师', '请你做一下自我介绍。', 'Xin em tự giới thiệu một chút.', 'Qǐng nǐ zuò yíxià zìwǒ jièshào.'],
            ['阮', '大家好，我叫阮明，我去过北京。', 'Xin chào mọi người, tôi tên là Nguyễn Minh, tôi từng đến Bắc Kinh.', 'Dàjiā hǎo, wǒ jiào Ruǎn Míng, wǒ qù guo Běijīng.'],
            ['阮', '我的汉语越来越好了，我明年就要毕业了。', 'Tiếng Hán của tôi ngày càng tốt, sang năm tôi sắp tốt nghiệp.', 'Wǒ de Hànyǔ yuè lái yuè hǎo le, wǒ míngnián jiù yào bìyè le.'],
            ['阮', '以后我想当老师，希望大家多多帮助我。', 'Sau này tôi muốn làm giáo viên, hy vọng mọi người giúp đỡ nhiều.', 'Yǐhòu wǒ xiǎng dāng lǎoshī, xīwàng dàjiā duōduō bāngzhù wǒ.'],
          ],
        },
        reorder: [
          ['我|去|过|北京|，|也|去|过|上海|。', 'Tôi từng đi Bắc Kinh, cũng từng đi Thượng Hải.'],
          ['以后|我|想|当|老师|。', 'Sau này tôi muốn làm giáo viên.'],
        ],
        grammarQ: [
          { prompt: 'Nói sau này tôi muốn làm giáo viên.', source: '以后 / 想 / 当 / 老师', pattern: '以后 + S + 想 + 当 + N', answers: ['以后我想当老师。', '以后我想当老师'] },
          { prompt: 'Nói tiếng Hán của tôi ngày càng tốt.', source: '我的汉语 / 越来越 / 好', pattern: 'S + 越来越 + Adj + 了', answers: ['我的汉语越来越好了。', '我的汉语越来越好了'] },
        ],
        tip: ['Tự tin khi giới thiệu', 'Khi tự giới thiệu, nói chậm, chia theo thứ tự: tên – quá khứ – hiện tại – tương lai. Đây là cấu trúc dễ dùng và dễ ghi điểm.'],
      },
    ],
  },
];
