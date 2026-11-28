import type { UnitSpec } from '../types.ts';

/**
 * Japanese N5 — extension units (5–7): dates and weather, eating out and groceries, everyday activities.
 * Same conventions as ja-n5.ts: readings are written "かな (romaji)" and verbs are listed in the polite ます form.
 */
export const JA_N5_EXTRA_UNITS: UnitSpec[] = [
  {
    level: 'N5',
    names: { vi: 'Ngày tháng, thời tiết và quần áo', en: 'Dates, Weather and Clothes' },
    lessons: [
      {
        title: { vi: 'Thứ, ngày, tháng và sinh nhật', en: 'Days, Dates and Birthdays' },
        intro: 'Bạn muốn hẹn bạn vào thứ Bảy hoặc hỏi sinh nhật của ai đó. Sau bài này bạn nói được thứ trong tuần, ngày tháng và dùng trợ từ に để chỉ thời điểm.',
        vocab: [
          ['月曜日', 'げつようび (getsuyōbi)', 'noun', 'thứ Hai', '月曜日に学校へ行きます。', 'Thứ Hai tôi đi đến trường.'],
          ['金曜日', 'きんようび (kinyōbi)', 'noun', 'thứ Sáu', '金曜日は仕事が早く終わります。', 'Thứ Sáu công việc kết thúc sớm.'],
          ['土曜日', 'どようび (doyōbi)', 'noun', 'thứ Bảy', '土曜日にパーティーがあります。', 'Thứ Bảy có một bữa tiệc.'],
          ['日曜日', 'にちようび (nichiyōbi)', 'noun', 'chủ nhật', '日曜日は家にいます。', 'Chủ nhật tôi ở nhà.'],
          ['何曜日', 'なんようび (nanyōbi)', 'noun', 'thứ mấy', '今日は何曜日ですか。', 'Hôm nay là thứ mấy?'],
          ['今日', 'きょう (kyō)', 'noun', 'hôm nay', '今日は水曜日です。', 'Hôm nay là thứ Tư.'],
          ['明日', 'あした (ashita)', 'noun', 'ngày mai', '明日は休みです。', 'Ngày mai là ngày nghỉ.'],
          ['昨日', 'きのう (kinō)', 'noun', 'hôm qua', '昨日は雨でした。', 'Hôm qua trời mưa.'],
          ['誕生日', 'たんじょうび (tanjōbi)', 'noun', 'sinh nhật', '私の誕生日は十二月です。', 'Sinh nhật của tôi vào tháng Mười hai.'],
          ['何月', 'なんがつ (nangatsu)', 'noun', 'tháng mấy', '誕生日は何月ですか。', 'Sinh nhật bạn vào tháng mấy?'],
          ['何日', 'なんにち (nannichi)', 'noun', 'ngày mấy', '今日は何日ですか。', 'Hôm nay là ngày mấy?'],
          ['休み', 'やすみ (yasumi)', 'noun', 'ngày nghỉ, kỳ nghỉ', '日曜日は休みです。', 'Chủ nhật là ngày nghỉ.'],
        ],
        grammar: {
          title: 'Thứ ngày: N に + động từ; 何曜日ですか',
          explain: 'Trợ từ に đứng sau từ chỉ thời điểm cụ thể (thứ, giờ, ngày tháng) để nói việc xảy ra lúc nào: 月曜日に学校へ行きます. Hỏi thứ: 今日は何曜日ですか — 水曜日です. Hỏi tháng: 何月 (nangatsu), hỏi ngày: 何日 (nannichi). Với 今日, 明日, 昨日 không dùng に: 明日行きます.',
          examples: [
            ['月曜日に学校へ行きます。', 'Thứ Hai tôi đi đến trường.', 'Getsuyōbi ni gakkō e ikimasu.'],
            ['今日は何曜日ですか。', 'Hôm nay là thứ mấy?', 'Kyō wa nanyōbi desu ka.'],
            ['誕生日は何月ですか。', 'Sinh nhật bạn vào tháng mấy?', 'Tanjōbi wa nangatsu desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、今日は何曜日ですか。', 'Xin lỗi, hôm nay là thứ mấy ạ?', 'Sumimasen, kyō wa nanyōbi desu ka.'],
            ['田中', '今日は水曜日です。', 'Hôm nay là thứ Tư.', 'Kyō wa suiyōbi desu.'],
            ['リン', '田中さんの誕生日は何月ですか。', 'Sinh nhật anh Tanaka vào tháng mấy ạ?', 'Tanaka-san no tanjōbi wa nangatsu desu ka.'],
            ['田中', '私の誕生日は十二月です。', 'Sinh nhật tôi vào tháng Mười hai.', 'Watashi no tanjōbi wa jūnigatsu desu.'],
          ],
        },
        reorder: [
          ['今日|は|何曜日|です|か|。', 'Hôm nay là thứ mấy?'],
          ['月曜日|に|学校|へ|行きます|。', 'Thứ Hai tôi đi đến trường.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Thứ Hai tôi đi đến trường” bằng mẫu N に + động từ.', source: '月曜日 / 学校 / 行きます', pattern: 'thời điểm + に + địa điểm + へ + động từ', answers: ['月曜日に学校へ行きます。', '月曜日に学校へ行きます'] },
          { prompt: 'Hỏi “Hôm nay là thứ mấy?”.', source: '今日 / 何曜日', pattern: '今日は何曜日ですか。', answers: ['今日は何曜日ですか。', '今日は何曜日ですか'] },
        ],
        tip: ['Quy ước đọc ngày', 'Ngày trong tháng có cách đọc riêng: 一日 (ついたち), 二日 (ふつか), 三日 (みっか)… Hãy học thuộc từ 1 đến 10 vì chúng bất quy tắc.'],
      },
      {
        title: { vi: 'Thời tiết và bốn mùa', en: 'Weather and Seasons' },
        intro: 'Người Nhật rất hay bắt chuyện bằng thời tiết. Bài này giúp bạn nói trời nóng, lạnh, mưa, nắng và hỏi hôm nay thời tiết thế nào.',
        vocab: [
          ['天気', 'てんき (tenki)', 'noun', 'thời tiết', '今日は天気がいいです。', 'Hôm nay thời tiết đẹp.'],
          ['晴れ', 'はれ (hare)', 'noun', 'trời nắng, trời quang', '明日は晴れです。', 'Ngày mai trời nắng.'],
          ['雨', 'あめ (ame)', 'noun', 'mưa', '昨日は雨でした。', 'Hôm qua trời mưa.'],
          ['曇り', 'くもり (kumori)', 'noun', 'trời nhiều mây', '今日は曇りです。', 'Hôm nay trời nhiều mây.'],
          ['暑い', 'あつい (atsui)', 'i-adjective', 'nóng (thời tiết)', '夏は暑いです。', 'Mùa hè trời nóng.'],
          ['寒い', 'さむい (samui)', 'i-adjective', 'lạnh (thời tiết)', '冬は寒いです。', 'Mùa đông trời lạnh.'],
          ['暖かい', 'あたたかい (atatakai)', 'i-adjective', 'ấm áp', '春は暖かいです。', 'Mùa xuân thì ấm áp.'],
          ['涼しい', 'すずしい (suzushii)', 'i-adjective', 'mát mẻ', '秋は涼しいです。', 'Mùa thu thì mát mẻ.'],
          ['春', 'はる (haru)', 'noun', 'mùa xuân', '春に桜が咲きます。', 'Mùa xuân hoa anh đào nở.'],
          ['夏', 'なつ (natsu)', 'noun', 'mùa hè', '夏に海へ行きます。', 'Mùa hè tôi đi biển.'],
          ['秋', 'あき (aki)', 'noun', 'mùa thu', '秋は果物がおいしいです。', 'Mùa thu hoa quả rất ngon.'],
          ['冬', 'ふゆ (fuyu)', 'noun', 'mùa đông', '冬は雪が降ります。', 'Mùa đông tuyết rơi.'],
        ],
        grammar: {
          title: 'Tính từ い + です; 〜が降ります',
          explain: 'Tính từ đuôi い đứng trước です để nói về trạng thái: 夏は暑いです. Phủ định: bỏ い thêm くないです (暑くないです). Quá khứ: かったです (暑かったです). Mưa và tuyết dùng động từ 降ります: 雨が降ります, 雪が降ります, với trợ từ が. Hỏi thời tiết: 今日の天気はどうですか。',
          examples: [
            ['夏は暑いです。', 'Mùa hè trời nóng.', 'Natsu wa atsui desu.'],
            ['冬は雪が降ります。', 'Mùa đông tuyết rơi.', 'Fuyu wa yuki ga furimasu.'],
            ['今日の天気はどうですか。', 'Thời tiết hôm nay thế nào?', 'Kyō no tenki wa dō desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '今日の天気はどうですか。', 'Thời tiết hôm nay thế nào ạ?', 'Kyō no tenki wa dō desu ka.'],
            ['田中', '今日は曇りです。少し寒いです。', 'Hôm nay trời nhiều mây. Hơi lạnh.', 'Kyō wa kumori desu. Sukoshi samui desu.'],
            ['リン', '明日はどうですか。', 'Còn ngày mai thì sao ạ?', 'Ashita wa dō desu ka.'],
            ['田中', '明日は晴れです。暖かいです。', 'Ngày mai trời nắng. Ấm áp.', 'Ashita wa hare desu. Atatakai desu.'],
          ],
        },
        reorder: [
          ['夏|は|暑い|です|。', 'Mùa hè trời nóng.'],
          ['今日|の|天気|は|どう|です|か|。', 'Thời tiết hôm nay thế nào?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Mùa đông trời lạnh” bằng tính từ い.', source: '冬 / 寒い', pattern: 'N は + tính từ い + です', answers: ['冬は寒いです。', '冬は寒いです'] },
          { prompt: 'Nói “Mùa đông tuyết rơi”.', source: '冬 / 雪 / 降ります', pattern: 'N は + N が降ります', answers: ['冬は雪が降ります。', '冬は雪が降ります'] },
        ],
        tip: ['Cẩn thận 暑い và 熱い', '暑い (atsui) chỉ thời tiết hoặc không khí nóng, còn 熱い (atsui) chỉ vật nóng như trà, nước tắm. Cùng cách đọc nhưng khác chữ Hán và nghĩa.'],
      },
      {
        title: { vi: 'Quần áo và màu sắc', en: 'Clothes and Colours' },
        intro: 'Bạn đang chọn đồ trong cửa hàng hoặc tả người đang mặc gì. Bài này dạy tên quần áo, màu sắc và ba động từ “mặc” khác nhau tuỳ bộ phận cơ thể.',
        vocab: [
          ['服', 'ふく (fuku)', 'noun', 'quần áo', 'この服はきれいです。', 'Bộ quần áo này đẹp.'],
          ['ズボン', 'ずぼん (zubon)', 'noun', 'quần dài', '黒いズボンを買います。', 'Tôi mua một chiếc quần màu đen.'],
          ['帽子', 'ぼうし (bōshi)', 'noun', 'mũ', '帽子をかぶります。', 'Tôi đội mũ.'],
          ['赤い', 'あかい (akai)', 'i-adjective', 'màu đỏ', '赤い服が好きです。', 'Tôi thích quần áo màu đỏ.'],
          ['青い', 'あおい (aoi)', 'i-adjective', 'màu xanh dương', '空は青いです。', 'Bầu trời màu xanh.'],
          ['白い', 'しろい (shiroi)', 'i-adjective', 'màu trắng', '白いシャツを着ます。', 'Tôi mặc áo sơ mi trắng.'],
          ['黒い', 'くろい (kuroi)', 'i-adjective', 'màu đen', '黒い靴を買います。', 'Tôi mua đôi giày màu đen.'],
          ['着ます', 'きます (kimasu)', 'verb', 'mặc (áo)', '毎日制服を着ます。', 'Mỗi ngày tôi mặc đồng phục.'],
          ['はきます', 'はきます (hakimasu)', 'verb', 'mặc (quần), đi (giày)', '新しい靴をはきます。', 'Tôi đi đôi giày mới.'],
          ['かぶります', 'かぶります (kaburimasu)', 'verb', 'đội (mũ)', '夏は帽子をかぶります。', 'Mùa hè tôi đội mũ.'],
          ['制服', 'せいふく (seifuku)', 'noun', 'đồng phục', '学校では制服を着ます。', 'Ở trường tôi mặc đồng phục.'],
          ['色', 'いろ (iro)', 'noun', 'màu sắc', '好きな色は何ですか。', 'Màu bạn thích là gì?'],
        ],
        grammar: {
          title: 'N を 着ます / はきます / かぶります; tính từ い + danh từ',
          explain: 'Tiếng Nhật dùng động từ khác nhau cho từng loại đồ: 着ます (áo, bộ đồ), はきます (quần, giày, tất), かぶります (mũ). Tân ngữ đi với trợ từ を. Tính từ い đứng ngay trước danh từ để bổ nghĩa: 赤い服 (quần áo đỏ), 黒い靴 (giày đen). Hỏi màu: 何色ですか; hỏi màu thích: 好きな色は何ですか。',
          examples: [
            ['白いシャツを着ます。', 'Tôi mặc áo sơ mi trắng.', 'Shiroi shatsu o kimasu.'],
            ['新しい靴をはきます。', 'Tôi đi đôi giày mới.', 'Atarashii kutsu o hakimasu.'],
            ['好きな色は何ですか。', 'Màu bạn thích là gì?', 'Sukina iro wa nan desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['店員', 'いらっしゃいませ。何をお探しですか。', 'Xin chào quý khách. Bạn đang tìm gì ạ?', 'Irasshaimase. Nani o osagashi desu ka.'],
            ['リン', '黒いズボンを探しています。', 'Tôi đang tìm một chiếc quần màu đen.', 'Kuroi zubon o sagashite imasu.'],
            ['店員', 'こちらはどうですか。', 'Chiếc này thì sao ạ?', 'Kochira wa dō desu ka.'],
            ['リン', 'いいですね。それと、白いシャツも買います。', 'Đẹp nhỉ. Và tôi cũng mua một chiếc áo sơ mi trắng.', 'Ii desu ne. Sore to, shiroi shatsu mo kaimasu.'],
          ],
        },
        reorder: [
          ['白い|シャツ|を|着ます|。', 'Tôi mặc áo sơ mi trắng.'],
          ['好きな|色|は|何|です|か|。', 'Màu bạn thích là gì?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi mặc áo sơ mi trắng”.', source: '白い / シャツ', pattern: 'tính từ い + N を 着ます', answers: ['白いシャツを着ます。', '白いシャツを着ます'] },
          { prompt: 'Nói “Tôi đi đôi giày mới”.', source: '新しい / 靴', pattern: 'N を はきます', answers: ['新しい靴をはきます。', '新しい靴をはきます'] },
        ],
        tip: ['Ba động từ “mặc”', 'Tiếng Việt chỉ cần “mặc/đội/đi”, nhưng tiếng Nhật còn phân biệt theo phần cơ thể: thân trên 着ます, thân dưới và chân はきます, đầu かぶります, kính かけます.'],
      },
    ],
  },
  {
    level: 'N5',
    names: { vi: 'Ăn ngoài và mua thực phẩm', en: 'Eating Out and Groceries' },
    lessons: [
      {
        title: { vi: 'Gọi món ở nhà hàng', en: 'Ordering at a Restaurant' },
        intro: 'Bạn bước vào quán ăn Nhật và muốn gọi món lịch sự. Sau bài này bạn biết xem thực đơn, gọi món bằng ください và hỏi nhân viên bằng mẫu おすすめ.',
        vocab: [
          ['メニュー', 'めにゅー (menyū)', 'noun', 'thực đơn', 'メニューをお願いします。', 'Cho tôi xin thực đơn.'],
          ['ラーメン', 'らーめん (rāmen)', 'noun', 'mì ramen', 'ラーメンが好きです。', 'Tôi thích mì ramen.'],
          ['ケーキ', 'けーき (kēki)', 'noun', 'bánh ngọt', 'ケーキを食べます。', 'Tôi ăn bánh ngọt.'],
          ['注文します', 'ちゅうもんします (chūmon shimasu)', 'verb', 'gọi món, đặt hàng', 'ラーメンを注文します。', 'Tôi gọi mì ramen.'],
          ['お会計', 'おかいけい (okaikei)', 'noun', 'thanh toán, hoá đơn', 'お会計をお願いします。', 'Cho tôi thanh toán.'],
          ['一つ', 'ひとつ (hitotsu)', 'counter', 'một cái', 'コーヒーを一つください。', 'Cho tôi một ly cà phê.'],
          ['二つ', 'ふたつ (futatsu)', 'counter', 'hai cái', 'ケーキを二つください。', 'Cho tôi hai chiếc bánh.'],
          ['おすすめ', 'おすすめ (osusume)', 'noun', 'món gợi ý', 'おすすめは何ですか。', 'Món gợi ý là gì ạ?'],
          ['定食', 'ていしょく (teishoku)', 'noun', 'suất ăn (cơm kèm món)', '魚の定食をください。', 'Cho tôi suất cơm cá.'],
          ['お水', 'おみず (omizu)', 'noun', 'nước lọc', 'お水をください。', 'Cho tôi xin nước lọc.'],
          ['辛い', 'からい (karai)', 'i-adjective', 'cay', 'このラーメンは辛いです。', 'Món mì ramen này cay.'],
          ['甘い', 'あまい (amai)', 'i-adjective', 'ngọt', 'このケーキは甘いです。', 'Chiếc bánh này ngọt.'],
        ],
        grammar: {
          title: 'N を ください / N を お願いします / 数 + ください',
          explain: 'Để gọi món, dùng N をください hoặc N をお願いします (lịch sự hơn). Khi muốn số lượng, đặt số lượng sau tên món và trước ください: ケーキを二つください. Hỏi gợi ý: おすすめは何ですか. Trả lời nhân viên: はい、おねがいします / いいえ、けっこうです (không, cảm ơn).',
          examples: [
            ['ラーメンをください。', 'Cho tôi một tô ramen.', 'Rāmen o kudasai.'],
            ['ケーキを二つください。', 'Cho tôi hai chiếc bánh.', 'Kēki o futatsu kudasai.'],
            ['おすすめは何ですか。', 'Món gợi ý là gì ạ?', 'Osusume wa nan desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['店員', 'いらっしゃいませ。ご注文は？', 'Xin chào quý khách. Quý khách gọi gì ạ?', 'Irasshaimase. Go-chūmon wa?'],
            ['リン', 'おすすめは何ですか。', 'Món gợi ý là gì ạ?', 'Osusume wa nan desu ka.'],
            ['店員', '魚の定食がおすすめです。', 'Món gợi ý là suất cơm cá.', 'Sakana no teishoku ga osusume desu.'],
            ['リン', 'じゃあ、魚の定食をください。お水もお願いします。', 'Vậy cho tôi suất cơm cá. Cho tôi thêm nước lọc nữa.', 'Jā, sakana no teishoku o kudasai. Omizu mo onegaishimasu.'],
          ],
        },
        reorder: [
          ['ラーメン|を|ください|。', 'Cho tôi một tô ramen.'],
          ['おすすめ|は|何|です|か|。', 'Món gợi ý là gì ạ?'],
        ],
        grammarQ: [
          { prompt: 'Gọi hai chiếc bánh ngọt.', source: 'ケーキ / 二つ', pattern: 'N を + số lượng + ください', answers: ['ケーキを二つください。', 'ケーキを二つください'] },
          { prompt: 'Xin thanh toán lịch sự.', source: 'お会計', pattern: 'お会計をお願いします。', answers: ['お会計をお願いします。', 'お会計をお願いします'] },
        ],
        tip: ['Văn hoá ăn uống', 'Ở Nhật không phải boa tiền. Trước khi ăn nói いただきます, ăn xong nói ごちそうさまでした để cảm ơn.'],
      },
      {
        title: { vi: 'Mua đồ ở siêu thị (đếm đồ vật)', en: 'Shopping at the Supermarket' },
        intro: 'Bạn đi siêu thị mua trứng, sữa, trái cây và cần nói số lượng. Bài này dạy các từ đếm cơ bản 〜個, 〜枚, 〜本 và cách hỏi số lượng bằng いくつ.',
        vocab: [
          ['卵', 'たまご (tamago)', 'noun', 'trứng', '卵を六個ください。', 'Cho tôi sáu quả trứng.'],
          ['牛乳', 'ぎゅうにゅう (gyūnyū)', 'noun', 'sữa bò', '牛乳を一本買います。', 'Tôi mua một chai sữa.'],
          ['りんご', 'りんご (ringo)', 'noun', 'quả táo', 'りんごを三つください。', 'Cho tôi ba quả táo.'],
          ['みかん', 'みかん (mikan)', 'noun', 'quả quýt', 'みかんは冬においしいです。', 'Quýt ngon vào mùa đông.'],
          ['個', 'こ (ko)', 'counter', 'cái (vật nhỏ)', '卵を六個買います。', 'Tôi mua sáu quả trứng.'],
          ['枚', 'まい (mai)', 'counter', 'tờ, tấm (vật mỏng)', '切手を二枚ください。', 'Cho tôi hai con tem.'],
          ['本', 'ほん (hon)', 'counter', 'chai, cây (vật dài)', 'ジュースを二本買います。', 'Tôi mua hai chai nước ép.'],
          ['いくつ', 'いくつ (ikutsu)', 'pronoun', 'mấy cái', 'りんごはいくつ要りますか。', 'Bạn cần mấy quả táo?'],
          ['袋', 'ふくろ (fukuro)', 'noun', 'cái túi', '袋はいりません。', 'Tôi không cần túi.'],
          ['ジュース', 'じゅーす (jūsu)', 'noun', 'nước ép, nước ngọt', 'ジュースを買います。', 'Tôi mua nước ép.'],
          ['要ります', 'いります (irimasu)', 'verb', 'cần, phải có', '袋が要ります。', 'Tôi cần một cái túi.'],
          ['全部で', 'ぜんぶで (zenbu de)', 'adverb', 'tất cả là', '全部で千円です。', 'Tổng cộng là một nghìn yên.'],
        ],
        grammar: {
          title: 'Số đếm + từ đếm: 〜個, 〜枚, 〜本',
          explain: 'Khi mua đồ, đặt số lượng sau tân ngữ: N を + số + từ đếm + ください. Chọn từ đếm theo hình dạng: 個 cho vật nhỏ tròn, 枚 cho vật mỏng, phẳng, 本 cho vật dài. Với số 1–10 của vật chung chung có thể dùng ひとつ, ふたつ, みっつ… Hỏi số lượng: いくつですか; hỏi tổng: 全部でいくらですか。',
          examples: [
            ['卵を六個ください。', 'Cho tôi sáu quả trứng.', 'Tamago o rokko kudasai.'],
            ['ジュースを二本買います。', 'Tôi mua hai chai nước ép.', 'Jūsu o nihon kaimasu.'],
            ['全部でいくらですか。', 'Tổng cộng là bao nhiêu?', 'Zenbu de ikura desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、卵はありますか。', 'Xin lỗi, bạn có trứng không ạ?', 'Sumimasen, tamago wa arimasu ka.'],
            ['店員', 'はい、あります。いくつ要りますか。', 'Vâng, có ạ. Bạn cần mấy quả?', 'Hai, arimasu. Ikutsu irimasu ka.'],
            ['リン', '六個ください。それから、牛乳を一本お願いします。', 'Cho tôi sáu quả. Và một chai sữa nữa.', 'Rokko kudasai. Sorekara, gyūnyū o ippon onegaishimasu.'],
            ['店員', '全部で四百円です。袋は要りますか。', 'Tổng cộng bốn trăm yên. Bạn có cần túi không ạ?', 'Zenbu de yonhyaku en desu. Fukuro wa irimasu ka.'],
          ],
        },
        reorder: [
          ['卵|を|六個|ください|。', 'Cho tôi sáu quả trứng.'],
          ['全部で|いくら|です|か|。', 'Tổng cộng là bao nhiêu?'],
        ],
        grammarQ: [
          { prompt: 'Mua hai chai nước ép.', source: 'ジュース / 二本', pattern: 'N を + số + 本 + 買います', answers: ['ジュースを二本買います。', 'ジュースを二本買います'] },
          { prompt: 'Hỏi tổng cộng bao nhiêu tiền.', source: '全部で / いくら', pattern: '全部でいくらですか。', answers: ['全部でいくらですか。', '全部でいくらですか'] },
        ],
        tip: ['Từ đếm biến âm', 'Một số từ đếm đổi âm theo số: 一本 (いっぽん), 二本 (にほん), 三本 (さんぼん). Hãy học theo cụm để quen tai.'],
      },
      {
        title: { vi: 'So sánh món ăn và khẩu vị', en: 'Tastes and Preferences' },
        intro: 'Bạn nói món nào bạn thích hơn, ngon nhất hay khó ăn. Bài này dạy các vị cơ bản và mẫu so sánh AよりBのほうが〜です cùng いちばん.',
        vocab: [
          ['酸っぱい', 'すっぱい (suppai)', 'i-adjective', 'chua', 'レモンは酸っぱいです。', 'Chanh thì chua.'],
          ['熱い', 'あつい (atsui)', 'i-adjective', 'nóng (đồ vật, đồ ăn)', 'このお茶は熱いです。', 'Trà này nóng.'],
          ['冷たい', 'つめたい (tsumetai)', 'i-adjective', 'lạnh (đồ vật, đồ uống)', '冷たいジュースが好きです。', 'Tôi thích nước ép lạnh.'],
          ['まずい', 'まずい (mazui)', 'i-adjective', 'dở', 'このスープはまずいです。', 'Món súp này dở.'],
          ['好き', 'すき (suki)', 'na-adjective', 'thích', 'ラーメンが好きです。', 'Tôi thích mì ramen.'],
          ['嫌い', 'きらい (kirai)', 'na-adjective', 'ghét, không thích', '野菜が嫌いです。', 'Tôi không thích rau.'],
          ['いちばん', 'いちばん (ichiban)', 'adverb', 'nhất', '果物でりんごがいちばん好きです。', 'Trong các loại trái cây tôi thích táo nhất.'],
          ['より', 'より (yori)', 'particle', 'hơn (so với)', '肉より魚が好きです。', 'Tôi thích cá hơn thịt.'],
          ['ほうが', 'ほうが (hō ga)', 'phrase', 'bên … thì … hơn', '紅茶よりコーヒーのほうが好きです。', 'Tôi thích cà phê hơn trà đen.'],
          ['果物', 'くだもの (kudamono)', 'noun', 'trái cây', '果物は体にいいです。', 'Trái cây tốt cho cơ thể.'],
          ['お菓子', 'おかし (okashi)', 'noun', 'bánh kẹo', 'お菓子は甘いです。', 'Bánh kẹo thì ngọt.'],
          ['スープ', 'すーぷ (sūpu)', 'noun', 'món súp', '熱いスープを飲みます。', 'Tôi uống món súp nóng.'],
        ],
        grammar: {
          title: 'AよりBのほうが〜です / 〜でNがいちばん〜です',
          explain: 'So sánh hai vật: AよりBのほうが + tính từ + です (B … hơn A). Hỏi: AとBとどちらが好きですか。 So sánh nhất trong nhóm: Nで + Xがいちばん + tính từ (果物でりんごがいちばん好きです). Với 好き, 嫌い (tính từ な) dùng trợ từ が cho đối tượng ưa thích: ラーメンが好きです。',
          examples: [
            ['肉より魚のほうが好きです。', 'Tôi thích cá hơn thịt.', 'Niku yori sakana no hō ga suki desu.'],
            ['果物でりんごがいちばん好きです。', 'Trong các loại trái cây, tôi thích táo nhất.', 'Kudamono de ringo ga ichiban suki desu.'],
            ['コーヒーと紅茶とどちらが好きですか。', 'Cà phê và trà đen, bạn thích cái nào hơn?', 'Kōhī to kōcha to dochira ga suki desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '田中さんは肉と魚とどちらが好きですか。', 'Anh Tanaka thích thịt hay cá hơn ạ?', 'Tanaka-san wa niku to sakana to dochira ga suki desu ka.'],
            ['田中', '肉より魚のほうが好きです。', 'Tôi thích cá hơn thịt.', 'Niku yori sakana no hō ga suki desu.'],
            ['リン', '果物は何がいちばん好きですか。', 'Anh thích loại trái cây nào nhất ạ?', 'Kudamono wa nani ga ichiban suki desu ka.'],
            ['田中', 'りんごです。酸っぱくないですから。', 'Là táo. Vì nó không chua.', 'Ringo desu. Suppaku nai desu kara.'],
          ],
        },
        reorder: [
          ['肉|より|魚|の|ほうが|好き|です|。', 'Tôi thích cá hơn thịt.'],
          ['果物|で|りんご|が|いちばん|好き|です|。', 'Trong các loại trái cây, tôi thích táo nhất.'],
        ],
        grammarQ: [
          { prompt: 'Nói thích cá hơn thịt.', source: '肉 / 魚', pattern: 'AよりBのほうが好きです', answers: ['肉より魚のほうが好きです。', '肉より魚のほうが好きです', '肉より魚の方が好きです。'] },
          { prompt: 'Nói trong trái cây bạn thích táo nhất.', source: '果物 / りんご', pattern: 'Nで + X がいちばん好きです', answers: ['果物でりんごがいちばん好きです。', '果物でりんごがいちばん好きです'] },
        ],
        tip: ['Ngoại lệ に phủ định', 'Khi nói “không thích”, dùng 好きじゃないです hoặc 嫌いです; 好きくないです là sai vì 好き là tính từ な, không chia như tính từ い.'],
      },
    ],
  },
  {
    level: 'N5',
    names: { vi: 'Hoạt động hằng ngày', en: 'Everyday Activities' },
    lessons: [
      {
        title: { vi: 'Làm gì ở đâu (場所で〜ます)', en: 'Doing Things in Places' },
        intro: 'Bạn kể mình học bài ở thư viện, đọc báo ở nhà hay tập thể dục ở công viên. Bài này dạy trợ từ で chỉ nơi diễn ra hành động và các động từ đời thường.',
        vocab: [
          ['図書館', 'としょかん (toshokan)', 'noun', 'thư viện', '図書館で本を読みます。', 'Tôi đọc sách ở thư viện.'],
          ['公園', 'こうえん (kōen)', 'noun', 'công viên', '公園で運動します。', 'Tôi tập thể dục ở công viên.'],
          ['会社', 'かいしゃ (kaisha)', 'noun', 'công ty', '会社で働きます。', 'Tôi làm việc ở công ty.'],
          ['学校', 'がっこう (gakkō)', 'noun', 'trường học', '学校で日本語を勉強します。', 'Tôi học tiếng Nhật ở trường.'],
          ['運動します', 'うんどうします (undō shimasu)', 'verb', 'tập thể dục', '毎朝運動します。', 'Mỗi sáng tôi tập thể dục.'],
          ['書きます', 'かきます (kakimasu)', 'verb', 'viết', '手紙を書きます。', 'Tôi viết thư.'],
          ['聞きます', 'ききます (kikimasu)', 'verb', 'nghe, hỏi', '音楽を聞きます。', 'Tôi nghe nhạc.'],
          ['話します', 'はなします (hanashimasu)', 'verb', 'nói chuyện', '友達と話します。', 'Tôi nói chuyện với bạn.'],
          ['手紙', 'てがみ (tegami)', 'noun', 'lá thư', '母に手紙を書きます。', 'Tôi viết thư cho mẹ.'],
          ['新聞', 'しんぶん (shinbun)', 'noun', 'tờ báo', '朝、新聞を読みます。', 'Buổi sáng tôi đọc báo.'],
          ['宿題', 'しゅくだい (shukudai)', 'noun', 'bài tập về nhà', '家で宿題をします。', 'Tôi làm bài tập ở nhà.'],
          ['よく', 'よく (yoku)', 'adverb', 'thường xuyên', 'よく図書館へ行きます。', 'Tôi hay đến thư viện.'],
        ],
        grammar: {
          title: 'N で + động từ (nơi diễn ra hành động)',
          explain: 'Trợ từ で đứng sau danh từ chỉ nơi để nói hành động diễn ra ở đó: 図書館で本を読みます (đọc sách ở thư viện). Đừng nhầm với へ/に dùng cho nơi đến (学校へ行きます) và に dùng cho nơi tồn tại (家にいます). Công thức: nơi + で + tân ngữ + を + động từ.',
          examples: [
            ['図書館で本を読みます。', 'Tôi đọc sách ở thư viện.', 'Toshokan de hon o yomimasu.'],
            ['公園で運動します。', 'Tôi tập thể dục ở công viên.', 'Kōen de undō shimasu.'],
            ['家で宿題をします。', 'Tôi làm bài tập ở nhà.', 'Ie de shukudai o shimasu.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '田中さんは日曜日に何をしますか。', 'Chủ nhật anh Tanaka làm gì ạ?', 'Tanaka-san wa nichiyōbi ni nani o shimasu ka.'],
            ['田中', '公園で運動します。それから、図書館で本を読みます。', 'Tôi tập thể dục ở công viên. Sau đó đọc sách ở thư viện.', 'Kōen de undō shimasu. Sorekara, toshokan de hon o yomimasu.'],
            ['リン', 'いいですね。私は家で宿題をします。', 'Hay nhỉ. Tôi thì làm bài tập ở nhà.', 'Ii desu ne. Watashi wa ie de shukudai o shimasu.'],
            ['田中', '毎日勉強しますか。', 'Bạn có học mỗi ngày không?', 'Mainichi benkyō shimasu ka.'],
          ],
        },
        reorder: [
          ['図書館|で|本|を|読みます|。', 'Tôi đọc sách ở thư viện.'],
          ['公園|で|運動します|。', 'Tôi tập thể dục ở công viên.'],
        ],
        grammarQ: [
          { prompt: 'Nói đọc sách ở thư viện.', source: '図書館 / 本 / 読みます', pattern: 'nơi + で + N + を + động từ', answers: ['図書館で本を読みます。', '図書館で本を読みます'] },
          { prompt: 'Nói làm bài tập ở nhà.', source: '家 / 宿題', pattern: 'nơi + で + N + を + します', answers: ['家で宿題をします。', '家で宿題をします'] },
        ],
        tip: ['で hay に?', 'Hỏi bản thân: hành động diễn ra ở đó (で) hay chỉ tồn tại ở đó (に)? “Ăn ở nhà hàng” là で, “có nhà hàng ở đó” là に.'],
      },
      {
        title: { vi: 'Rủ rê và hẹn hò (〜ませんか・〜ましょう)', en: 'Inviting and Making Plans' },
        intro: 'Bạn muốn rủ bạn đi xem phim hoặc đi ăn tối cuối tuần. Bài này dạy hai mẫu lịch sự dùng nhiều nhất: 〜ませんか để mời và 〜ましょう để đề nghị cùng làm.',
        vocab: [
          ['誘います', 'さそいます (sasoimasu)', 'verb', 'rủ, mời', '友達を映画に誘います。', 'Tôi rủ bạn đi xem phim.'],
          ['約束', 'やくそく (yakusoku)', 'noun', 'lời hẹn, lời hứa', '土曜日に約束があります。', 'Thứ Bảy tôi có hẹn.'],
          ['待ちます', 'まちます (machimasu)', 'verb', 'đợi, chờ', '駅で友達を待ちます。', 'Tôi đợi bạn ở nhà ga.'],
          ['遊びます', 'あそびます (asobimasu)', 'verb', 'chơi', '公園で遊びます。', 'Tôi chơi ở công viên.'],
          ['買い物', 'かいもの (kaimono)', 'noun', 'việc mua sắm', '日曜日に買い物をします。', 'Chủ nhật tôi đi mua sắm.'],
          ['パーティー', 'ぱーてぃー (pātī)', 'noun', 'bữa tiệc', '土曜日にパーティーがあります。', 'Thứ Bảy có một bữa tiệc.'],
          ['いいですね', 'いいですね (ii desu ne)', 'phrase', 'hay đấy nhỉ', 'いいですね、行きましょう。', 'Hay nhỉ, cùng đi nào.'],
          ['すみませんが', 'すみませんが (sumimasen ga)', 'phrase', 'xin lỗi nhưng…', 'すみませんが、その日は都合が悪いです。', 'Xin lỗi, hôm đó tôi không tiện.'],
          ['都合', 'つごう (tsugō)', 'noun', 'hoàn cảnh, sự thuận tiện', '都合はどうですか。', 'Bạn có tiện không?'],
          ['また今度', 'またこんど (mata kondo)', 'phrase', 'lần sau nhé', 'また今度お願いします。', 'Hẹn lần sau nhé.'],
          ['何時', 'なんじ (nanji)', 'noun', 'mấy giờ', '何時に会いますか。', 'Mấy giờ chúng ta gặp?'],
          ['どこで', 'どこで (doko de)', 'adverb', 'ở đâu (nơi hành động)', 'どこで会いますか。', 'Chúng ta gặp ở đâu?'],
        ],
        grammar: {
          title: '〜ませんか (mời) / 〜ましょう (rủ cùng làm)',
          explain: 'Dùng động từ ます bỏ ます thêm ませんか để mời lịch sự: 映画を見ませんか (bạn xem phim không?). Dùng 〜ましょう khi cả hai cùng làm, thường để đáp lại lời mời hoặc chốt kế hoạch: 行きましょう (đi nào). Từ chối nhẹ: すみませんが、ちょっと… hoặc すみませんが、その日は都合が悪いです。',
          examples: [
            ['いっしょに映画を見ませんか。', 'Cùng đi xem phim không?', 'Issho ni eiga o mimasen ka.'],
            ['いいですね、行きましょう。', 'Hay nhỉ, cùng đi nào.', 'Ii desu ne, ikimashō.'],
            ['何時に会いましょうか。', 'Chúng ta gặp lúc mấy giờ nhỉ?', 'Nanji ni aimashō ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '田中さん、土曜日にいっしょに映画を見ませんか。', 'Anh Tanaka, thứ Bảy cùng đi xem phim không ạ?', 'Tanaka-san, doyōbi ni issho ni eiga o mimasen ka.'],
            ['田中', 'いいですね。何時に会いましょうか。', 'Hay đấy. Chúng ta gặp lúc mấy giờ nhỉ?', 'Ii desu ne. Nanji ni aimashō ka.'],
            ['リン', '二時に駅で会いましょう。', 'Hai giờ gặp ở nhà ga nhé.', 'Niji ni eki de aimashō.'],
            ['田中', 'はい、わかりました。駅で待ちます。', 'Vâng, tôi hiểu rồi. Tôi sẽ đợi ở nhà ga.', 'Hai, wakarimashita. Eki de machimasu.'],
          ],
        },
        reorder: [
          ['いっしょに|映画|を|見ませんか|。', 'Cùng đi xem phim không?'],
          ['何時|に|会いましょう|か|。', 'Chúng ta gặp lúc mấy giờ nhỉ?'],
        ],
        grammarQ: [
          { prompt: 'Mời bạn cùng đi xem phim bằng ませんか.', source: 'いっしょに / 映画 / 見ます', pattern: 'いっしょに + N を + 見ませんか', answers: ['いっしょに映画を見ませんか。', 'いっしょに映画を見ませんか', '一緒に映画を見ませんか。'] },
          { prompt: 'Đề nghị gặp lúc mấy giờ bằng ましょうか.', source: '何時 / 会います', pattern: '何時に会いましょうか', answers: ['何時に会いましょうか。', '何時に会いましょうか'] },
        ],
        tip: ['Từ chối khéo', 'Người Nhật hiếm khi nói thẳng いいえ. Họ nói ちょっと… (hơi khó) rồi dừng lại, người nghe hiểu là từ chối.'],
      },
      {
        title: { vi: 'Sở thích và khả năng (上手・下手)', en: 'Hobbies and Abilities' },
        intro: 'Bạn kể mình giỏi hoặc kém thứ gì, thích chơi nhạc cụ hay thể thao nào. Bài này dạy 上手 / 下手 cùng các động từ sở thích và trợ từ が đi kèm.',
        vocab: [
          ['趣味', 'しゅみ (shumi)', 'noun', 'sở thích', '趣味は音楽です。', 'Sở thích của tôi là âm nhạc.'],
          ['上手', 'じょうず (jōzu)', 'na-adjective', 'giỏi', '田中さんは歌が上手です。', 'Anh Tanaka hát giỏi.'],
          ['下手', 'へた (heta)', 'na-adjective', 'kém, dở', '私は絵が下手です。', 'Tôi vẽ kém.'],
          ['歌', 'うた (uta)', 'noun', 'bài hát', '好きな歌があります。', 'Tôi có bài hát yêu thích.'],
          ['歌います', 'うたいます (utaimasu)', 'verb', 'hát', 'カラオケで歌います。', 'Tôi hát ở quán karaoke.'],
          ['泳ぎます', 'およぎます (oyogimasu)', 'verb', 'bơi', '夏は海で泳ぎます。', 'Mùa hè tôi bơi ở biển.'],
          ['弾きます', 'ひきます (hikimasu)', 'verb', 'chơi (nhạc cụ có dây/phím)', 'ピアノを弾きます。', 'Tôi chơi đàn piano.'],
          ['ピアノ', 'ぴあの (piano)', 'noun', 'đàn piano', 'ピアノが上手です。', 'Tôi chơi piano giỏi.'],
          ['スポーツ', 'すぽーつ (supōtsu)', 'noun', 'thể thao', 'スポーツが好きです。', 'Tôi thích thể thao.'],
          ['絵', 'え (e)', 'noun', 'bức tranh', '絵を見ます。', 'Tôi xem tranh.'],
          ['写真', 'しゃしん (shashin)', 'noun', 'ảnh', '旅行で写真を撮ります。', 'Khi đi du lịch tôi chụp ảnh.'],
          ['撮ります', 'とります (torimasu)', 'verb', 'chụp (ảnh)', '写真を撮ります。', 'Tôi chụp ảnh.'],
        ],
        grammar: {
          title: 'N が 上手/下手/好き です',
          explain: 'Để nói về khả năng và sở thích, dùng N が + 上手/下手/好き/嫌い + です, trong đó N là thứ bạn giỏi hoặc thích: 歌が上手です (hát giỏi), ピアノが下手です (chơi piano kém). Khi nói về bản thân, tránh khen mình bằng 上手 vì nghe tự đề cao; dùng 少しできます hoặc まあまあです để khiêm tốn. Hỏi sở thích: ご趣味は何ですか。',
          examples: [
            ['田中さんは歌が上手です。', 'Anh Tanaka hát giỏi.', 'Tanaka-san wa uta ga jōzu desu.'],
            ['私は絵が下手です。', 'Tôi vẽ kém.', 'Watashi wa e ga heta desu.'],
            ['ご趣味は何ですか。', 'Sở thích của bạn là gì?', 'Go-shumi wa nan desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'ご趣味は何ですか。', 'Sở thích của anh là gì ạ?', 'Go-shumi wa nan desu ka.'],
            ['田中', '音楽です。ピアノを弾きます。', 'Là âm nhạc. Tôi chơi đàn piano.', 'Ongaku desu. Piano o hikimasu.'],
            ['リン', 'すごいですね。ピアノが上手ですか。', 'Giỏi quá. Anh chơi piano giỏi không ạ?', 'Sugoi desu ne. Piano ga jōzu desu ka.'],
            ['田中', 'いいえ、まだ下手です。リンさんは？', 'Không, tôi vẫn còn kém. Còn Linh thì sao?', 'Iie, mada heta desu. Rin-san wa?'],
          ],
        },
        reorder: [
          ['私|は|絵|が|下手|です|。', 'Tôi vẽ kém.'],
          ['ご趣味|は|何|です|か|。', 'Sở thích của bạn là gì?'],
        ],
        grammarQ: [
          { prompt: 'Nói anh Tanaka hát giỏi.', source: '田中さん / 歌 / 上手', pattern: 'N は N が 上手です', answers: ['田中さんは歌が上手です。', '田中さんは歌が上手です'] },
          { prompt: 'Hỏi sở thích của người khác lịch sự.', source: '趣味 / 何', pattern: 'ご趣味は何ですか。', answers: ['ご趣味は何ですか。', 'ご趣味は何ですか', '趣味は何ですか。'] },
        ],
        tip: ['Đừng khen mình quá lời', 'Khi được khen, người Nhật thường đáp いいえ、まだまだです (không, tôi còn kém lắm). Đây là cách khiêm tốn rất thông dụng.'],
      },
    ],
  },
];
