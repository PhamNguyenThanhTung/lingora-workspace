import type { UnitSpec } from '../types.ts';

/**
 * Japanese N4 — extension units (7–9): polite keigo, probability and decisions, purpose and change.
 * Same conventions as ja-n4.ts: readings are "かな (romaji)"; examples and dialogue lines carry no romaji.
 */
export const JA_N4_EXTRA2_UNITS: UnitSpec[] = [
  {
    level: 'N4',
    names: { vi: 'Kính ngữ và dịch vụ', en: 'Keigo and Service' },
    lessons: [
      {
        title: { vi: 'Kính ngữ: nâng người nghe lên (尊敬語)', en: 'Respectful Language (sonkeigo)' },
        intro: 'Bạn nói chuyện với giáo viên, khách hàng hoặc sếp và muốn tỏ lòng tôn kính. Bài này dạy các động từ kính ngữ thường gặp và mẫu お〜になります.',
        vocab: [
          ['いらっしゃいます', 'いらっしゃいます (irasshaimasu)', 'verb', 'ở, đi, đến (kính ngữ)', '先生は教室にいらっしゃいます。', 'Thầy đang ở trong lớp.'],
          ['おっしゃいます', 'おっしゃいます (osshaimasu)', 'verb', 'nói (kính ngữ)', '社長がおっしゃいました。', 'Giám đốc đã nói.'],
          ['召し上がります', 'めしあがります (meshiagarimasu)', 'verb', 'ăn, uống (kính ngữ)', 'どうぞ召し上がってください。', 'Xin mời ăn.'],
          ['ご覧になります', 'ごらんになります (goran ni narimasu)', 'verb', 'xem (kính ngữ)', 'こちらをご覧になってください。', 'Xin hãy xem cái này.'],
          ['なさいます', 'なさいます (nasaimasu)', 'verb', 'làm (kính ngữ)', '週末は何をなさいますか。', 'Cuối tuần ngài làm gì ạ?'],
          ['お客様', 'おきゃくさま (okyakusama)', 'noun', 'quý khách', 'お客様がいらっしゃいました。', 'Quý khách đã đến.'],
          ['お帰りになります', 'おかえりになります (okaeri ni narimasu)', 'verb', 'về (kính ngữ)', '社長はもうお帰りになりました。', 'Giám đốc đã về rồi.'],
          ['お読みになります', 'およみになります (oyomi ni narimasu)', 'verb', 'đọc (kính ngữ)', '先生はこの本をお読みになりました。', 'Thầy đã đọc cuốn sách này.'],
          ['お忙しい', 'おいそがしい (oisogashii)', 'i-adjective', 'bận (kính ngữ)', 'お忙しいところ、すみません。', 'Xin lỗi vì làm phiền lúc ngài bận.'],
          ['ご存じ', 'ごぞんじ (gozonji)', 'na-adjective', 'biết (kính ngữ)', 'この方をご存じですか。', 'Ngài có biết vị này không?'],
        ],
        grammar: {
          title: 'Kính ngữ: お〜になります và động từ đặc biệt',
          explain: 'Kính ngữ nâng hành động của người trên (thầy, khách, sếp). Mẫu chung: お + V-ます stem + になります (お読みになります, お帰りになります). Động từ đặc biệt: いる/行く/来る→いらっしゃいます, 言う→おっしゃいます, 食べる/飲む→召し上がります, 見る→ご覧になります, する→なさいます. Không dùng kính ngữ cho hành động của chính mình (dùng 謙譲語 ở bài sau).',
          examples: [
            ['社長はもうお帰りになりました。', 'Giám đốc đã về rồi.'],
            ['どうぞ召し上がってください。', 'Xin mời ăn.'],
            ['先生は何とおっしゃいましたか。', 'Thầy đã nói gì ạ?'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、田中部長はいらっしゃいますか。', 'Xin lỗi, trưởng phòng Tanaka có ở đây không ạ?'],
            ['受付', '申し訳ありません。部長はもうお帰りになりました。', 'Rất tiếc. Trưởng phòng đã về rồi ạ.'],
            ['リン', 'そうですか。部長は何時にお帰りになりましたか。', 'Vậy à. Trưởng phòng về lúc mấy giờ ạ?'],
            ['受付', '五時ごろでございます。', 'Khoảng năm giờ ạ.'],
          ],
        },
        reorder: [
          ['社長|は|もう|お帰りになりました|。', 'Giám đốc đã về rồi.'],
          ['どうぞ|召し上がって|ください|。', 'Xin mời ăn.'],
        ],
        grammarQ: [
          { prompt: 'Nói giám đốc đã về rồi bằng kính ngữ.', source: '社長 / 帰ります', pattern: 'お + V-stem + になります', answers: ['社長はもうお帰りになりました。', '社長はもうお帰りになりました'] },
          { prompt: 'Mời ăn bằng kính ngữ (召し上がる).', source: '召し上がる', pattern: 'どうぞ + 召し上がってください', answers: ['どうぞ召し上がってください。', 'どうぞ召し上がってください'] },
        ],
        tip: ['Khi nào dùng kính ngữ', 'Dùng khi nói về hành động của người trên: giáo viên, khách hàng, sếp. Nó không làm cho bạn cao hơn mà chỉ nâng người đối diện lên.'],
      },
      {
        title: { vi: 'Kính ngữ: hạ mình (謙譲語)', en: 'Humble Language (kenjōgo)' },
        intro: 'Khi nói về hành động của mình đối với khách hoặc sếp, bạn hạ mình xuống. Bài này dạy 参ります, いたします, 申します và mẫu お〜します.',
        vocab: [
          ['参ります', 'まいります (mairimasu)', 'verb', 'đi, đến (khiêm nhường)', '明日、お伺いします。', 'Ngày mai tôi sẽ đến thăm.'],
          ['申します', 'もうします (mōshimasu)', 'verb', 'nói, tên là (khiêm nhường)', '田中と申します。', 'Tôi tên là Tanaka.'],
          ['いたします', 'いたします (itashimasu)', 'verb', 'làm (khiêm nhường)', '私がご案内いたします。', 'Tôi xin hướng dẫn.'],
          ['いただきます', 'いただきます (itadakimasu)', 'verb', 'ăn, nhận (khiêm nhường)', 'お茶をいただきます。', 'Tôi xin nhận trà.'],
          ['拝見します', 'はいけんします (haiken shimasu)', 'verb', 'xem (khiêm nhường)', '資料を拝見します。', 'Tôi xin xem tài liệu.'],
          ['資料', 'しりょう (shiryō)', 'noun', 'tài liệu', '資料をお送りします。', 'Tôi xin gửi tài liệu.'],
          ['お待ちします', 'おまちします (omachi shimasu)', 'verb', 'đợi (khiêm nhường)', 'ロビーでお待ちします。', 'Tôi xin đợi ở sảnh.'],
          ['お届けします', 'おとどけします (otodoke shimasu)', 'verb', 'giao đến (khiêm nhường)', '明日お届けします。', 'Ngày mai tôi xin giao đến.'],
          ['ご連絡します', 'ごれんらくします (gorenraku shimasu)', 'verb', 'liên lạc (khiêm nhường)', '後ほどご連絡します。', 'Lát nữa tôi sẽ liên lạc.'],
          ['後ほど', 'のちほど (nochihodo)', 'adverb', 'lát nữa, sau', '後ほど電話いたします。', 'Lát nữa tôi sẽ gọi điện.'],
        ],
        grammar: {
          title: 'Khiêm nhường: お〜します / ご〜します / いたします',
          explain: 'Khiêm nhường (謙譲語) hạ hành động của mình để tôn người nghe: お + V-stem + します (お待ちします, お届けします), ご + danh từ Hán + します (ご連絡します, ご案内します). Động từ đặc biệt: 行く/来る→参ります, 言う→申します, する→いたします, 食べる/もらう→いただきます, 見る→拝見します. Giới thiệu tên: 〜と申します.',
          examples: [
            ['田中と申します。どうぞよろしくお願いします。', 'Tôi tên là Tanaka. Rất mong được giúp đỡ.'],
            ['後ほどご連絡します。', 'Lát nữa tôi sẽ liên lạc.'],
            ['明日、資料をお届けします。', 'Ngày mai tôi xin giao tài liệu đến.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'はじめまして、リンと申します。', 'Rất hân hạnh, tôi tên là Linh.'],
            ['お客様', 'はじめまして。今日はよろしくお願いします。', 'Rất hân hạnh. Hôm nay mong được giúp đỡ.'],
            ['リン', 'こちらこそ。資料をお送りしましたが、ご覧になりましたか。', 'Tôi mới là người mong được giúp. Tôi đã gửi tài liệu, ngài đã xem chưa ạ?'],
            ['お客様', 'はい、拝見しました。', 'Vâng, tôi đã xem rồi.'],
          ],
        },
        reorder: [
          ['後ほど|ご連絡します|。', 'Lát nữa tôi sẽ liên lạc.'],
          ['明日|、|資料|を|お届けします|。', 'Ngày mai tôi xin giao tài liệu đến.'],
        ],
        grammarQ: [
          { prompt: 'Tự giới thiệu: “Tôi tên là Tanaka” bằng khiêm nhường.', source: '田中 / 申します', pattern: 'N と申します', answers: ['田中と申します。', '田中と申します'] },
          { prompt: 'Nói “Lát nữa tôi sẽ liên lạc”.', source: '後ほど / ご連絡', pattern: 'ご + N + します', answers: ['後ほどご連絡します。', '後ほどご連絡します'] },
        ],
        tip: ['Đừng nhầm hướng', 'Hãy nhớ: 尊敬語 dành cho người khác, 謙譲語 dành cho mình. Nếu dùng sai hướng, bạn sẽ vô tình tôn mình lên.'],
      },
      {
        title: { vi: 'Tiếp khách ở khách sạn và nhà hàng', en: 'Hotel and Restaurant Service' },
        intro: 'Bạn làm việc ở khách sạn hoặc là khách trọ và cần nói chuyện trang trọng. Bài này đưa những câu tiếp khách chuẩn dùng kính ngữ.',
        vocab: [
          ['ご予約', 'ごよやく (goyoyaku)', 'noun', 'sự đặt chỗ (kính ngữ)', 'ご予約はございますか。', 'Quý khách đã đặt chỗ chưa ạ?'],
          ['チェックイン', 'ちぇっくいん (chekkuin)', 'noun', 'nhận phòng', 'チェックインは三時からです。', 'Nhận phòng từ ba giờ.'],
          ['チェックアウト', 'ちぇっくあうと (chekkuauto)', 'noun', 'trả phòng', 'チェックアウトは十時です。', 'Trả phòng lúc mười giờ.'],
          ['鍵', 'かぎ (kagi)', 'noun', 'chìa khóa', 'こちらが部屋の鍵です。', 'Đây là chìa khóa phòng.'],
          ['部屋', 'へや (heya)', 'noun', 'căn phòng', '部屋は五階でございます。', 'Phòng ở tầng năm ạ.'],
          ['お名前', 'おなまえ (onamae)', 'noun', 'tên (kính ngữ)', 'お名前をお願いします。', 'Xin cho biết tên quý khách.'],
          ['少々', 'しょうしょう (shōshō)', 'adverb', 'một chút (trang trọng)', '少々お待ちください。', 'Xin quý khách đợi một chút.'],
          ['申し訳ありません', 'もうしわけありません (mōshiwake arimasen)', 'phrase', 'thành thật xin lỗi', '大変申し訳ありません。', 'Thành thật xin lỗi.'],
          ['でございます', 'でございます (de gozaimasu)', 'phrase', 'là (rất lịch sự)', '朝食は七時からでございます。', 'Bữa sáng bắt đầu từ bảy giờ ạ.'],
          ['朝食', 'ちょうしょく (chōshoku)', 'noun', 'bữa sáng (trang trọng)', '朝食は二階でございます。', 'Bữa sáng ở tầng hai ạ.'],
        ],
        grammar: {
          title: 'Mẫu tiếp khách: 〜でございます / 少々お待ちください / 〜はいかがですか',
          explain: 'Trong dịch vụ, です → でございます (rất trang trọng), あります → ございます. Yêu cầu khách đợi: 少々お待ちください. Hỏi ý khách lịch sự: ～はいかがですか (quý khách thấy … thế nào ạ). Lời xin lỗi: 申し訳ありません. Xác nhận đặt chỗ: ご予約はございますか.',
          examples: [
            ['朝食は七時からでございます。', 'Bữa sáng bắt đầu từ bảy giờ ạ.'],
            ['少々お待ちください。', 'Xin quý khách đợi một chút.'],
            ['ご予約はございますか。', 'Quý khách đã đặt chỗ chưa ạ?'],
          ],
        },
        dialogue: {
          lines: [
            ['フロント', 'いらっしゃいませ。ご予約はございますか。', 'Kính chào quý khách. Quý khách đã đặt chỗ chưa ạ?'],
            ['リン', 'はい、リンと申します。', 'Vâng, tôi tên là Linh.'],
            ['フロント', '少々お待ちください。リン様、お部屋は五階でございます。', 'Xin quý khách đợi một chút. Quý khách Linh, phòng của quý khách ở tầng năm ạ.'],
            ['フロント', '朝食は七時からでございます。', 'Bữa sáng bắt đầu từ bảy giờ ạ.'],
          ],
        },
        reorder: [
          ['朝食|は|七時|から|でございます|。', 'Bữa sáng bắt đầu từ bảy giờ ạ.'],
          ['少々|お待ち|ください|。', 'Xin quý khách đợi một chút.'],
        ],
        grammarQ: [
          { prompt: 'Nói với khách: bữa sáng từ bảy giờ (trang trọng).', source: '朝食 / 七時', pattern: 'N は〜からでございます', answers: ['朝食は七時からでございます。', '朝食は七時からでございます'] },
          { prompt: 'Hỏi khách đã đặt chỗ chưa.', source: '予約 / ございます', pattern: 'ご予約はございますか', answers: ['ご予約はございますか。', 'ご予約はございますか'] },
        ],
        tip: ['Giọng dịch vụ', 'Nhân viên dịch vụ nói chậm, rõ, hơi cúi đầu. Ngay cả khi chưa tự tin, chỉ cần dùng đúng 少々お待ちください và 申し訳ありません là đã lịch sự.'],
      },
    ],
  },
  {
    level: 'N4',
    names: { vi: 'Khả năng xảy ra và quyết định', en: 'Probability and Decisions' },
    lessons: [
      {
        title: { vi: 'Chắc là… / Có thể là… (〜でしょう・〜かもしれません)', en: 'Probability (~deshō, ~kamoshiremasen)' },
        intro: 'Bạn dự đoán thời tiết hay khả năng ai đó đến. Bài này dạy 〜でしょう (chắc là) và 〜かもしれません (có thể) để diễn đạt mức độ chắc chắn.',
        vocab: [
          ['多分', 'たぶん (tabun)', 'adverb', 'có lẽ', '多分、明日は晴れるでしょう。', 'Có lẽ ngày mai trời sẽ nắng.'],
          ['きっと', 'きっと (kitto)', 'adverb', 'chắc chắn là', 'きっと彼は来るでしょう。', 'Chắc chắn anh ấy sẽ đến.'],
          ['もしかしたら', 'もしかしたら (moshikashitara)', 'adverb', 'biết đâu, có lẽ', 'もしかしたら雪が降るかもしれません。', 'Biết đâu tuyết sẽ rơi.'],
          ['晴れます', 'はれます (haremasu)', 'verb', 'trời nắng, quang', '明日は晴れるでしょう。', 'Ngày mai chắc trời nắng.'],
          ['曇り', 'くもり (kumori)', 'noun', 'trời nhiều mây', '午後は曇りでしょう。', 'Buổi chiều chắc trời nhiều mây.'],
          ['午後', 'ごご (gogo)', 'noun', 'buổi chiều', '午後は雨になるかもしれません。', 'Buổi chiều có thể mưa.'],
          ['間違います', 'まちがいます (machigaimasu)', 'verb', 'nhầm, sai', '住所を間違えるかもしれません。', 'Có thể tôi nhầm địa chỉ.'],
          ['住所', 'じゅうしょ (jūsho)', 'noun', 'địa chỉ', '住所を教えてください。', 'Xin cho biết địa chỉ.'],
          ['無理', 'むり (muri)', 'na-adjective', 'quá sức, không thể', '今日は無理かもしれません。', 'Hôm nay có thể không được.'],
          ['可能性', 'かのうせい (kanōsei)', 'noun', 'khả năng', '合格する可能性があります。', 'Có khả năng đỗ.'],
        ],
        grammar: {
          title: '〜でしょう (chắc là) và 〜かもしれません (có thể là)',
          explain: '〜でしょう dùng sau thể thường để nói điều bạn tin khá chắc: 明日は晴れるでしょう (chắc ngày mai trời nắng). Với danh từ/tính từ な: 〜でしょう (bỏ だ). 〜かもしれません diễn tả khả năng yếu hơn, khoảng 30–50%: 雪が降るかもしれません. Thường đi với 多分, きっと, もしかしたら để điều chỉnh mức độ chắc chắn.',
          examples: [
            ['多分、明日は晴れるでしょう。', 'Có lẽ ngày mai trời nắng.'],
            ['もしかしたら雪が降るかもしれません。', 'Biết đâu tuyết sẽ rơi.'],
            ['今日は無理かもしれません。', 'Hôm nay có thể không được.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '明日の天気はどうでしょうか。', 'Thời tiết ngày mai sẽ thế nào nhỉ?'],
            ['田中', '多分、晴れるでしょう。でも、午後は雨になるかもしれません。', 'Có lẽ trời nắng. Nhưng buổi chiều có thể mưa.'],
            ['リン', 'じゃあ、傘を持っていったほうがいいですね。', 'Vậy nên mang ô theo nhỉ.'],
            ['田中', 'そうですね。', 'Đúng vậy.'],
          ],
        },
        reorder: [
          ['多分|、|明日|は|晴れるでしょう|。', 'Có lẽ ngày mai trời nắng.'],
          ['今日|は|無理かもしれません|。', 'Hôm nay có thể không được.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Có lẽ ngày mai trời nắng” bằng 〜でしょう.', source: '多分 / 明日 / 晴れる', pattern: '多分〜でしょう', answers: ['多分、明日は晴れるでしょう。', '多分、明日は晴れるでしょう', '多分明日は晴れるでしょう。'] },
          { prompt: 'Nói “Hôm nay có thể không được”.', source: '今日 / 無理', pattern: '〜かもしれません', answers: ['今日は無理かもしれません。', '今日は無理かもしれません'] },
        ],
        tip: ['Thang chắc chắn', 'きっと > 多分 > もしかしたら. Chọn từ phù hợp rồi gắn kèm でしょう (khá chắc) hay かもしれません (chưa chắc).'],
      },
      {
        title: { vi: 'Quyết định và quy định (〜ことにする・〜ことになる)', en: 'Decisions and Rules (~koto ni suru, ~koto ni naru)' },
        intro: 'Bạn nói “tôi quyết định bỏ thuốc” hay “công ty quy định phải mặc đồng phục”. Bài này dạy hai mẫu phân biệt mình tự quyết và hoàn cảnh quyết định.',
        vocab: [
          ['決めます', 'きめます (kimemasu)', 'verb', 'quyết định', '日本へ行くことに決めました。', 'Tôi đã quyết định đi Nhật.'],
          ['やめます', 'やめます (yamemasu)', 'verb', 'bỏ, thôi', 'たばこをやめます。', 'Tôi bỏ thuốc lá.'],
          ['転勤します', 'てんきんします (tenkin shimasu)', 'verb', 'chuyển công tác', '来月、大阪へ転勤します。', 'Tháng sau tôi chuyển công tác đến Osaka.'],
          ['規則', 'きそく (kisoku)', 'noun', 'quy tắc', '会社の規則があります。', 'Công ty có quy tắc.'],
          ['守ります', 'まもります (mamorimasu)', 'verb', 'tuân thủ', '規則を守ります。', 'Tôi tuân thủ quy tắc.'],
          ['禁止', 'きんし (kinshi)', 'noun', 'sự cấm', 'ここは写真禁止です。', 'Ở đây cấm chụp ảnh.'],
          ['制服', 'せいふく (seifuku)', 'noun', 'đồng phục', '会社では制服を着ることになっています。', 'Ở công ty quy định mặc đồng phục.'],
          ['毎日', 'まいにち (mainichi)', 'adverb', 'mỗi ngày', '毎日歩くことにしました。', 'Tôi đã quyết định đi bộ mỗi ngày.'],
          ['歩きます', 'あるきます (arukimasu)', 'verb', 'đi bộ', '駅まで歩きます。', 'Tôi đi bộ đến ga.'],
          ['結婚', 'けっこん (kekkon)', 'noun', 'kết hôn', '来年、結婚することになりました。', 'Năm sau tôi sẽ kết hôn (đã được định).'],
        ],
        grammar: {
          title: '〜ことにする (tự quyết định) / 〜ことになる (được định, quy định)',
          explain: 'V辞書形/ない形 + ことにします: mình chủ động quyết định (毎日歩くことにしました — tôi quyết định đi bộ mỗi ngày). V + ことになりました: kết quả do hoàn cảnh hay người khác quyết định (来月、大阪へ転勤することになりました — tôi được điều đến Osaka). 〜ことになっています: quy tắc, thói quen chung (制服を着ることになっています).',
          examples: [
            ['毎日歩くことにしました。', 'Tôi đã quyết định đi bộ mỗi ngày.'],
            ['来月、大阪へ転勤することになりました。', 'Tháng sau tôi được điều chuyển đến Osaka.'],
            ['会社では制服を着ることになっています。', 'Ở công ty quy định mặc đồng phục.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'リンさん、来月から大阪へ転勤することになりました。', 'Linh, từ tháng sau tôi được điều chuyển đến Osaka.'],
            ['リン', 'えっ、本当ですか。寂しくなりますね。', 'Ơ, thật hả? Sẽ buồn đây.'],
            ['田中', 'ありがとう。向こうでは毎日歩くことにします。', 'Cảm ơn. Ở bên đó tôi sẽ quyết định đi bộ mỗi ngày.'],
            ['リン', 'いいですね。お元気で。', 'Hay đấy. Chúc anh mạnh khỏe.'],
          ],
        },
        reorder: [
          ['毎日|歩く|こと|に|しました|。', 'Tôi đã quyết định đi bộ mỗi ngày.'],
          ['会社|で|は|制服|を|着る|こと|に|なっています|。', 'Ở công ty quy định mặc đồng phục.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi đã quyết định đi bộ mỗi ngày”.', source: '毎日 / 歩く', pattern: 'V辞書形 + ことにしました', answers: ['毎日歩くことにしました。', '毎日歩くことにしました'] },
          { prompt: 'Nói “Tháng sau tôi được điều chuyển đến Osaka” (do công ty quyết).', source: '来月 / 大阪 / 転勤', pattern: 'V辞書形 + ことになりました', answers: ['来月、大阪へ転勤することになりました。', '来月、大阪へ転勤することになりました', '来月大阪へ転勤することになりました。'] },
        ],
        tip: ['Ai là người quyết?', 'する = bạn tự quyết, なる = điều đó được quyết bởi hoàn cảnh hoặc người khác. Dùng なる khi nói về điều động, quy định hay quyết định chung.'],
      },
      {
        title: { vi: 'Mất đồ và báo cảnh sát', en: 'Lost Items and the Police Box' },
        intro: 'Bạn bỏ quên ô trên tàu hoặc đánh rơi điện thoại. Bài này dạy cách trình báo ở trạm cảnh sát (交番) hay quầy đồ thất lạc bằng tiếng Nhật.',
        vocab: [
          ['交番', 'こうばん (kōban)', 'noun', 'đồn cảnh sát nhỏ', '交番に行きます。', 'Tôi đến đồn cảnh sát.'],
          ['落とし物', 'おとしもの (otoshimono)', 'noun', 'đồ đánh rơi', '落とし物を探しています。', 'Tôi đang tìm đồ đánh rơi.'],
          ['落とします', 'おとします (otoshimasu)', 'verb', 'đánh rơi', '駅で携帯を落としました。', 'Tôi đã đánh rơi điện thoại ở ga.'],
          ['携帯', 'けいたい (keitai)', 'noun', 'điện thoại di động', '携帯が見つかりました。', 'Đã tìm thấy điện thoại.'],
          ['見つかります', 'みつかります (mitsukarimasu)', 'verb', 'được tìm thấy', '財布が見つかりました。', 'Đã tìm thấy ví.'],
          ['探します', 'さがします (sagashimasu)', 'verb', 'tìm kiếm', '鍵を探します。', 'Tôi tìm chìa khóa.'],
          ['特徴', 'とくちょう (tokuchō)', 'noun', 'đặc điểm', '特徴を教えてください。', 'Xin cho biết đặc điểm.'],
          ['色', 'いろ (iro)', 'noun', 'màu sắc', '色は黒です。', 'Màu đen.'],
          ['届けます', 'とどけます (todokemasu)', 'verb', 'nộp, giao đến', '警察に届けます。', 'Tôi nộp cho cảnh sát.'],
          ['お願いします', 'おねがいします (onegaishimasu)', 'phrase', 'xin nhờ', '調べてお願いします。', 'Xin nhờ anh kiểm tra giúp.'],
        ],
        grammar: {
          title: 'Trình báo mất đồ: 〜を落としました / 〜が見つかりました',
          explain: 'Trình báo bằng quá khứ lịch sự: 駅で携帯を落としました. Mô tả đồ: 色は黒です, 大きさは〜です. Người tìm: 見つかりましたか / 見つかりました. Hỏi nơi: どこで落としましたか. Cầu nhờ: 調べてください / 探してください. Tự động từ + が (見つかる), tha động từ + を (探す).',
          examples: [
            ['駅で携帯を落としました。', 'Tôi đã đánh rơi điện thoại ở ga.'],
            ['色は黒で、ケースは青いです。', 'Màu đen, ốp lưng màu xanh.'],
            ['財布が見つかりました。', 'Đã tìm thấy ví.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、駅で携帯を落としました。', 'Xin lỗi, tôi đã đánh rơi điện thoại ở ga.'],
            ['警察官', 'どんな携帯ですか。', 'Điện thoại thế nào ạ?'],
            ['リン', '色は黒で、ケースは青いです。', 'Màu đen, ốp lưng màu xanh.'],
            ['警察官', '調べておきますので、ここに連絡先を書いてください。', 'Chúng tôi sẽ kiểm tra, xin hãy viết thông tin liên lạc vào đây.'],
          ],
        },
        reorder: [
          ['駅|で|携帯|を|落としました|。', 'Tôi đã đánh rơi điện thoại ở ga.'],
          ['財布|が|見つかりました|。', 'Đã tìm thấy ví.'],
        ],
        grammarQ: [
          { prompt: 'Báo mất: đánh rơi điện thoại ở ga.', source: '駅 / 携帯 / 落とします', pattern: '場所で + N を + 落としました', answers: ['駅で携帯を落としました。', '駅で携帯を落としました'] },
          { prompt: 'Nói đã tìm thấy ví.', source: '財布 / 見つかります', pattern: 'N が見つかりました', answers: ['財布が見つかりました。', '財布が見つかりました'] },
        ],
        tip: ['Nhật Bản rất an toàn', 'Ở Nhật đồ đánh rơi thường được trả lại. Hãy đến 交番 hoặc quầy đồ thất lạc ở ga trong vòng vài ngày.'],
      },
    ],
  },
  {
    level: 'N4',
    names: { vi: 'Mục đích, thay đổi và tổng ôn', en: 'Purpose, Change and Review' },
    lessons: [
      {
        title: { vi: 'Mục đích (〜ために・〜ように)', en: 'Purpose (~tame ni, ~yō ni)' },
        intro: 'Bạn giải thích vì sao học tiếng Nhật hay tiết kiệm tiền. Bài này dạy 〜ために (vì mục đích) và 〜ように (để có thể).',
        vocab: [
          ['貯金します', 'ちょきんします (chokin shimasu)', 'verb', 'tiết kiệm tiền', '旅行のために貯金します。', 'Tôi tiết kiệm tiền để đi du lịch.'],
          ['留学します', 'りゅうがくします (ryūgaku shimasu)', 'verb', 'du học', '日本へ留学します。', 'Tôi đi du học Nhật.'],
          ['就職します', 'しゅうしょくします (shūshoku shimasu)', 'verb', 'xin việc, đi làm', '日本の会社に就職します。', 'Tôi vào làm ở công ty Nhật.'],
          ['健康', 'けんこう (kenkō)', 'na-adjective', 'khỏe mạnh, sức khỏe', '健康のために運動します。', 'Tôi tập thể dục vì sức khỏe.'],
          ['目標', 'もくひょう (mokuhyō)', 'noun', 'mục tiêu', '目標は日本で働くことです。', 'Mục tiêu của tôi là làm việc ở Nhật.'],
          ['合格します', 'ごうかくします (gōkaku shimasu)', 'verb', 'đỗ, thi đậu', '試験に合格するために勉強します。', 'Tôi học để đỗ kỳ thi.'],
          ['忘れないように', 'わすれないように (wasurenai yō ni)', 'phrase', 'để khỏi quên', '忘れないようにメモします。', 'Tôi ghi chú để khỏi quên.'],
          ['メモします', 'めもします (memo shimasu)', 'verb', 'ghi chú', '大事なことをメモします。', 'Tôi ghi chú những điều quan trọng.'],
          ['聞こえます', 'きこえます (kikoemasu)', 'verb', 'nghe thấy được', 'よく聞こえるように大きな声で話します。', 'Tôi nói to để nghe được rõ.'],
          ['大きな声', 'おおきなこえ (ōkina koe)', 'noun', 'giọng to', '大きな声で話してください。', 'Xin hãy nói to.'],
        ],
        grammar: {
          title: '〜ために (mục đích) và 〜ように (để có thể)',
          explain: 'V辞書形 + ために / N の + ために dùng khi mục đích do ý chí của chủ ngữ: 日本で働くために勉強します. 〜ように dùng với động từ không ý chí hoặc dạng khả năng/phủ định để diễn tả kết quả mong muốn: よく聞こえるように大きな声で話します, 忘れないようにメモします. Hai vế của 〜ために cùng chủ ngữ.',
          examples: [
            ['日本で働くために、日本語を勉強します。', 'Tôi học tiếng Nhật để làm việc ở Nhật.'],
            ['忘れないようにメモします。', 'Tôi ghi chú để khỏi quên.'],
            ['健康のために毎日歩きます。', 'Tôi đi bộ mỗi ngày vì sức khỏe.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'どうして日本語を勉強していますか。', 'Sao bạn học tiếng Nhật vậy?'],
            ['リン', '日本の会社に就職するために勉強しています。', 'Tôi học để vào làm ở công ty Nhật.'],
            ['田中', '毎日勉強していますか。', 'Bạn có học mỗi ngày không?'],
            ['リン', 'はい。忘れないようにメモもしています。', 'Vâng. Tôi cũng ghi chú để khỏi quên.'],
          ],
        },
        reorder: [
          ['日本|で|働く|ために|、|日本語|を|勉強します|。', 'Tôi học tiếng Nhật để làm việc ở Nhật.'],
          ['忘れない|ように|メモします|。', 'Tôi ghi chú để khỏi quên.'],
        ],
        grammarQ: [
          { prompt: 'Nói học tiếng Nhật để làm việc ở Nhật bằng 〜ために.', source: '日本 / 働く / 日本語', pattern: 'V辞書形 + ために、〜', answers: ['日本で働くために、日本語を勉強します。', '日本で働くために日本語を勉強します。', '日本で働くために、日本語を勉強します'] },
          { prompt: 'Nói ghi chú để khỏi quên bằng 〜ように.', source: '忘れない / メモします', pattern: 'V-ない + ように、〜', answers: ['忘れないようにメモします。', '忘れないようにメモします'] },
        ],
        tip: ['ために hay ように?', 'Hỏi: động từ vế trước có phải do bạn chủ động không? Có thì ために, không thì ように (nhất là động từ khả năng hoặc thể phủ định).'],
      },
      {
        title: { vi: 'Thói quen và sự thay đổi (〜ようにしている・〜ようになる)', en: 'Habits and Change (~yō ni shite iru, ~yō ni naru)' },
        intro: 'Bạn kể mình cố gắng ăn uống lành mạnh, hay giờ đã có thể làm được việc từng không làm được. Bài này dạy 〜ようにしている và 〜ようになる.',
        vocab: [
          ['習慣', 'しゅうかん (shūkan)', 'noun', 'thói quen', '毎朝走る習慣があります。', 'Tôi có thói quen chạy mỗi sáng.'],
          ['走ります', 'はしります (hashirimasu)', 'verb', 'chạy', '公園を走ります。', 'Tôi chạy trong công viên.'],
          ['気をつけます', 'きをつけます (ki o tsukemasu)', 'verb', 'chú ý, cẩn thận', '体に気をつけます。', 'Tôi chú ý giữ gìn sức khỏe.'],
          ['体', 'からだ (karada)', 'noun', 'cơ thể', '体のために野菜を食べます。', 'Tôi ăn rau vì sức khỏe.'],
          ['甘い', 'あまい (amai)', 'i-adjective', 'ngọt', '甘い物を食べないようにしています。', 'Tôi cố gắng không ăn đồ ngọt.'],
          ['以前', 'いぜん (izen)', 'adverb', 'trước đây', '以前は泳げませんでした。', 'Trước đây tôi không biết bơi.'],
          ['最近', 'さいきん (saikin)', 'adverb', 'gần đây', '最近、日本語が話せるようになりました。', 'Gần đây tôi đã nói được tiếng Nhật.'],
          ['増えます', 'ふえます (fuemasu)', 'verb', 'tăng lên', '外国人が増えています。', 'Người nước ngoài đang tăng lên.'],
          ['慣れます', 'なれます (naremasu)', 'verb', 'quen', '日本の生活に慣れました。', 'Tôi đã quen với cuộc sống ở Nhật.'],
          ['生活', 'せいかつ (seikatsu)', 'noun', 'cuộc sống', '日本の生活は楽しいです。', 'Cuộc sống ở Nhật rất vui.'],
        ],
        grammar: {
          title: '〜ようにしています (cố gắng) / 〜ようになりました (đã trở nên)',
          explain: 'V辞書形/ない形 + ようにしています nghĩa là cố gắng làm đều đặn hoặc cố tránh: 毎日野菜を食べるようにしています (tôi cố gắng ăn rau mỗi ngày). V可能形 + ようになりました nghĩa là đã trở nên có thể: 最近、日本語が話せるようになりました (gần đây tôi đã nói được tiếng Nhật). Thể phủ định: 〜なくなりました (không còn nữa).',
          examples: [
            ['毎日野菜を食べるようにしています。', 'Tôi cố gắng ăn rau mỗi ngày.'],
            ['最近、日本語が話せるようになりました。', 'Gần đây tôi đã nói được tiếng Nhật.'],
            ['甘い物を食べないようにしています。', 'Tôi cố gắng không ăn đồ ngọt.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', '最近、元気そうですね。何かしていますか。', 'Gần đây trông bạn khỏe nhỉ. Bạn có làm gì không?'],
            ['リン', '毎朝走るようにしています。', 'Tôi cố gắng chạy mỗi sáng.'],
            ['田中', 'すごいですね。食べ物も気をつけていますか。', 'Giỏi quá. Bạn có để ý ăn uống không?'],
            ['リン', 'はい、甘い物を食べないようにしています。', 'Vâng, tôi cố gắng không ăn đồ ngọt.'],
          ],
        },
        reorder: [
          ['毎日|野菜|を|食べる|ように|しています|。', 'Tôi cố gắng ăn rau mỗi ngày.'],
          ['最近|、|日本語|が|話せる|ように|なりました|。', 'Gần đây tôi đã nói được tiếng Nhật.'],
        ],
        grammarQ: [
          { prompt: 'Nói cố gắng ăn rau mỗi ngày.', source: '毎日 / 野菜 / 食べる', pattern: 'V辞書形 + ようにしています', answers: ['毎日野菜を食べるようにしています。', '毎日野菜を食べるようにしています'] },
          { prompt: 'Nói gần đây đã nói được tiếng Nhật.', source: '最近 / 日本語 / 話せる', pattern: 'V可能形 + ようになりました', answers: ['最近、日本語が話せるようになりました。', '最近日本語が話せるようになりました。', '最近、日本語が話せるようになりました'] },
        ],
        tip: ['Cải thiện từng bước', 'Dùng ようになりました khi kể về tiến bộ. Ví dụ: 漢字が読めるようになりました (tôi đã đọc được chữ Hán).'],
      },
      {
        title: { vi: 'Tổng ôn N4: kể về bản thân và kế hoạch', en: 'N4 Review: Talking About Yourself and Your Plans' },
        intro: 'Bài cuối ôn lại toàn bộ N4: bạn kể về quá khứ, hiện tại và dự định, giải thích lý do và đưa ra suy đoán trong một cuộc trò chuyện tự nhiên.',
        vocab: [
          ['経験', 'けいけん (keiken)', 'noun', 'kinh nghiệm', '日本で働いた経験があります。', 'Tôi có kinh nghiệm làm việc ở Nhật.'],
          ['将来', 'しょうらい (shōrai)', 'noun', 'tương lai', '将来は先生になりたいです。', 'Trong tương lai tôi muốn làm giáo viên.'],
          ['夢', 'ゆめ (yume)', 'noun', 'ước mơ', '夢を持っています。', 'Tôi có một ước mơ.'],
          ['成功します', 'せいこうします (seikō shimasu)', 'verb', 'thành công', '頑張れば、成功します。', 'Nếu cố gắng thì sẽ thành công.'],
          ['挑戦します', 'ちょうせんします (chōsen shimasu)', 'verb', 'thử thách, thử sức', '新しい仕事に挑戦します。', 'Tôi thử sức với công việc mới.'],
          ['自信', 'じしん (jishin)', 'noun', 'sự tự tin', '日本語に自信があります。', 'Tôi tự tin về tiếng Nhật.'],
          ['不安', 'ふあん (fuan)', 'na-adjective', 'lo lắng', '少し不安です。', 'Tôi hơi lo lắng.'],
          ['成長します', 'せいちょうします (seichō shimasu)', 'verb', 'trưởng thành, phát triển', '日本で成長したいです。', 'Tôi muốn trưởng thành ở Nhật.'],
          ['感謝します', 'かんしゃします (kansha shimasu)', 'verb', 'biết ơn', '皆さんに感謝しています。', 'Tôi biết ơn mọi người.'],
          ['皆さん', 'みなさん (minasan)', 'noun', 'mọi người', '皆さんのおかげです。', 'Nhờ mọi người cả.'],
        ],
        grammar: {
          title: 'Ôn tập: ことがある / たら / ために / ようになる',
          explain: 'Khi kể về bản thân, kết hợp nhiều mẫu N4: kinh nghiệm 〜たことがあります, điều kiện 〜たら, mục đích 〜ために, thay đổi 〜ようになりました, dự định 〜つもりです, ý kiến 〜と思います. Kết bài bằng lời cảm ơn: 皆さんのおかげです. Trình tự gợi ý: quá khứ → hiện tại → dự định → ước mơ.',
          examples: [
            ['日本で働いた経験があります。', 'Tôi có kinh nghiệm làm việc ở Nhật.'],
            ['日本語が話せるようになったので、自信があります。', 'Vì đã nói được tiếng Nhật nên tôi có tự tin.'],
            ['将来は先生になりたいと思います。', 'Trong tương lai tôi muốn làm giáo viên.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'リンさんの将来の夢は何ですか。', 'Ước mơ tương lai của Linh là gì?'],
            ['リン', '日本の会社に就職して、日本で成長したいと思います。', 'Tôi muốn vào làm ở công ty Nhật và trưởng thành ở Nhật.'],
            ['田中', 'きっと成功するでしょう。不安はありませんか。', 'Chắc chắn bạn sẽ thành công. Bạn có lo lắng không?'],
            ['リン', '少し不安ですが、皆さんのおかげで、自信がつきました。', 'Hơi lo nhưng nhờ mọi người mà tôi đã có tự tin.'],
          ],
        },
        reorder: [
          ['日本|で|働いた|経験|が|あります|。', 'Tôi có kinh nghiệm làm việc ở Nhật.'],
          ['将来|は|先生|に|なりたい|と|思います|。', 'Trong tương lai tôi muốn làm giáo viên.'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi có kinh nghiệm làm việc ở Nhật.', source: '日本 / 働く / 経験', pattern: 'V-た + 経験があります', answers: ['日本で働いた経験があります。', '日本で働いた経験があります'] },
          { prompt: 'Nói trong tương lai tôi muốn làm giáo viên (〜と思います).', source: '将来 / 先生', pattern: '〜たいと思います', answers: ['将来は先生になりたいと思います。', '将来は先生になりたいと思います'] },
        ],
        tip: ['Chặng cuối N4', 'Hoàn thành bài này nghĩa là bạn đã có thể xử lý nhiều tình huống giao tiếp. Hãy tập kể 1 phút về quá khứ và dự định, rồi thử với người bản xứ.'],
      },
    ],
  },
];
