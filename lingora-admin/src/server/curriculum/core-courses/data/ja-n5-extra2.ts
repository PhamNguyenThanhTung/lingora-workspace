import type { UnitSpec } from '../types.ts';

/**
 * Japanese N5 — extension units (8–10): town and directions, home routines and giving/receiving, school and work.
 * Same conventions as ja-n5.ts: readings are written "かな (romaji)" and verbs are listed in the polite ます form.
 */
export const JA_N5_EXTRA2_UNITS: UnitSpec[] = [
  {
    level: 'N5',
    names: { vi: 'Phố phường và chỉ đường', en: 'Town and Directions' },
    lessons: [
      {
        title: { vi: 'Hỏi đường và chỉ đường', en: 'Asking for and Giving Directions' },
        intro: 'Bạn bị lạc và cần hỏi đường đến nhà ga. Bài này dạy các từ chỉ phương hướng và cách chỉ đường bằng động từ thể て nối tiếp.',
        vocab: [
          ['道', 'みち (michi)', 'noun', 'con đường', 'この道をまっすぐ行きます。', 'Tôi đi thẳng con đường này.'],
          ['まっすぐ', 'まっすぐ (massugu)', 'adverb', 'thẳng', 'まっすぐ行ってください。', 'Xin hãy đi thẳng.'],
          ['右', 'みぎ (migi)', 'noun', 'bên phải', '右に銀行があります。', 'Bên phải có ngân hàng.'],
          ['左', 'ひだり (hidari)', 'noun', 'bên trái', '左に曲がってください。', 'Xin hãy rẽ trái.'],
          ['曲がります', 'まがります (magarimasu)', 'verb', 'rẽ, quẹo', '次の角を曲がります。', 'Tôi rẽ ở góc tiếp theo.'],
          ['角', 'かど (kado)', 'noun', 'góc phố', '角に花屋があります。', 'Ở góc phố có tiệm hoa.'],
          ['信号', 'しんごう (shingō)', 'noun', 'đèn giao thông', '信号を右に曲がります。', 'Tôi rẽ phải ở chỗ đèn giao thông.'],
          ['橋', 'はし (hashi)', 'noun', 'cây cầu', '橋を渡ります。', 'Tôi băng qua cây cầu.'],
          ['渡ります', 'わたります (watarimasu)', 'verb', 'băng qua, đi qua', '橋を渡ってください。', 'Xin hãy băng qua cây cầu.'],
          ['近い', 'ちかい (chikai)', 'i-adjective', 'gần', '駅は近いです。', 'Nhà ga thì gần.'],
          ['遠い', 'とおい (tōi)', 'i-adjective', 'xa', '学校は遠いです。', 'Trường học thì xa.'],
          ['道に迷います', 'みちにまよいます (michi ni mayoimasu)', 'phrase', 'bị lạc đường', 'すみません、道に迷いました。', 'Xin lỗi, tôi bị lạc đường.'],
        ],
        grammar: {
          title: 'V-て + V (chỉ đường nối tiếp): まっすぐ行って、右に曲がります',
          explain: 'Khi chỉ đường, nối các hành động theo thứ tự bằng thể て: まっすぐ行って、右に曲がってください (đi thẳng rồi rẽ phải). Địa điểm đi qua dùng を: 橋を渡ります. Vị trí dùng ～に + あります: 右に銀行があります. Hỏi đường: ～はどこですか / ～へはどう行きますか。',
          examples: [
            ['まっすぐ行って、右に曲がってください。', 'Xin hãy đi thẳng rồi rẽ phải.', 'Massugu itte, migi ni magatte kudasai.'],
            ['橋を渡ってください。', 'Xin hãy băng qua cây cầu.', 'Hashi o watatte kudasai.'],
            ['駅へはどう行きますか。', 'Đến nhà ga thì đi thế nào?', 'Eki e wa dō ikimasu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、駅へはどう行きますか。', 'Xin lỗi, đến nhà ga thì đi thế nào ạ?', 'Sumimasen, eki e wa dō ikimasu ka.'],
            ['通行人', 'まっすぐ行って、信号を右に曲がってください。', 'Xin hãy đi thẳng rồi rẽ phải ở chỗ đèn giao thông.', 'Massugu itte, shingō o migi ni magatte kudasai.'],
            ['リン', '遠いですか。', 'Có xa không ạ?', 'Tōi desu ka.'],
            ['通行人', 'いいえ、近いですよ。五分ぐらいです。', 'Không, gần thôi. Khoảng năm phút.', 'Iie, chikai desu yo. Gofun gurai desu.'],
          ],
        },
        reorder: [
          ['まっすぐ|行って|、|右|に|曲がって|ください|。', 'Xin hãy đi thẳng rồi rẽ phải.'],
          ['駅|へ|は|どう|行きます|か|。', 'Đến nhà ga thì đi thế nào?'],
        ],
        grammarQ: [
          { prompt: 'Chỉ đường: đi thẳng rồi rẽ phải (lịch sự).', source: 'まっすぐ行く / 右に曲がる', pattern: 'V-て、V-てください', answers: ['まっすぐ行って、右に曲がってください。', 'まっすぐ行って、右に曲がってください', 'まっすぐ行って右に曲がってください。'] },
          { prompt: 'Hỏi đến nhà ga đi thế nào.', source: '駅 / どう', pattern: 'N へはどう行きますか', answers: ['駅へはどう行きますか。', '駅へはどう行きますか'] },
        ],
        tip: ['右 và 左', 'Dễ nhầm hai chữ 右 (migi) và 左 (hidari). Mẹo: chữ 右 có nét “口” là cái miệng, người ta cầm đũa bằng tay phải.'],
      },
      {
        title: { vi: 'Ngân hàng, bưu điện, cửa hàng tiện lợi', en: 'Bank, Post Office and Convenience Store' },
        intro: 'Bạn cần gửi thư, đổi tiền hoặc mua đồ nhanh ở cửa hàng tiện lợi. Bài này dạy các địa điểm trong phố và cách nhờ dịch vụ lịch sự.',
        vocab: [
          ['銀行', 'ぎんこう (ginkō)', 'noun', 'ngân hàng', '銀行でお金を出します。', 'Tôi rút tiền ở ngân hàng.'],
          ['郵便局', 'ゆうびんきょく (yūbinkyoku)', 'noun', 'bưu điện', '郵便局で手紙を出します。', 'Tôi gửi thư ở bưu điện.'],
          ['コンビニ', 'こんびに (konbini)', 'noun', 'cửa hàng tiện lợi', 'コンビニで水を買います。', 'Tôi mua nước ở cửa hàng tiện lợi.'],
          ['切手', 'きって (kitte)', 'noun', 'tem thư', '切手を三枚ください。', 'Cho tôi ba con tem.'],
          ['封筒', 'ふうとう (fūtō)', 'noun', 'phong bì', '封筒に手紙を入れます。', 'Tôi cho thư vào phong bì.'],
          ['お金', 'おかね (okane)', 'noun', 'tiền', 'お金がありません。', 'Tôi không có tiền.'],
          ['両替します', 'りょうがえします (ryōgae shimasu)', 'verb', 'đổi tiền', 'ドルを円に両替します。', 'Tôi đổi đô la sang yên.'],
          ['円', 'えん (en)', 'counter', 'yên (tiền Nhật)', 'これは五百円です。', 'Cái này là năm trăm yên.'],
          ['送ります', 'おくります (okurimasu)', 'verb', 'gửi', '荷物を送ります。', 'Tôi gửi hành lý.'],
          ['荷物', 'にもつ (nimotsu)', 'noun', 'hành lý, bưu kiện', '荷物が重いです。', 'Hành lý nặng.'],
          ['エーティーエム', 'えーてぃーえむ (ēti-emu)', 'noun', 'máy エーティーエム', 'エーティーエムはどこですか。', 'Máy エーティーエム ở đâu vậy?'],
          ['営業時間', 'えいぎょうじかん (eigyō jikan)', 'noun', 'giờ mở cửa', '営業時間は九時から五時までです。', 'Giờ mở cửa là từ chín giờ đến năm giờ.'],
        ],
        grammar: {
          title: 'N を + V (dịch vụ); 〜から〜まで (từ … đến …)',
          explain: 'Khi dùng dịch vụ, nói địa điểm + で + tân ngữ を + động từ: 郵便局で手紙を出します. Khoảng thời gian dùng 〜から〜まで: 九時から五時までです (từ chín giờ đến năm giờ). Hỏi giờ mở cửa: 営業時間は何時から何時までですか。 Hỏi vị trí: ～はどこにありますか。',
          examples: [
            ['郵便局で手紙を出します。', 'Tôi gửi thư ở bưu điện.', 'Yūbinkyoku de tegami o dashimasu.'],
            ['営業時間は九時から五時までです。', 'Giờ mở cửa là từ chín giờ đến năm giờ.', 'Eigyō jikan wa kuji kara goji made desu.'],
            ['エーティーエムはどこにありますか。', 'Máy エーティーエム ở đâu vậy?', 'エーティーエム wa doko ni arimasu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、エーティーエムはどこにありますか。', 'Xin lỗi, máy エーティーエム ở đâu vậy ạ?', 'Sumimasen, エーティーエム wa doko ni arimasu ka.'],
            ['店員', 'あそこのコンビニの中にあります。', 'Nó ở trong cửa hàng tiện lợi đằng kia.', 'Asoko no konbini no naka ni arimasu.'],
            ['リン', '郵便局は何時から何時までですか。', 'Bưu điện mở từ mấy giờ đến mấy giờ ạ?', 'Yūbinkyoku wa nanji kara nanji made desu ka.'],
            ['店員', '九時から五時までです。', 'Từ chín giờ đến năm giờ ạ.', 'Kuji kara goji made desu.'],
          ],
        },
        reorder: [
          ['郵便局|で|手紙|を|出します|。', 'Tôi gửi thư ở bưu điện.'],
          ['営業時間|は|九時|から|五時|まで|です|。', 'Giờ mở cửa là từ chín giờ đến năm giờ.'],
        ],
        grammarQ: [
          { prompt: 'Nói giờ mở cửa từ chín giờ đến năm giờ.', source: '営業時間 / 九時 / 五時', pattern: 'N は 〜時から〜時までです', answers: ['営業時間は九時から五時までです。', '営業時間は九時から五時までです'] },
          { prompt: 'Hỏi máy エーティーエム ở đâu.', source: 'エーティーエム / どこ', pattern: 'N はどこにありますか', answers: ['エーティーエムはどこにありますか。', 'エーティーエムはどこにありますか'] },
        ],
        tip: ['Cửa hàng tiện lợi', 'Konbini ở Nhật làm được rất nhiều việc: rút tiền, gửi bưu kiện, trả hoá đơn và mua vé. Mở cửa 24 giờ.'],
      },
      {
        title: { vi: 'Đi tàu điện và mua vé', en: 'Taking the Train and Buying Tickets' },
        intro: 'Bạn muốn đi tàu điện ở Nhật nhưng chưa biết mua vé và đổi tuyến. Bài này dạy từ vựng nhà ga và cách hỏi lộ trình.',
        vocab: [
          ['切符', 'きっぷ (kippu)', 'noun', 'vé tàu', '切符を一枚買います。', 'Tôi mua một chiếc vé.'],
          ['券売機', 'けんばいき (kenbaiki)', 'noun', 'máy bán vé', '券売機で切符を買います。', 'Tôi mua vé ở máy bán vé.'],
          ['改札', 'かいさつ (kaisatsu)', 'noun', 'cổng soát vé', '改札で友達を待ちます。', 'Tôi đợi bạn ở cổng soát vé.'],
          ['ホーム', 'ほーむ (hōmu)', 'noun', 'sân ga', 'ホームで電車を待ちます。', 'Tôi đợi tàu ở sân ga.'],
          ['乗ります', 'のります (norimasu)', 'verb', 'đi (xe), lên (xe)', '八時の電車に乗ります。', 'Tôi lên chuyến tàu tám giờ.'],
          ['降ります', 'おります (orimasu)', 'verb', 'xuống (tàu, xe)', '次の駅で降ります。', 'Tôi xuống ở ga tiếp theo.'],
          ['乗り換えます', 'のりかえます (norikaemasu)', 'verb', 'đổi tuyến, chuyển tàu', '新宿で乗り換えます。', 'Tôi đổi tàu ở Shinjuku.'],
          ['次の', 'つぎの (tsugi no)', 'phrase', 'tiếp theo', '次の電車は何時ですか。', 'Chuyến tàu tiếp theo là mấy giờ?'],
          ['何番線', 'なんばんせん (nanbansen)', 'noun', 'đường ray số mấy', '何番線ですか。', 'Là đường ray số mấy ạ?'],
          ['普通', 'ふつう (futsū)', 'noun', 'tàu thường (dừng mọi ga)', '普通は各駅に止まります。', 'Tàu thường dừng ở mọi ga.'],
          ['急行', 'きゅうこう (kyūkō)', 'noun', 'tàu nhanh', '急行は速いです。', 'Tàu nhanh thì nhanh.'],
          ['時刻表', 'じこくひょう (jikokuhyō)', 'noun', 'bảng giờ tàu', '時刻表を見ます。', 'Tôi xem bảng giờ tàu.'],
        ],
        grammar: {
          title: 'N に 乗ります / N で 降ります / N で 乗り換えます',
          explain: 'Lên phương tiện dùng に: 電車に乗ります. Xuống dùng を hoặc で: 次の駅で降ります (xuống ở ga tiếp theo). Đổi tàu dùng で: 新宿で乗り換えます. Chọn tuyến: ～行きの電車 (tàu đi tới ～). Hỏi: ～までいくらですか (đến ～ bao nhiêu tiền).',
          examples: [
            ['八時の電車に乗ります。', 'Tôi lên chuyến tàu tám giờ.', 'Hachiji no densha ni norimasu.'],
            ['新宿で乗り換えます。', 'Tôi đổi tàu ở Shinjuku.', 'Shinjuku de norikaemasu.'],
            ['次の駅で降ります。', 'Tôi xuống ở ga tiếp theo.', 'Tsugi no eki de orimasu.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、東京駅までいくらですか。', 'Xin lỗi, đến ga Tokyo hết bao nhiêu tiền ạ?', 'Sumimasen, Tōkyō-eki made ikura desu ka.'],
            ['駅員', '三百二十円です。券売機で切符を買ってください。', 'Ba trăm hai mươi yên. Xin hãy mua vé ở máy bán vé.', 'Sanbyaku nijū en desu. Kenbaiki de kippu o katte kudasai.'],
            ['リン', '何番線の電車に乗りますか。', 'Tôi lên tàu ở đường ray số mấy ạ?', 'Nanbansen no densha ni norimasu ka.'],
            ['駅員', '二番線です。新宿で乗り換えてください。', 'Đường ray số hai. Xin hãy đổi tàu ở Shinjuku.', 'Nibansen desu. Shinjuku de norikaete kudasai.'],
          ],
        },
        reorder: [
          ['八時|の|電車|に|乗ります|。', 'Tôi lên chuyến tàu tám giờ.'],
          ['新宿|で|乗り換えます|。', 'Tôi đổi tàu ở Shinjuku.'],
        ],
        grammarQ: [
          { prompt: 'Nói xuống ở ga tiếp theo.', source: '次の駅 / 降ります', pattern: 'N で 降ります', answers: ['次の駅で降ります。', '次の駅で降ります'] },
          { prompt: 'Nói đổi tàu ở Shinjuku.', source: '新宿 / 乗り換えます', pattern: 'N で 乗り換えます', answers: ['新宿で乗り換えます。', '新宿で乗り換えます'] },
        ],
        tip: ['IC card', 'Ở Nhật hầu hết người ta dùng thẻ IC (Suica, Pasmo) để quét ở cổng soát vé, tiện hơn mua vé lẻ mỗi lần.'],
      },
    ],
  },
  {
    level: 'N5',
    names: { vi: 'Sinh hoạt và quà tặng', en: 'Home Routines and Giving' },
    lessons: [
      {
        title: { vi: 'Một ngày của tôi (thứ tự và khoảng thời gian)', en: 'My Day: Routines and Durations' },
        intro: 'Bạn kể một ngày điển hình: thức dậy, tắm, ăn sáng, đi làm. Bài này dạy các động từ sinh hoạt và cách nói mất bao lâu, bao nhiêu lần.',
        vocab: [
          ['起きます', 'おきます (okimasu)', 'verb', 'thức dậy', '毎朝六時に起きます。', 'Mỗi sáng tôi thức dậy lúc sáu giờ.'],
          ['寝ます', 'ねます (nemasu)', 'verb', 'đi ngủ', '夜十一時に寝ます。', 'Tôi đi ngủ lúc mười một giờ đêm.'],
          ['シャワー', 'しゃわー (shawā)', 'noun', 'vòi sen, tắm', '朝シャワーを浴びます。', 'Buổi sáng tôi tắm vòi sen.'],
          ['浴びます', 'あびます (abimasu)', 'verb', 'tắm (vòi sen)', 'シャワーを浴びます。', 'Tôi tắm vòi sen.'],
          ['歯', 'は (ha)', 'noun', 'răng', '毎日歯を磨きます。', 'Mỗi ngày tôi đánh răng.'],
          ['磨きます', 'みがきます (migakimasu)', 'verb', 'đánh (răng), chà', '寝る前に歯を磨きます。', 'Trước khi ngủ tôi đánh răng.'],
          ['朝ご飯', 'あさごはん (asagohan)', 'noun', 'bữa sáng', '七時に朝ご飯を食べます。', 'Tôi ăn bữa sáng lúc bảy giờ.'],
          ['毎週', 'まいしゅう (maishū)', 'adverb', 'mỗi tuần', '毎週日曜日に掃除します。', 'Mỗi chủ nhật tôi dọn dẹp.'],
          ['〜回', 'かい (kai)', 'counter', 'lần', '週に二回運動します。', 'Một tuần tôi tập thể dục hai lần.'],
          ['〜時間', 'じかん (jikan)', 'counter', 'tiếng, giờ (khoảng thời gian)', '毎日八時間寝ます。', 'Mỗi ngày tôi ngủ tám tiếng.'],
          ['〜ぐらい', 'ぐらい (gurai)', 'particle', 'khoảng, chừng', '一時間ぐらいかかります。', 'Mất khoảng một tiếng.'],
          ['かかります', 'かかります (kakarimasu)', 'verb', 'mất (thời gian, tiền)', '会社まで三十分かかります。', 'Đến công ty mất ba mươi phút.'],
        ],
        grammar: {
          title: 'Khoảng thời gian: 〜時間かかります; tần suất: 週に〜回',
          explain: 'Nói thời gian mất bao lâu dùng 〜かかります, không cần trợ từ: 会社まで三十分かかります. Tần suất: 週に二回 (một tuần hai lần), 月に一回 (một tháng một lần), 毎日 / 毎週 (mỗi ngày / mỗi tuần). 〜ぐらい đặt sau số lượng nghĩa là “khoảng”: 一時間ぐらい。',
          examples: [
            ['会社まで三十分かかります。', 'Đến công ty mất ba mươi phút.', 'Kaisha made sanjuppun kakarimasu.'],
            ['週に二回運動します。', 'Một tuần tôi tập thể dục hai lần.', 'Shū ni nikai undō shimasu.'],
            ['毎朝六時に起きます。', 'Mỗi sáng tôi thức dậy lúc sáu giờ.', 'Maiasa rokuji ni okimasu.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'リンさんは毎朝何時に起きますか。', 'Linh mỗi sáng thức dậy lúc mấy giờ?', 'Rin-san wa maiasa nanji ni okimasu ka.'],
            ['リン', '六時に起きます。それから、シャワーを浴びます。', 'Tôi thức dậy lúc sáu giờ. Sau đó tôi tắm vòi sen.', 'Rokuji ni okimasu. Sorekara, shawā o abimasu.'],
            ['田中', '会社までどのぐらいかかりますか。', 'Đến công ty mất khoảng bao lâu?', 'Kaisha made dono gurai kakarimasu ka.'],
            ['リン', '電車で三十分かかります。', 'Đi tàu mất ba mươi phút.', 'Densha de sanjuppun kakarimasu.'],
          ],
        },
        reorder: [
          ['会社|まで|三十分|かかります|。', 'Đến công ty mất ba mươi phút.'],
          ['週|に|二回|運動します|。', 'Một tuần tôi tập thể dục hai lần.'],
        ],
        grammarQ: [
          { prompt: 'Nói đến công ty mất ba mươi phút.', source: '会社 / 三十分', pattern: 'N まで + khoảng thời gian + かかります', answers: ['会社まで三十分かかります。', '会社まで三十分かかります'] },
          { prompt: 'Nói một tuần tập thể dục hai lần.', source: '週 / 二回 / 運動します', pattern: '週に + số lần + V', answers: ['週に二回運動します。', '週に二回運動します'] },
        ],
        tip: ['Giờ và thời lượng', '七時 (shichiji) là “bảy giờ” còn 七時間 (shichijikan) là “bảy tiếng”. Chỉ thêm 間 là đổi từ mốc thời gian sang khoảng thời gian.'],
      },
      {
        title: { vi: 'Việc nhà và nấu ăn', en: 'Household Chores and Cooking' },
        intro: 'Bạn chia sẻ việc nhà với người ở cùng. Bài này dạy các việc nhà thường gặp và cách nhờ giúp bằng 〜てくれませんか.',
        vocab: [
          ['台所', 'だいどころ (daidokoro)', 'noun', 'nhà bếp', '台所で料理を作ります。', 'Tôi nấu ăn trong nhà bếp.'],
          ['冷蔵庫', 'れいぞうこ (reizōko)', 'noun', 'tủ lạnh', '冷蔵庫に牛乳があります。', 'Trong tủ lạnh có sữa.'],
          ['皿', 'さら (sara)', 'noun', 'cái đĩa', '皿を洗います。', 'Tôi rửa đĩa.'],
          ['洗います', 'あらいます (araimasu)', 'verb', 'rửa, giặt', '手を洗います。', 'Tôi rửa tay.'],
          ['ゴミ', 'ごみ (gomi)', 'noun', 'rác', 'ゴミを出します。', 'Tôi đem rác ra ngoài.'],
          ['捨てます', 'すてます (sutemasu)', 'verb', 'vứt bỏ', '古い新聞を捨てます。', 'Tôi vứt tờ báo cũ.'],
          ['切ります', 'きります (kirimasu)', 'verb', 'cắt, thái', '野菜を切ります。', 'Tôi thái rau.'],
          ['野菜', 'やさい (yasai)', 'noun', 'rau', '野菜を冷蔵庫に入れます。', 'Tôi cho rau vào tủ lạnh.'],
          ['入れます', 'いれます (iremasu)', 'verb', 'cho vào', '砂糖を入れます。', 'Tôi cho đường vào.'],
          ['砂糖', 'さとう (satō)', 'noun', 'đường', 'お茶に砂糖を入れます。', 'Tôi cho đường vào trà.'],
          ['手伝います', 'てつだいます (tetsudaimasu)', 'verb', 'giúp đỡ', '母を手伝います。', 'Tôi giúp mẹ.'],
          ['片付けます', 'かたづけます (katazukemasu)', 'verb', 'dọn dẹp, cất gọn', '部屋を片付けます。', 'Tôi dọn dẹp phòng.'],
        ],
        grammar: {
          title: 'V-てくれませんか (nhờ giúp) / V-てもいいですか',
          explain: 'Để nhờ người khác làm gì giúp mình, dùng V-てくれませんか (lịch sự, nhẹ hơn ください): 手伝ってくれませんか (bạn giúp tôi nhé?). Đáp lại: はい、いいですよ / すみません、今ちょっと… Khi tự đề nghị giúp, nói 手伝いましょうか (để tôi giúp nhé?).',
          examples: [
            ['ちょっと手伝ってくれませんか。', 'Bạn giúp tôi một chút được không?', 'Chotto tetsudatte kuremasen ka.'],
            ['お皿を洗ってくれませんか。', 'Bạn rửa đĩa giúp tôi được không?', 'Osara o aratte kuremasen ka.'],
            ['手伝いましょうか。', 'Để tôi giúp nhé?', 'Tetsudaimashō ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'ちょっと手伝ってくれませんか。', 'Bạn giúp tôi một chút được không?', 'Chotto tetsudatte kuremasen ka.'],
            ['田中', 'はい、いいですよ。何をしますか。', 'Vâng, được chứ. Làm gì vậy?', 'Hai, ii desu yo. Nani o shimasu ka.'],
            ['リン', '野菜を切ってくれませんか。私は皿を洗います。', 'Bạn thái rau giúp tôi nhé. Tôi sẽ rửa đĩa.', 'Yasai o kitte kuremasen ka. Watashi wa sara o araimasu.'],
            ['田中', 'わかりました。ゴミも出しましょうか。', 'Tôi hiểu rồi. Tôi đem rác ra luôn nhé?', 'Wakarimashita. Gomi mo dashimashō ka.'],
          ],
        },
        reorder: [
          ['ちょっと|手伝って|くれませんか|。', 'Bạn giúp tôi một chút được không?'],
          ['手伝いましょう|か|。', 'Để tôi giúp nhé?'],
        ],
        grammarQ: [
          { prompt: 'Nhờ bạn giúp một chút bằng てくれませんか.', source: 'ちょっと / 手伝う', pattern: 'V-て + くれませんか', answers: ['ちょっと手伝ってくれませんか。', 'ちょっと手伝ってくれませんか'] },
          { prompt: 'Đề nghị giúp (để tôi giúp nhé).', source: '手伝います', pattern: 'V-ましょうか', answers: ['手伝いましょうか。', '手伝いましょうか'] },
        ],
        tip: ['Phân loại rác', 'Ở Nhật rác được chia theo ngày: cháy được, không cháy được, nhựa, giấy. Hỏi ngày đổ rác là ゴミの日はいつですか。'],
      },
      {
        title: { vi: 'Tặng quà và nhận quà (あげます・もらいます)', en: 'Giving and Receiving Gifts' },
        intro: 'Bạn muốn tặng quà sinh nhật hoặc kể mình được ai tặng gì. Bài này dạy ba động từ cho nhận あげます, もらいます, くれます.',
        vocab: [
          ['プレゼント', 'ぷれぜんと (purezento)', 'noun', 'quà tặng', '誕生日にプレゼントをあげます。', 'Vào sinh nhật tôi tặng quà.'],
          ['あげます', 'あげます (agemasu)', 'verb', 'cho, tặng', '友達に花をあげます。', 'Tôi tặng hoa cho bạn.'],
          ['もらいます', 'もらいます (moraimasu)', 'verb', 'nhận', '母から手紙をもらいました。', 'Tôi nhận được lá thư từ mẹ.'],
          ['くれます', 'くれます (kuremasu)', 'verb', 'cho (tôi)', '友達が本をくれました。', 'Bạn đã cho tôi một cuốn sách.'],
          ['花', 'はな (hana)', 'noun', 'hoa', '妹に花をあげます。', 'Tôi tặng hoa cho em gái.'],
          ['お土産', 'おみやげ (omiyage)', 'noun', 'quà lưu niệm', '日本のお土産を買います。', 'Tôi mua quà lưu niệm Nhật Bản.'],
          ['カード', 'かーど (kādo)', 'noun', 'tấm thiệp, thẻ', '誕生日カードを書きます。', 'Tôi viết thiệp sinh nhật.'],
          ['お祝い', 'おいわい (oiwai)', 'noun', 'lời chúc mừng, quà mừng', '結婚のお祝いをあげます。', 'Tôi tặng quà mừng đám cưới.'],
          ['おめでとう', 'おめでとう (omedetō)', 'phrase', 'chúc mừng', '誕生日おめでとう。', 'Chúc mừng sinh nhật.'],
          ['嬉しい', 'うれしい (ureshii)', 'i-adjective', 'vui, hạnh phúc', 'プレゼントをもらって嬉しいです。', 'Nhận được quà tôi rất vui.'],
          ['ネクタイ', 'ねくたい (nekutai)', 'noun', 'cà vạt', '父にネクタイをあげます。', 'Tôi tặng cà vạt cho bố.'],
          ['時計', 'とけい (tokei)', 'noun', 'đồng hồ', '兄に時計をもらいました。', 'Tôi nhận được chiếc đồng hồ từ anh trai.'],
        ],
        grammar: {
          title: 'AはBにNをあげます / BはAにNをもらいます / AがNをくれます',
          explain: 'Cho đi dùng あげます: 私は友達に花をあげます (tôi tặng hoa cho bạn). Nhận dùng もらいます: 母から手紙をもらいました (tôi nhận thư từ mẹ), người cho đi sau に hoặc から. Khi người khác cho TÔI, dùng くれます: 友達が本をくれました. Phân biệt あげます (mình cho người ngoài) và くれます (người ngoài cho mình).',
          examples: [
            ['友達に花をあげます。', 'Tôi tặng hoa cho bạn.', 'Tomodachi ni hana o agemasu.'],
            ['母から手紙をもらいました。', 'Tôi nhận được lá thư từ mẹ.', 'Haha kara tegami o moraimashita.'],
            ['友達が本をくれました。', 'Bạn đã cho tôi một cuốn sách.', 'Tomodachi ga hon o kuremashita.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '田中さん、誕生日おめでとうございます。これ、プレゼントです。', 'Anh Tanaka, chúc mừng sinh nhật. Đây là quà của tôi.', 'Tanaka-san, tanjōbi omedetō gozaimasu. Kore, purezento desu.'],
            ['田中', 'ありがとう。開けてもいいですか。', 'Cảm ơn bạn. Tôi mở ra được không?', 'Arigatō. Akete mo ii desu ka.'],
            ['リン', 'はい、どうぞ。ネクタイです。', 'Vâng, xin mời. Là một chiếc cà vạt.', 'Hai, dōzo. Nekutai desu.'],
            ['田中', 'わあ、嬉しいです。友達に花ももらいました。', 'Ôi, tôi rất vui. Tôi còn nhận được hoa từ bạn bè nữa.', 'Wā, ureshii desu. Tomodachi ni hana mo moraimashita.'],
          ],
        },
        reorder: [
          ['友達|に|花|を|あげます|。', 'Tôi tặng hoa cho bạn.'],
          ['友達|が|本|を|くれました|。', 'Bạn đã cho tôi một cuốn sách.'],
        ],
        grammarQ: [
          { prompt: 'Nói bạn đã tặng bạn một cuốn sách (người ngoài cho mình).', source: '友達 / 本', pattern: 'A が N を くれました', answers: ['友達が本をくれました。', '友達が本をくれました'] },
          { prompt: 'Nói nhận được lá thư từ mẹ.', source: '母 / 手紙', pattern: 'A から N を もらいました', answers: ['母から手紙をもらいました。', '母から手紙をもらいました'] },
        ],
        tip: ['Văn hoá tặng quà', 'Người Nhật hay tặng お土産 (quà từ nơi đã đi) cho đồng nghiệp khi đi du lịch về, thường là bánh kẹo đóng gói nhỏ.'],
      },
    ],
  },
  {
    level: 'N5',
    names: { vi: 'Trường học và công việc', en: 'School and Work' },
    lessons: [
      {
        title: { vi: 'Trong lớp học', en: 'In the Classroom' },
        intro: 'Bạn đang ở lớp học tiếng Nhật và cần hỏi thầy cô hoặc mượn đồ. Bài này dạy từ vựng lớp học và các câu hay dùng khi học.',
        vocab: [
          ['教室', 'きょうしつ (kyōshitsu)', 'noun', 'lớp học, phòng học', '教室に学生が十人います。', 'Trong lớp có mười sinh viên.'],
          ['黒板', 'こくばん (kokuban)', 'noun', 'bảng đen', '黒板に名前を書きます。', 'Tôi viết tên lên bảng đen.'],
          ['辞書', 'じしょ (jisho)', 'noun', 'từ điển', '辞書で言葉を調べます。', 'Tôi tra từ trong từ điển.'],
          ['ノート', 'のーと (nōto)', 'noun', 'vở ghi chép', 'ノートに漢字を書きます。', 'Tôi viết chữ Hán vào vở.'],
          ['鉛筆', 'えんぴつ (enpitsu)', 'noun', 'bút chì', '鉛筆で書いてください。', 'Xin hãy viết bằng bút chì.'],
          ['消しゴム', 'けしごむ (keshigomu)', 'noun', 'cục tẩy', '消しゴムを貸してください。', 'Xin hãy cho tôi mượn cục tẩy.'],
          ['調べます', 'しらべます (shirabemasu)', 'verb', 'tra cứu, tìm hiểu', '辞書で調べます。', 'Tôi tra bằng từ điển.'],
          ['質問', 'しつもん (shitsumon)', 'noun', 'câu hỏi', '質問があります。', 'Tôi có câu hỏi.'],
          ['答え', 'こたえ (kotae)', 'noun', 'câu trả lời, đáp án', '答えがわかりません。', 'Tôi không biết đáp án.'],
          ['答えます', 'こたえます (kotaemasu)', 'verb', 'trả lời', '先生の質問に答えます。', 'Tôi trả lời câu hỏi của thầy cô.'],
          ['もう一度', 'もういちど (mō ichido)', 'phrase', 'một lần nữa', 'もう一度お願いします。', 'Xin hãy nói lại một lần nữa.'],
          ['意味', 'いみ (imi)', 'noun', 'ý nghĩa', 'この言葉の意味は何ですか。', 'Ý nghĩa của từ này là gì?'],
        ],
        grammar: {
          title: 'Hỏi trong lớp: 〜はどういう意味ですか / もう一度お願いします',
          explain: 'Hỏi nghĩa của từ: これはどういう意味ですか (cái này nghĩa là gì?) hoặc 「〜」は日本語で何ですか (”〜” trong tiếng Nhật là gì?). Khi không nghe rõ, nói もう一度お願いします (xin hãy nói lại lần nữa) hoặc ゆっくりお願いします (xin hãy nói chậm lại). Mượn đồ: 〜を貸してください。',
          examples: [
            ['この言葉の意味は何ですか。', 'Ý nghĩa của từ này là gì?', 'Kono kotoba no imi wa nan desu ka.'],
            ['もう一度お願いします。', 'Xin hãy nói lại một lần nữa.', 'Mō ichido onegaishimasu.'],
            ['消しゴムを貸してください。', 'Xin hãy cho tôi mượn cục tẩy.', 'Keshigomu o kashite kudasai.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '先生、質問があります。この言葉の意味は何ですか。', 'Thưa thầy, em có câu hỏi. Ý nghĩa của từ này là gì ạ?', 'Sensei, shitsumon ga arimasu. Kono kotoba no imi wa nan desu ka.'],
            ['先生', '辞書で調べてください。', 'Hãy tra từ điển nhé.', 'Jisho de shirabete kudasai.'],
            ['リン', 'すみません、辞書を忘れました。', 'Xin lỗi thầy, em quên mang từ điển.', 'Sumimasen, jisho o wasuremashita.'],
            ['先生', 'じゃあ、私の辞書を貸します。もう一度見てください。', 'Vậy thì thầy cho em mượn từ điển của thầy. Hãy xem lại một lần nữa.', 'Jā, watashi no jisho o kashimasu. Mō ichido mite kudasai.'],
          ],
        },
        reorder: [
          ['この|言葉|の|意味|は|何|です|か|。', 'Ý nghĩa của từ này là gì?'],
          ['もう一度|お願いします|。', 'Xin hãy nói lại một lần nữa.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi ý nghĩa của từ này là gì.', source: 'この言葉 / 意味 / 何', pattern: 'N の意味は何ですか', answers: ['この言葉の意味は何ですか。', 'この言葉の意味は何ですか'] },
          { prompt: 'Xin mượn cục tẩy.', source: '消しゴム / 貸して', pattern: 'N を貸してください', answers: ['消しゴムを貸してください。', '消しゴムを貸してください'] },
        ],
        tip: ['Kính ngữ với giáo viên', 'Gọi giáo viên là 先生, không gọi bằng tên. Trong lớp dùng です・ます với thầy cô.'],
      },
      {
        title: { vi: 'Nghề nghiệp và nơi làm việc', en: 'Jobs and Workplaces' },
        intro: 'Bạn giới thiệu nghề nghiệp của mình và hỏi người khác làm nghề gì. Bài này dạy các nghề phổ biến và cách nói làm việc ở đâu.',
        vocab: [
          ['看護師', 'かんごし (kangoshi)', 'noun', 'y tá', '姉は看護師です。', 'Chị gái tôi là y tá.'],
          ['店員', 'てんいん (tenin)', 'noun', 'nhân viên cửa hàng', '店員が荷物を持ちます。', 'Nhân viên cửa hàng xách hành lý.'],
          ['警察官', 'けいさつかん (keisatsukan)', 'noun', 'cảnh sát', '警察官に道を聞きます。', 'Tôi hỏi đường cảnh sát.'],
          ['エンジニア', 'えんじにあ (enjinia)', 'noun', 'kỹ sư', '兄はエンジニアです。', 'Anh trai tôi là kỹ sư.'],
          ['運転手', 'うんてんしゅ (untenshu)', 'noun', 'tài xế', '父はバスの運転手です。', 'Bố tôi là tài xế xe buýt.'],
          ['工場', 'こうじょう (kōjō)', 'noun', 'nhà máy', '工場で働きます。', 'Tôi làm việc ở nhà máy.'],
          ['働きます', 'はたらきます (hatarakimasu)', 'verb', 'làm việc', '銀行で働きます。', 'Tôi làm việc ở ngân hàng.'],
          ['お仕事', 'おしごと (oshigoto)', 'noun', 'công việc (lịch sự)', 'お仕事は何ですか。', 'Công việc của bạn là gì?'],
          ['給料', 'きゅうりょう (kyūryō)', 'noun', 'tiền lương', '給料は月末にもらいます。', 'Tôi nhận lương vào cuối tháng.'],
          ['月末', 'げつまつ (getsumatsu)', 'noun', 'cuối tháng', '月末は忙しいです。', 'Cuối tháng thì bận.'],
          ['休憩', 'きゅうけい (kyūkei)', 'noun', 'giờ nghỉ giải lao', '一時に休憩します。', 'Tôi nghỉ giải lao lúc một giờ.'],
          ['アルバイト', 'あるばいと (arubaito)', 'noun', 'việc làm thêm', 'コンビニでアルバイトをします。', 'Tôi làm thêm ở cửa hàng tiện lợi.'],
        ],
        grammar: {
          title: 'N は N で 働いています / お仕事は何ですか',
          explain: 'Hỏi nghề: お仕事は何ですか (công việc của bạn là gì?). Trả lời bằng danh từ nghề: 看護師です, hoặc nơi làm: 銀行で働いています (tôi đang làm việc ở ngân hàng). Nơi làm việc dùng で + 働きます, KHÔNG dùng に. Nghề của người khác: 姉は看護師です。',
          examples: [
            ['お仕事は何ですか。', 'Công việc của bạn là gì?', 'Oshigoto wa nan desu ka.'],
            ['銀行で働いています。', 'Tôi đang làm việc ở ngân hàng.', 'Ginkō de hataraite imasu.'],
            ['姉は看護師です。', 'Chị gái tôi là y tá.', 'Ane wa kangoshi desu.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '田中さん、お仕事は何ですか。', 'Anh Tanaka, công việc của anh là gì ạ?', 'Tanaka-san, oshigoto wa nan desu ka.'],
            ['田中', '銀行で働いています。リンさんは？', 'Tôi làm việc ở ngân hàng. Còn Linh thì sao?', 'Ginkō de hataraite imasu. Rin-san wa?'],
            ['リン', '私は学生ですが、コンビニでアルバイトをしています。', 'Tôi là sinh viên nhưng tôi đang làm thêm ở cửa hàng tiện lợi.', 'Watashi wa gakusei desu ga, konbini de arubaito o shite imasu.'],
            ['田中', '大変ですね。給料はいいですか。', 'Vất vả nhỉ. Lương có tốt không?', 'Taihen desu ne. Kyūryō wa ii desu ka.'],
          ],
        },
        reorder: [
          ['お仕事|は|何|です|か|。', 'Công việc của bạn là gì?'],
          ['銀行|で|働いています|。', 'Tôi đang làm việc ở ngân hàng.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi lịch sự công việc của người khác.', source: 'お仕事 / 何', pattern: 'お仕事は何ですか', answers: ['お仕事は何ですか。', 'お仕事は何ですか'] },
          { prompt: 'Nói tôi đang làm việc ở ngân hàng.', source: '銀行 / 働いて', pattern: 'N で 働いています', answers: ['銀行で働いています。', '銀行で働いています'] },
        ],
        tip: ['Nghề nghiệp lịch sự', 'Khi hỏi nghề người khác thêm お để lịch sự (お仕事). Khi nói về nghề của mình thì không thêm お.'],
      },
      {
        title: { vi: 'Tổng ôn N5: giới thiệu bản thân', en: 'N5 Review: Introducing Yourself' },
        intro: 'Bài cuối ôn lại toàn bộ N5: bạn tự giới thiệu 1 phút với tên, quê quán, nghề, sở thích và kế hoạch, rồi hỏi lại người đối diện.',
        vocab: [
          ['自己紹介', 'じこしょうかい (jikoshōkai)', 'noun', 'giới thiệu bản thân', '自己紹介をお願いします。', 'Xin hãy giới thiệu bản thân.'],
          ['出身', 'しゅっしん (shusshin)', 'noun', 'quê quán, xuất thân', 'ご出身はどちらですか。', 'Quê bạn ở đâu?'],
          ['国', 'くに (kuni)', 'noun', 'đất nước', '私の国はベトナムです。', 'Đất nước của tôi là Việt Nam.'],
          ['住んでいます', 'すんでいます (sunde imasu)', 'verb', 'đang sống', '東京に住んでいます。', 'Tôi đang sống ở Tokyo.'],
          ['家族', 'かぞく (kazoku)', 'noun', 'gia đình', '家族は四人です。', 'Gia đình tôi có bốn người.'],
          ['将来', 'しょうらい (shōrai)', 'noun', 'tương lai', '将来は先生になりたいです。', 'Trong tương lai tôi muốn trở thành giáo viên.'],
          ['夢', 'ゆめ (yume)', 'noun', 'ước mơ', '私の夢は日本で働くことです。', 'Ước mơ của tôi là làm việc ở Nhật.'],
          ['頑張ります', 'がんばります (ganbarimasu)', 'verb', 'cố gắng', '日本語を頑張ります。', 'Tôi cố gắng học tiếng Nhật.'],
          ['初めまして', 'はじめまして (hajimemashite)', 'phrase', 'rất vui được gặp lần đầu', '初めまして、リンです。', 'Rất vui được gặp, tôi là Linh.'],
          ['どうぞよろしく', 'どうぞよろしく (dōzo yoroshiku)', 'phrase', 'rất mong được giúp đỡ', 'どうぞよろしくお願いします。', 'Rất mong được giúp đỡ.'],
          ['勉強中', 'べんきょうちゅう (benkyōchū)', 'noun', 'đang học', '日本語を勉強中です。', 'Tôi đang học tiếng Nhật.'],
          ['楽しみ', 'たのしみ (tanoshimi)', 'na-adjective', 'mong chờ, háo hức', '会うのが楽しみです。', 'Tôi rất mong được gặp bạn.'],
        ],
        grammar: {
          title: 'Ôn tập: Aは Bです / N に 住んでいます / V-たいです',
          explain: 'Bài tự giới thiệu kết hợp nhiều mẫu: Aは Bです (tên, nghề), N に住んでいます (nơi sống), N で 働いています (nơi làm), N が好きです (sở thích) và V-たいです (mong muốn). Kết thúc bằng どうぞよろしくお願いします. Gợi ý trình tự: tên → quê → nơi sống → nghề → sở thích → lời kết.',
          examples: [
            ['初めまして、リンです。', 'Rất vui được gặp, tôi là Linh.', 'Hajimemashite, Rin desu.'],
            ['東京に住んでいます。', 'Tôi đang sống ở Tokyo.', 'Tōkyō ni sunde imasu.'],
            ['将来は先生になりたいです。', 'Trong tương lai tôi muốn trở thành giáo viên.', 'Shōrai wa sensei ni naritai desu.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '初めまして、リンです。ベトナムから来ました。', 'Rất vui được gặp, tôi là Linh. Tôi đến từ Việt Nam.', 'Hajimemashite, Rin desu. Betonamu kara kimashita.'],
            ['リン', '今、東京に住んでいます。日本語を勉強中です。', 'Bây giờ tôi đang sống ở Tokyo. Tôi đang học tiếng Nhật.', 'Ima, Tōkyō ni sunde imasu. Nihongo o benkyōchū desu.'],
            ['リン', '将来は日本で働きたいです。どうぞよろしくお願いします。', 'Trong tương lai tôi muốn làm việc ở Nhật. Rất mong được giúp đỡ.', 'Shōrai wa Nihon de hatarakitai desu. Dōzo yoroshiku onegaishimasu.'],
            ['田中', 'こちらこそ、よろしくお願いします。', 'Tôi mới là người mong được giúp đỡ.', 'Kochira koso, yoroshiku onegaishimasu.'],
          ],
        },
        reorder: [
          ['初めまして|、|リン|です|。', 'Rất vui được gặp, tôi là Linh.'],
          ['東京|に|住んでいます|。', 'Tôi đang sống ở Tokyo.'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi đang sống ở Tokyo.', source: '東京 / 住んで', pattern: 'N に 住んでいます', answers: ['東京に住んでいます。', '東京に住んでいます'] },
          { prompt: 'Chào lần đầu gặp: “Rất vui được gặp, tôi là Linh”.', source: '初めまして / リン', pattern: '初めまして、〜です', answers: ['初めまして、リンです。', '初めまして、リンです'] },
        ],
        tip: ['Chặng cuối N5', 'Hoàn thành bài này nghĩa là bạn có thể giao tiếp cơ bản bằng tiếng Nhật. Hãy tập tự giới thiệu to thành tiếng 3 lần.'],
      },
    ],
  },
];
