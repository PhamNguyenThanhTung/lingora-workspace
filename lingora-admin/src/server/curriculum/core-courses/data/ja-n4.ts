import type { UnitSpec } from '../types.ts';

/**
 * Japanese N4 — Upper beginner. Can-do: give and follow instructions, ask permission, talk about plans,
 * experiences and opinions, compare things, and handle health, phone and workplace situations in polite Japanese.
 * Readings are "かな (romaji)". Dialogue and example lines are written without romaji — N4 learners read kana.
 */
export const JA_N4_UNITS: UnitSpec[] = [
  {
    level: 'N4',
    names: { vi: 'Thể て và yêu cầu', en: 'The て-form and Requests' },
    lessons: [
      {
        title: { vi: 'Nhờ và hướng dẫn (〜てください)', en: 'Requests and Instructions (~te kudasai)' },
        intro: 'Bạn cần nhờ người khác làm việc gì đó hoặc hướng dẫn họ. Bài này dạy thể て của ba nhóm động từ và mẫu 〜てください để yêu cầu lịch sự.',
        vocab: [
          ['待ちます', 'まちます (machimasu)', 'verb', 'đợi, chờ', 'ここで少し待ちます。', 'Tôi đợi ở đây một chút.'],
          ['書きます', 'かきます (kakimasu)', 'verb', 'viết', '名前を書きます。', 'Tôi viết tên.'],
          ['話します', 'はなします (hanashimasu)', 'verb', 'nói chuyện', '先生と日本語で話します。', 'Tôi nói chuyện bằng tiếng Nhật với thầy.'],
          ['教えます', 'おしえます (oshiemasu)', 'verb', 'dạy; chỉ cho', '駅までの道を教えます。', 'Tôi chỉ đường đến ga.'],
          ['見せます', 'みせます (misemasu)', 'verb', 'cho xem', '友達に写真を見せます。', 'Tôi cho bạn xem ảnh.'],
          ['貸します', 'かします (kashimasu)', 'verb', 'cho mượn', '友達にペンを貸します。', 'Tôi cho bạn mượn bút.'],
          ['借ります', 'かります (karimasu)', 'verb', 'mượn', '図書館で本を借ります。', 'Tôi mượn sách ở thư viện.'],
          ['使います', 'つかいます (tsukaimasu)', 'verb', 'sử dụng', 'このパソコンを使います。', 'Tôi dùng cái máy tính này.'],
          ['開けます', 'あけます (akemasu)', 'verb', 'mở', '窓を開けます。', 'Tôi mở cửa sổ.'],
          ['閉めます', 'しめます (shimemasu)', 'verb', 'đóng', 'ドアを閉めます。', 'Tôi đóng cửa.'],
        ],
        grammar: {
          title: 'Thể て và 〜てください',
          explain: 'Thể て được tạo theo nhóm động từ. Nhóm 1: 〜く→〜いて (書く→書いて, ngoại lệ 行く→行って), 〜ぐ→〜いで, 〜す→〜して, 〜う・つ・る→〜って, 〜ぬ・ぶ・む→〜んで. Nhóm 2: bỏ る thêm て (食べる→食べて). Nhóm 3: する→して, 来る→来て. Mẫu 〜てください nghĩa là “xin hãy…”, lịch sự nhưng vẫn là yêu cầu trực tiếp; để mềm hơn thêm すみませんが ở đầu câu.',
          examples: [
            ['ちょっと待ってください。', 'Xin hãy đợi một chút.'],
            ['ここに名前を書いてください。', 'Xin hãy viết tên vào đây.'],
            ['すみませんが、窓を開けてください。', 'Xin lỗi, hãy mở giúp tôi cái cửa sổ.'],
          ],
        },
        dialogue: {
          lines: [
            ['受付', 'こちらに名前を書いてください。', 'Xin hãy viết tên vào đây.'],
            ['リン', 'はい。ペンを貸してください。', 'Vâng. Cho tôi mượn bút với.'],
            ['受付', 'どうぞ。そして、ここで少し待ってください。', 'Xin mời. Rồi xin hãy đợi ở đây một chút.'],
            ['リン', 'わかりました。ありがとうございます。', 'Tôi hiểu rồi. Cảm ơn bạn.'],
          ],
        },
        reorder: [
          ['こちら|に|名前|を|書いてください|。', 'Xin hãy viết tên vào đây.'],
          ['ここ|で|少し|待ってください|。', 'Xin hãy đợi ở đây một chút.'],
        ],
        grammarQ: [
          { prompt: 'Nhờ người khác đợi một chút bằng 〜てください.', source: '待ちます', pattern: 'Vてください。', answers: ['ちょっと待ってください。', 'ちょっと待ってください', '少し待ってください。', '少し待ってください', '待ってください。', '待ってください'] },
          { prompt: 'Chia thể て và nhờ ai đó mở cửa sổ.', source: '窓 / 開けます', pattern: 'Vてください。', answers: ['窓を開けてください。', '窓を開けてください'] },
        ],
        tip: ['Mềm hơn với すみませんが', '〜てください khá thẳng. Trong công việc hoặc với người lớn tuổi, hãy mở đầu bằng すみませんが hoặc dùng 〜ていただけませんか (N3) để nhờ vả lịch sự hơn.'],
      },
      {
        title: { vi: 'Đang làm gì? (〜ています)', en: 'What Are You Doing? (~te imasu)', },
        intro: 'Bạn muốn nói ai đang làm gì ngay lúc này, hoặc ai đang sống ở đâu, làm nghề gì. Bài này dạy mẫu 〜ています với hai nghĩa: hành động đang diễn ra và trạng thái kéo dài.',
        vocab: [
          ['住みます', 'すみます (sumimasu)', 'verb', 'sống, cư trú', '東京に住みます。', 'Tôi sống ở Tokyo.'],
          ['知ります', 'しります (shirimasu)', 'verb', 'biết', '田中さんを知っています。', 'Tôi biết anh Tanaka.'],
          ['結婚します', 'けっこんします (kekkon shimasu)', 'verb', 'kết hôn', '姉は来年結婚します。', 'Năm sau chị tôi kết hôn.'],
          ['持ちます', 'もちます (mochimasu)', 'verb', 'cầm, mang, có', '傘を持ちます。', 'Tôi cầm ô.'],
          ['着ます', 'きます (kimasu)', 'verb', 'mặc (áo)', '白いシャツを着ます。', 'Tôi mặc áo sơ mi trắng.'],
          ['座ります', 'すわります (suwarimasu)', 'verb', 'ngồi', 'ここに座ります。', 'Tôi ngồi ở đây.'],
          ['立ちます', 'たちます (tachimasu)', 'verb', 'đứng', 'ドアの前に立ちます。', 'Tôi đứng trước cửa.'],
          ['作ります', 'つくります (tsukurimasu)', 'verb', 'làm, chế tạo', '母が料理を作ります。', 'Mẹ nấu ăn.'],
          ['歌います', 'うたいます (utaimasu)', 'verb', 'hát', '大きい声で歌います。', 'Tôi hát bằng giọng lớn.'],
          ['今', 'いま (ima)', 'noun', 'bây giờ', '今、何をしていますか。', 'Bây giờ bạn đang làm gì?'],
        ],
        grammar: {
          title: 'Vています: hành động đang diễn ra và trạng thái',
          explain: '〜ています có hai nghĩa chính. (1) Hành động đang diễn ra: 今、勉強しています (bây giờ tôi đang học). (2) Trạng thái kết quả hoặc thói quen: 東京に住んでいます (tôi đang sống ở Tokyo), 結婚しています (đã kết hôn), 知っています (biết). Với 知る, phủ định là 知りません, không phải 知っていません. Dạng thường: 〜ている, phủ định 〜ていない.',
          examples: [
            ['今、日本語を勉強しています。', 'Bây giờ tôi đang học tiếng Nhật.'],
            ['私は東京に住んでいます。', 'Tôi đang sống ở Tokyo.'],
            ['田中さんは結婚していますか。', 'Anh Tanaka đã kết hôn chưa?'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'もしもし、リンさん。今、何をしていますか。', 'A lô, Linh. Bây giờ bạn đang làm gì?'],
            ['リン', '今、家で日本語を勉強しています。', 'Bây giờ tôi đang học tiếng Nhật ở nhà.'],
            ['田中', 'そうですか。リンさんはどこに住んでいますか。', 'Vậy à. Linh đang sống ở đâu?'],
            ['リン', '大阪に住んでいます。田中さんも大阪ですか。', 'Tôi sống ở Osaka. Anh Tanaka cũng ở Osaka ạ?'],
          ],
        },
        reorder: [
          ['今|、|日本語|を|勉強しています|。', 'Bây giờ tôi đang học tiếng Nhật.'],
          ['私|は|東京|に|住んでいます|。', 'Tôi đang sống ở Tokyo.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Bây giờ tôi đang học tiếng Nhật” bằng 〜ています.', source: '今 / 日本語 / 勉強します', pattern: 'Vています。', answers: ['今、日本語を勉強しています。', '今、日本語を勉強しています', '今日本語を勉強しています。', '今日本語を勉強しています'] },
        ],
        tip: ['Khi nào dùng 〜ています cho trạng thái?', 'Các động từ như 住む, 結婚する, 知る, 持つ, 着る thường dùng 〜ています để diễn tả trạng thái đang tiếp diễn. Hãy nhớ chúng như cụm cố định: 結婚しています = đã kết hôn.'],
      },
      {
        title: { vi: 'Xin phép và điều cấm (〜てもいいです)', en: 'Permission and Prohibition' },
        intro: 'Bạn muốn xin phép làm điều gì ở lớp học hay nơi công cộng, và hiểu các biển cấm. Bài này dạy 〜てもいいです, 〜てはいけません và cách trả lời.',
        vocab: [
          ['写真', 'しゃしん (shashin)', 'noun', 'ảnh', 'ここで写真を撮ってもいいです。', 'Được phép chụp ảnh ở đây.'],
          ['撮ります', 'とります (torimasu)', 'verb', 'chụp (ảnh)', 'スマホで写真を撮ります。', 'Tôi chụp ảnh bằng điện thoại.'],
          ['吸います', 'すいます (suimasu)', 'verb', 'hút (thuốc)', 'ここでたばこを吸います。', 'Tôi hút thuốc ở đây.'],
          ['入ります', 'はいります (hairimasu)', 'verb', 'vào', '部屋に入ります。', 'Tôi vào phòng.'],
          ['止まります', 'とまります (tomarimasu)', 'verb', 'dừng lại', '電車が止まります。', 'Tàu điện dừng lại.'],
          ['大丈夫', 'だいじょうぶ (daijōbu)', 'na-adjective', 'ổn, không sao', '大丈夫ですか。', 'Bạn có sao không?'],
          ['静か', 'しずか (shizuka)', 'na-adjective', 'yên tĩnh', '図書館は静かです。', 'Thư viện yên tĩnh.'],
          ['危ない', 'あぶない (abunai)', 'i-adjective', 'nguy hiểm', 'この道は危ないです。', 'Con đường này nguy hiểm.'],
          ['食べ物', 'たべもの (tabemono)', 'noun', 'đồ ăn', '食べ物を持ってきます。', 'Tôi mang đồ ăn đến.'],
          ['ルール', 'ルール (rūru)', 'noun', 'quy tắc', 'このルールを守ります。', 'Tôi tuân thủ quy tắc này.'],
        ],
        grammar: {
          title: 'Vてもいいです / Vてはいけません',
          explain: '〜てもいいですか dùng để xin phép (“tôi làm … có được không?”). Trả lời đồng ý: はい、いいですよ / どうぞ. Từ chối nhẹ: すみません、ちょっと…; cấm: いいえ、いけません / 〜てはいけません. Biển cấm thường dùng 〜ないでください hoặc 〜禁止. Khi có thể, tránh từ chối thẳng bằng いいえ; người Nhật chuộng cách nói vòng.',
          examples: [
            ['ここで写真を撮ってもいいですか。', 'Tôi chụp ảnh ở đây có được không?'],
            ['はい、撮ってもいいですよ。', 'Vâng, bạn được phép chụp.'],
            ['図書館で食べ物を食べてはいけません。', 'Không được ăn đồ ăn trong thư viện.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、ここで写真を撮ってもいいですか。', 'Xin lỗi, tôi chụp ảnh ở đây có được không?'],
            ['係員', 'ええ、いいですよ。でも、フラッシュは使ってはいけません。', 'Vâng, được. Nhưng không được dùng đèn flash.'],
            ['リン', 'わかりました。このドアから入ってもいいですか。', 'Tôi hiểu rồi. Tôi vào từ cửa này được không?'],
            ['係員', 'はい、どうぞ。静かにしてください。', 'Vâng, xin mời. Hãy giữ yên lặng.'],
          ],
        },
        reorder: [
          ['ここ|で|写真|を|撮ってもいいですか|。', 'Tôi chụp ảnh ở đây có được không?'],
          ['図書館|で|食べ物|を|食べてはいけません|。', 'Không được ăn trong thư viện.'],
        ],
        grammarQ: [
          { prompt: 'Xin phép chụp ảnh ở đây.', source: 'ここ / 写真 / 撮ります', pattern: 'Vてもいいですか。', answers: ['ここで写真を撮ってもいいですか。', 'ここで写真を撮ってもいいですか', 'ここで写真を撮ってもいいですか？', 'ここで写真を撮ってもいいですか?'] },
        ],
        tip: ['Từ chối khéo léo', 'Khi bị hỏi xin phép mà không thể đồng ý, người Nhật thường nói 「ちょっと…」 hoặc 「すみません、それは…」 rồi bỏ lửng, thay vì nói “không được”. Đừng hiểu đó là chưa quyết định.'],
      },
    ],
  },
  {
    level: 'N4',
    names: { vi: 'Khả năng, bổn phận và kế hoạch', en: 'Ability, Obligation and Plans' },
    lessons: [
      {
        title: { vi: 'Làm được gì? (〜ことができます)', en: 'What Can You Do? (~koto ga dekimasu)' },
        intro: 'Bạn muốn nói mình biết làm gì, giỏi gì. Bài này dạy thể từ điển và mẫu 〜ことができます, cùng cách nói sở thích bằng 趣味は〜ことです.',
        vocab: [
          ['泳ぎます', 'およぎます (oyogimasu)', 'verb', 'bơi', '毎週プールで泳ぎます。', 'Mỗi tuần tôi bơi ở hồ bơi.'],
          ['弾きます', 'ひきます (hikimasu)', 'verb', 'chơi (nhạc cụ có dây/phím)', 'ピアノを弾きます。', 'Tôi chơi piano.'],
          ['運転します', 'うんてんします (unten shimasu)', 'verb', 'lái xe', '父は毎日車を運転します。', 'Bố tôi lái xe mỗi ngày.'],
          ['料理します', 'りょうりします (ryōri shimasu)', 'verb', 'nấu ăn', '週末は家で料理します。', 'Cuối tuần tôi nấu ăn ở nhà.'],
          ['上手', 'じょうず (jōzu)', 'na-adjective', 'giỏi', '田中さんは英語が上手です。', 'Anh Tanaka giỏi tiếng Anh.'],
          ['下手', 'へた (heta)', 'na-adjective', 'kém, dở', '私は歌が下手です。', 'Tôi hát dở.'],
          ['趣味', 'しゅみ (shumi)', 'noun', 'sở thích', '私の趣味は写真です。', 'Sở thích của tôi là chụp ảnh.'],
          ['スポーツ', 'スポーツ (supōtsu)', 'noun', 'thể thao', 'スポーツが好きです。', 'Tôi thích thể thao.'],
          ['漢字', 'かんじ (kanji)', 'noun', 'chữ Hán', '漢字を勉強します。', 'Tôi học chữ Hán.'],
          ['少し', 'すこし (sukoshi)', 'adverb', 'một chút', '少し日本語を話せます。', 'Tôi nói được một chút tiếng Nhật.'],
        ],
        grammar: {
          title: 'Thể từ điển + ことができます / 趣味は〜ことです',
          explain: 'Thể từ điển (辞書形) là dạng gốc của động từ: Nhóm 1 đổi âm cuối ます → う: 書きます→書く; Nhóm 2 bỏ ます thêm る: 食べます→食べる; Nhóm 3: します→する, 来ます→来る. Khả năng: 辞書形 + ことができます (泳ぐことができます = bơi được). Biến danh từ hóa động từ bằng こと: 趣味は本を読むことです. Với danh từ chỉ hoạt động dùng được: 日本語ができます.',
          examples: [
            ['私はピアノを弾くことができます。', 'Tôi chơi được piano.'],
            ['リンさんは漢字を少し書くことができます。', 'Linh viết được một ít chữ Hán.'],
            ['趣味は写真を撮ることです。', 'Sở thích của tôi là chụp ảnh.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'リンさんの趣味は何ですか。', 'Sở thích của Linh là gì?'],
            ['リン', '音楽を聞くことです。ピアノも少し弾くことができます。', 'Là nghe nhạc. Tôi cũng chơi được một chút piano.'],
            ['田中', 'すごいですね。日本語の漢字は書くことができますか。', 'Giỏi quá. Bạn viết được chữ Hán tiếng Nhật không?'],
            ['リン', 'いいえ、まだ少しだけです。', 'Không, vẫn chỉ một chút thôi.'],
          ],
        },
        reorder: [
          ['私|は|ピアノ|を|弾く|こと|が|できます|。', 'Tôi chơi được piano.'],
          ['趣味|は|写真|を|撮る|こと|です|。', 'Sở thích của tôi là chụp ảnh.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi chơi được piano” bằng 〜ことができます.', source: 'ピアノ / 弾きます', pattern: '辞書形 + ことができます。', answers: ['私はピアノを弾くことができます。', '私はピアノを弾くことができます', 'ピアノを弾くことができます。', 'ピアノを弾くことができます'] },
        ],
        tip: ['Thể khả năng (N4 mở rộng)', 'Ngoài 〜ことができます, người Nhật rất hay dùng thể khả năng: 泳げる (bơi được), 書ける (viết được). Hiện tại bạn chỉ cần nhận ra; trong hội thoại hằng ngày thể khả năng tự nhiên hơn.'],
      },
      {
        title: { vi: 'Phải làm gì? (〜なければなりません)', en: 'What Must You Do? (~nakereba narimasen)' },
        intro: 'Bạn cần nói mình phải làm gì và không được làm gì. Bài này dạy thể ない, mẫu 〜ないでください và 〜なければなりません để diễn đạt bổn phận và lời khuyên.',
        vocab: [
          ['宿題', 'しゅくだい (shukudai)', 'noun', 'bài tập về nhà', '毎日宿題をします。', 'Mỗi ngày tôi làm bài tập về nhà.'],
          ['試験', 'しけん (shiken)', 'noun', 'kỳ thi', '来週試験があります。', 'Tuần sau có kỳ thi.'],
          ['遅れます', 'おくれます (okuremasu)', 'verb', 'trễ, muộn', '電車が遅れます。', 'Tàu điện bị trễ.'],
          ['忘れます', 'わすれます (wasuremasu)', 'verb', 'quên', '傘を忘れます。', 'Tôi quên ô.'],
          ['払います', 'はらいます (haraimasu)', 'verb', 'trả (tiền)', 'レジでお金を払います。', 'Tôi trả tiền ở quầy thu ngân.'],
          ['出します', 'だします (dashimasu)', 'verb', 'nộp; lấy ra', 'レポートを出します。', 'Tôi nộp báo cáo.'],
          ['休みます', 'やすみます (yasumimasu)', 'verb', 'nghỉ', '今日は会社を休みます。', 'Hôm nay tôi nghỉ làm.'],
          ['約束', 'やくそく (yakusoku)', 'noun', 'lời hẹn, lời hứa', '友達と約束があります。', 'Tôi có hẹn với bạn.'],
          ['薬', 'くすり (kusuri)', 'noun', 'thuốc', '薬を飲みます。', 'Tôi uống thuốc.'],
          ['急ぎます', 'いそぎます (isogimasu)', 'verb', 'vội, gấp', '時間がないので急ぎます。', 'Vì không có thời gian nên tôi vội.'],
        ],
        grammar: {
          title: 'Thể ない, 〜ないでください, 〜なければなりません',
          explain: 'Thể ない (phủ định thân mật) tạo từ động từ: Nhóm 1 đổi âm cuối sang cột あ + ない (書く→書かない; ngoại lệ 買う→買わない); Nhóm 2 bỏ る thêm ない (食べる→食べない); する→しない, 来る→来ない. 〜ないでください = xin đừng…. 〜なければなりません (bỏ い thêm kereba) = phải làm…; dạng thường: 〜なきゃ. Tránh dịch “không được” bằng 〜てはいけません khi nói về bổn phận.',
          examples: [
            ['明日は試験があるので、勉強しなければなりません。', 'Ngày mai có kỳ thi, nên tôi phải học bài.'],
            ['ここでたばこを吸わないでください。', 'Xin đừng hút thuốc ở đây.'],
            ['約束に遅れないでください。', 'Xin đừng đến trễ hẹn.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '今日は友達と遊びたいですが、宿題があります。', 'Hôm nay tôi muốn đi chơi với bạn nhưng có bài tập.'],
            ['田中', '宿題は明日出さなければなりませんか。', 'Bài tập ngày mai phải nộp à?'],
            ['リン', 'はい。だから、今日しなければなりません。', 'Vâng. Vì vậy hôm nay tôi phải làm.'],
            ['田中', 'そうですか。じゃ、遅れないで来てくださいね。', 'Vậy à. Thế thì đừng đến muộn nhé.'],
          ],
        },
        reorder: [
          ['宿題|は|明日|出さなければなりませんか|。', 'Bài tập ngày mai phải nộp à?'],
          ['約束|に|遅れないでください|。', 'Xin đừng đến trễ hẹn.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi phải học bài” bằng 〜なければなりません.', source: '勉強します', pattern: 'Vなければなりません。', answers: ['勉強しなければなりません。', '勉強しなければなりません', '勉強しなければいけません。', '勉強しなければいけません'] },
          { prompt: 'Nhắc “Xin đừng hút thuốc ở đây” bằng 〜ないでください.', source: 'ここ / たばこ / 吸います', pattern: 'Vないでください。', answers: ['ここでたばこを吸わないでください。', 'ここでたばこを吸わないでください'] },
        ],
        tip: ['Phủ định bằng 〜なくてもいいです', 'Muốn nói “không cần phải…” dùng 〜なくてもいいです: 明日来なくてもいいです = ngày mai bạn không cần đến. Đừng nhầm với 〜てはいけません (cấm).'],
      },
      {
        title: { vi: 'Dự định và liệt kê (〜つもり・〜たり〜たり)', en: 'Plans and Listing (~tsumori, ~tari ~tari)' },
        intro: 'Bạn muốn kể kế hoạch kỳ nghỉ sắp tới và kể những việc mình hay làm. Bài này dạy 〜つもりです, 〜たり〜たりします và từ chỉ thời gian trong tương lai.',
        vocab: [
          ['旅行', 'りょこう (ryokō)', 'noun', 'du lịch', '来月、日本を旅行します。', 'Tháng sau tôi đi du lịch Nhật.'],
          ['予定', 'よてい (yotei)', 'noun', 'dự định, lịch trình', '週末の予定はありますか。', 'Cuối tuần bạn có kế hoạch gì không?'],
          ['来週', 'らいしゅう (raishū)', 'noun', 'tuần sau', '来週は忙しいです。', 'Tuần sau tôi bận.'],
          ['来月', 'らいげつ (raigetsu)', 'noun', 'tháng sau', '来月、国へ帰ります。', 'Tháng sau tôi về nước.'],
          ['夏休み', 'なつやすみ (natsuyasumi)', 'noun', 'kỳ nghỉ hè', '夏休みに海へ行きます。', 'Kỳ nghỉ hè tôi đi biển.'],
          ['泊まります', 'とまります (tomarimasu)', 'verb', 'nghỉ lại, ở trọ', 'ホテルに泊まります。', 'Tôi ở khách sạn.'],
          ['登ります', 'のぼります (noborimasu)', 'verb', 'leo', '富士山に登ります。', 'Tôi leo núi Phú Sĩ.'],
          ['掃除します', 'そうじします (sōji shimasu)', 'verb', 'dọn dẹp', '部屋を掃除します。', 'Tôi dọn dẹp phòng.'],
          ['洗濯します', 'せんたくします (sentaku shimasu)', 'verb', 'giặt giũ', '日曜日に洗濯します。', 'Chủ nhật tôi giặt đồ.'],
          ['まだ', 'まだ (mada)', 'adverb', 'vẫn chưa', '予定はまだ決めていません。', 'Tôi vẫn chưa quyết định kế hoạch.'],
        ],
        grammar: {
          title: 'Vつもりです / Vたり、Vたりします',
          explain: '辞書形 + つもりです diễn đạt ý định đã có: 来月、日本へ行くつもりです (tôi định tháng sau đi Nhật). Phủ định: 〜ないつもりです (định không…) hoặc 〜つもりはありません. Liệt kê vài hành động tiêu biểu: Vたり、Vたりします — 掃除したり、洗濯したりします (nào dọn dẹp, nào giặt giũ…). Thể たり tạo giống thể た (thể quá khứ thân mật) thêm り. Dùng だり khi thể た là だ (飲んだ→飲んだり).',
          examples: [
            ['来月、日本へ旅行するつもりです。', 'Tháng sau tôi định đi du lịch Nhật.'],
            ['週末は掃除したり、洗濯したりします。', 'Cuối tuần tôi nào dọn dẹp, nào giặt giũ.'],
            ['夏休みは国へ帰らないつもりです。', 'Kỳ nghỉ hè tôi định không về nước.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', '夏休みの予定はありますか。', 'Kỳ nghỉ hè bạn có kế hoạch gì không?'],
            ['リン', '友達と旅行するつもりです。富士山に登りたいです。', 'Tôi định đi du lịch với bạn. Tôi muốn leo núi Phú Sĩ.'],
            ['田中', 'いいですね。ホテルに泊まりますか。', 'Hay nhỉ. Các bạn ở khách sạn à?'],
            ['リン', 'はい。でも、まだ決めていません。', 'Vâng. Nhưng tôi vẫn chưa quyết định.'],
          ],
        },
        reorder: [
          ['来月|、|日本|へ|旅行する|つもり|です|。', 'Tháng sau tôi định đi du lịch Nhật.'],
          ['週末|は|掃除したり|、|洗濯したり|します|。', 'Cuối tuần tôi nào dọn dẹp, nào giặt giũ.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tháng sau tôi định đi du lịch Nhật Bản”.', source: '来月 / 日本 / 旅行します', pattern: '辞書形 + つもりです。', answers: ['来月、日本へ旅行するつもりです。', '来月、日本へ旅行するつもりです', '来月日本へ旅行するつもりです。', '来月日本へ旅行するつもりです'] },
        ],
        tip: ['つもり và 予定', '〜つもりです là ý định cá nhân; 〜予定です là kế hoạch đã sắp xếp (vé, lịch). Câu 「来月、日本へ行く予定です」 nghe chắc chắn hơn.'],
      },
    ],
  },
  {
    level: 'N4',
    names: { vi: 'So sánh, kinh nghiệm và ý kiến', en: 'Comparing, Experience and Opinions' },
    lessons: [
      {
        title: { vi: 'So sánh (より・ほうが・一番)', en: 'Comparisons' },
        intro: 'Bạn muốn so sánh hai thứ, chọn ra thứ tốt nhất và nêu lý do. Bài này dạy các mẫu AはBより, AのほうがBより, どちらが và 一番.',
        vocab: [
          ['季節', 'きせつ (kisetsu)', 'noun', 'mùa', '日本は季節がはっきりしています。', 'Nhật Bản có bốn mùa rõ rệt.'],
          ['夏', 'なつ (natsu)', 'noun', 'mùa hè', '夏は暑いです。', 'Mùa hè nóng.'],
          ['冬', 'ふゆ (fuyu)', 'noun', 'mùa đông', '冬は寒いです。', 'Mùa đông lạnh.'],
          ['暑い', 'あつい (atsui)', 'i-adjective', 'nóng (thời tiết)', '今日はとても暑いです。', 'Hôm nay rất nóng.'],
          ['寒い', 'さむい (samui)', 'i-adjective', 'lạnh (thời tiết)', '北海道は寒いです。', 'Hokkaido lạnh.'],
          ['速い', 'はやい (hayai)', 'i-adjective', 'nhanh (tốc độ)', '新幹線は速いです。', 'Tàu Shinkansen nhanh.'],
          ['便利', 'べんり (benri)', 'na-adjective', 'tiện lợi', '電車は便利です。', 'Tàu điện tiện lợi.'],
          ['ずっと', 'ずっと (zutto)', 'adverb', 'hơn nhiều, suốt', 'こちらのほうがずっと安いです。', 'Cái này rẻ hơn nhiều.'],
          ['一番', 'いちばん (ichiban)', 'adverb', 'nhất', '私は夏が一番好きです。', 'Tôi thích mùa hè nhất.'],
          ['どちら', 'どちら (dochira)', 'pronoun', 'cái nào (trong hai)', 'どちらが好きですか。', 'Bạn thích cái nào hơn?'],
        ],
        grammar: {
          title: 'AはBより〜 / AのほうがBより〜 / Aの中でBが一番〜',
          explain: 'So sánh hơn: AはBより + tính từ (電車はバスより速いです). Nhấn mạnh phía được chọn: AのほうがBより + tính từ. Hỏi lựa chọn trong hai thứ: AとBとどちらが + tính từ ですか; trả lời: Aのほうが〜です. Cao nhất: (Nの中で) Aが一番 + tính từ ですか → 季節の中でどれが一番好きですか. Chủ đề rộng dùng 何/いつ/どこ/誰 + が一番.',
          examples: [
            ['電車はバスより速いです。', 'Tàu điện nhanh hơn xe buýt.'],
            ['夏と冬とどちらが好きですか。', 'Giữa mùa hè và mùa đông, bạn thích mùa nào hơn?'],
            ['私は夏が一番好きです。', 'Tôi thích mùa hè nhất.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '田中さん、夏と冬とどちらが好きですか。', 'Anh Tanaka, anh thích mùa hè hay mùa đông hơn?'],
            ['田中', '冬のほうが好きです。夏は暑いですから。', 'Tôi thích mùa đông hơn. Vì mùa hè nóng.'],
            ['リン', 'そうですか。私は夏が一番好きです。', 'Vậy à. Tôi thích mùa hè nhất.'],
            ['田中', 'ベトナムは日本より暑いですか。', 'Việt Nam nóng hơn Nhật Bản à?'],
          ],
        },
        reorder: [
          ['電車|は|バス|より|速いです|。', 'Tàu điện nhanh hơn xe buýt.'],
          ['私|は|夏|が|一番|好き|です|。', 'Tôi thích mùa hè nhất.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tàu điện nhanh hơn xe buýt” bằng より.', source: '電車 / バス / 速い', pattern: 'AはBより〜です。', answers: ['電車はバスより速いです。', '電車はバスより速いです', '電車のほうがバスより速いです。', '電車のほうがバスより速いです'] },
        ],
        tip: ['Hai cách đọc 速い', '速い (hayai) chỉ tốc độ; 早い (hayai) chỉ “sớm” về thời gian: 朝早い (dậy sớm). Cùng cách đọc nhưng khác chữ Hán và khác nghĩa, cần phân biệt khi viết.'],
      },
      {
        title: { vi: 'Kinh nghiệm (〜たことがあります)', en: 'Experiences (~ta koto ga arimasu)' },
        intro: 'Bạn muốn hỏi và kể về những điều đã từng trải qua. Bài này dạy mẫu 〜たことがあります, cùng các từ chỉ tần suất và trải nghiệm ở Nhật.',
        vocab: [
          ['温泉', 'おんせん (onsen)', 'noun', 'suối nước nóng', '温泉に入ったことがあります。', 'Tôi đã từng ngâm onsen.'],
          ['寿司', 'すし (sushi)', 'noun', 'sushi', '本場の寿司を食べました。', 'Tôi đã ăn sushi chính gốc.'],
          ['京都', 'きょうと (kyōto)', 'noun', 'Kyoto', '京都へ行ったことがあります。', 'Tôi đã từng đến Kyoto.'],
          ['お寺', 'おてら (otera)', 'noun', 'ngôi chùa', '京都でお寺を見ました。', 'Tôi đã ngắm chùa ở Kyoto.'],
          ['祭り', 'まつり (matsuri)', 'noun', 'lễ hội', '夏祭りに行きたいです。', 'Tôi muốn đi lễ hội mùa hè.'],
          ['着物', 'きもの (kimono)', 'noun', 'kimono', '着物を着たことがあります。', 'Tôi đã từng mặc kimono.'],
          ['浴衣', 'ゆかた (yukata)', 'noun', 'yukata (kimono mùa hè)', '夏祭りで浴衣を着ました。', 'Tôi đã mặc yukata ở lễ hội mùa hè.'],
          ['一度', 'いちど (ichido)', 'adverb', 'một lần', '一度だけ会いました。', 'Tôi chỉ gặp một lần.'],
          ['一度も', 'いちども (ichido mo)', 'adverb', 'chưa lần nào', '一度も行ったことがありません。', 'Tôi chưa đi lần nào.'],
          ['初めて', 'はじめて (hajimete)', 'adverb', 'lần đầu tiên', '初めて日本に来ました。', 'Tôi đến Nhật lần đầu tiên.'],
        ],
        grammar: {
          title: 'Vたことがあります / Vたことがありません',
          explain: 'Động từ thể た (quá khứ thân mật) + ことがあります nghĩa là “đã từng…”: 京都へ行ったことがあります. Phủ định: 〜たことがありません (chưa từng), thường kèm 一度も hoặc まだ. Hỏi: 〜たことがありますか. Khác với 〜ました (sự kiện đã xảy ra ở một thời điểm), mẫu này nhấn vào trải nghiệm như một kinh nghiệm sống.',
          examples: [
            ['京都へ行ったことがありますか。', 'Bạn đã từng đến Kyoto chưa?'],
            ['はい、一度行ったことがあります。', 'Rồi, tôi đã từng đến một lần.'],
            ['温泉に入ったことがありません。', 'Tôi chưa từng ngâm onsen.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'リンさんは京都へ行ったことがありますか。', 'Linh đã từng đến Kyoto chưa?'],
            ['リン', 'いいえ、一度も行ったことがありません。', 'Chưa, tôi chưa đi lần nào.'],
            ['田中', '温泉に入ったことはありますか。', 'Bạn đã từng ngâm onsen chưa?'],
            ['リン', 'はい、初めて入りました。とても気持ちよかったです。', 'Rồi, tôi ngâm lần đầu. Thật là dễ chịu.'],
          ],
        },
        reorder: [
          ['京都|へ|行った|こと|が|ありますか|。', 'Bạn đã từng đến Kyoto chưa?'],
          ['温泉|に|入った|こと|が|ありません|。', 'Tôi chưa từng ngâm onsen.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi “Bạn đã từng đến Kyoto chưa?”', source: '京都 / 行きます', pattern: 'Vたことがありますか。', answers: ['京都へ行ったことがありますか。', '京都へ行ったことがありますか', '京都に行ったことがありますか。', '京都に行ったことがありますか'] },
        ],
        tip: ['初めて và 初めまして', '「初めて」 là “lần đầu tiên” (副詞), còn 「はじめまして」 là câu chào khi gặp ai lần đầu. Cách viết kanji giống nhau nhưng chức năng khác nhau.'],
      },
      {
        title: { vi: 'Ý kiến và suy đoán (〜と思います)', en: 'Opinions and Guesses (~to omoimasu)' },
        intro: 'Bạn muốn nêu ý kiến, đoán điều có thể xảy ra và thuật lại lời người khác. Bài này dạy 〜と思います, 〜と言いました và 〜でしょう.',
        vocab: [
          ['思います', 'おもいます (omoimasu)', 'verb', 'nghĩ', '明日は雨が降ると思います。', 'Tôi nghĩ ngày mai trời sẽ mưa.'],
          ['言います', 'いいます (iimasu)', 'verb', 'nói', '先生は「大丈夫」と言いました。', 'Thầy nói “không sao”.'],
          ['意見', 'いけん (iken)', 'noun', 'ý kiến', 'みんなの意見を聞きます。', 'Tôi lắng nghe ý kiến mọi người.'],
          ['賛成', 'さんせい (sansei)', 'noun', 'tán thành', 'その意見に賛成です。', 'Tôi tán thành ý kiến đó.'],
          ['たぶん', 'たぶん (tabun)', 'adverb', 'có lẽ', 'たぶん来ると思います。', 'Tôi nghĩ có lẽ anh ấy sẽ đến.'],
          ['必ず', 'かならず (kanarazu)', 'adverb', 'nhất định', '必ず連絡します。', 'Tôi nhất định sẽ liên lạc.'],
          ['雨', 'あめ (ame)', 'noun', 'mưa', '雨が降ります。', 'Trời mưa.'],
          ['天気', 'てんき (tenki)', 'noun', 'thời tiết', '明日の天気はどうですか。', 'Thời tiết ngày mai thế nào?'],
          ['難しい', 'むずかしい (muzukashii)', 'i-adjective', 'khó', '漢字は難しいと思います。', 'Tôi nghĩ chữ Hán khó.'],
          ['簡単', 'かんたん (kantan)', 'na-adjective', 'đơn giản, dễ', 'この問題は簡単です。', 'Bài này đơn giản.'],
        ],
        grammar: {
          title: 'Thể thường + と思います / と言いました / でしょう',
          explain: 'Để nêu ý kiến hoặc dự đoán, đặt câu ở thể thường (thân mật) trước と思います: 明日は雨が降ると思います. Với tính từ な và danh từ, thêm だ trước と: 彼は先生だと思います. Trích dẫn lời nói: 〜と言いました (先生は「大丈夫」と言いました). 〜でしょう (hoặc だろう) biểu thị suy đoán nhẹ, thường dùng cho dự báo thời tiết. Phủ định ý kiến: 〜ないと思います (thay vì 思いません).',
          examples: [
            ['明日は雨が降ると思います。', 'Tôi nghĩ ngày mai trời sẽ mưa.'],
            ['漢字は難しいと思いますか。', 'Bạn có nghĩ chữ Hán khó không?'],
            ['田中さんは「大丈夫です」と言いました。', 'Anh Tanaka nói “Không sao ạ”.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '明日の天気はどうですか。', 'Thời tiết ngày mai thế nào?'],
            ['田中', 'テレビで見ましたが、たぶん雨が降ると思います。', 'Tôi xem trên tivi, và nghĩ có lẽ trời sẽ mưa.'],
            ['リン', 'じゃ、傘を持っていかなければなりませんね。', 'Vậy tôi phải mang theo ô nhỉ.'],
            ['田中', 'そうですね。漢字の試験は難しいと思いますか。', 'Đúng vậy. Bạn có nghĩ kỳ thi chữ Hán khó không?'],
          ],
        },
        reorder: [
          ['明日|は|雨|が|降る|と|思います|。', 'Tôi nghĩ ngày mai trời sẽ mưa.'],
          ['漢字|は|難しい|と|思いますか|。', 'Bạn nghĩ chữ Hán khó không?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi nghĩ ngày mai trời sẽ mưa” bằng 〜と思います.', source: '明日 / 雨が降る', pattern: '普通形 + と思います。', answers: ['明日は雨が降ると思います。', '明日は雨が降ると思います', '明日雨が降ると思います。', '明日雨が降ると思います'] },
        ],
        tip: ['Giảm độ chắc chắn', 'Người Nhật hay thêm 〜と思います để làm câu mềm hơn, ngay cả khi họ khá chắc chắn. Dùng nó trong thảo luận sẽ tạo cảm giác khiêm tốn và lịch sự.'],
      },
    ],
  },
  {
    level: 'N4',
    names: { vi: 'Sức khỏe, điện thoại và công việc', en: 'Health, Phone and Work' },
    lessons: [
      {
        title: { vi: 'Đi khám bệnh và lời khuyên (〜たほうがいい)', en: 'At the Clinic and Giving Advice' },
        intro: 'Bạn bị ốm và phải mô tả triệu chứng với bác sĩ, rồi hiểu lời khuyên. Bài này dạy từ về cơ thể, bệnh và mẫu 〜たほうがいいです / 〜ないほうがいいです.',
        vocab: [
          ['病院', 'びょういん (byōin)', 'noun', 'bệnh viện', '病院へ行きます。', 'Tôi đến bệnh viện.'],
          ['熱', 'ねつ (netsu)', 'noun', 'sốt', '熱が三十八度あります。', 'Tôi sốt ba mươi tám độ.'],
          ['頭', 'あたま (atama)', 'noun', 'đầu', '頭が痛いです。', 'Tôi đau đầu.'],
          ['お腹', 'おなか (onaka)', 'noun', 'bụng', 'お腹が痛いです。', 'Tôi đau bụng.'],
          ['喉', 'のど (nodo)', 'noun', 'cổ họng', '喉が痛いです。', 'Tôi đau họng.'],
          ['咳', 'せき (seki)', 'noun', 'ho', '咳が出ます。', 'Tôi bị ho.'],
          ['風邪', 'かぜ (kaze)', 'noun', 'cảm lạnh', '風邪をひきました。', 'Tôi bị cảm.'],
          ['痛い', 'いたい (itai)', 'i-adjective', 'đau', '足がとても痛いです。', 'Chân tôi rất đau.'],
          ['お大事に', 'おだいじに (odaiji ni)', 'phrase', 'xin giữ gìn sức khỏe', 'お大事にしてください。', 'Xin hãy giữ gìn sức khỏe.'],
          ['無理', 'むり (muri)', 'na-adjective', 'quá sức, không thể', '無理をしないでください。', 'Xin đừng cố quá sức.'],
        ],
        grammar: {
          title: 'Vたほうがいいです / Vないほうがいいです / 〜すぎます',
          explain: 'Lời khuyên: Vたほうがいいです (thể た) = nên làm…; phủ định Vないほうがいいです = không nên…. Mức độ mạnh hơn lời đề nghị đơn giản, dùng khi người nói tin điều đó thực sự tốt cho người nghe. 〜すぎます (bỏ ます + すぎます) = quá mức: 食べすぎます (ăn quá nhiều), 働きすぎます. Câu trả lời lịch sự khi nhận lời khuyên: はい、そうします (vâng, tôi sẽ làm vậy).',
          examples: [
            ['早く寝たほうがいいです。', 'Bạn nên đi ngủ sớm.'],
            ['お酒を飲まないほうがいいです。', 'Bạn không nên uống rượu.'],
            ['昨日、食べすぎました。', 'Hôm qua tôi đã ăn quá nhiều.'],
          ],
        },
        dialogue: {
          lines: [
            ['医者', 'どうしましたか。', 'Bạn bị sao vậy?'],
            ['リン', '昨日から頭が痛くて、熱もあります。', 'Từ hôm qua tôi đau đầu và còn bị sốt.'],
            ['医者', '風邪ですね。薬を飲んで、早く寝たほうがいいです。', 'Cảm lạnh rồi. Bạn nên uống thuốc và đi ngủ sớm.'],
            ['リン', 'はい、わかりました。', 'Vâng, tôi hiểu rồi.'],
            ['医者', '今日はお風呂に入らないほうがいいです。お大事に。', 'Hôm nay bạn không nên tắm. Xin giữ gìn sức khỏe.'],
          ],
        },
        reorder: [
          ['早く|寝た|ほう|が|いいです|。', 'Bạn nên đi ngủ sớm.'],
          ['お酒|を|飲まない|ほう|が|いいです|。', 'Bạn không nên uống rượu.'],
        ],
        grammarQ: [
          { prompt: 'Khuyên bạn “nên đi ngủ sớm” bằng 〜たほうがいいです.', source: '早く / 寝ます', pattern: 'Vたほうがいいです。', answers: ['早く寝たほうがいいです。', '早く寝たほうがいいです', '早く寝たほうがいいですよ。', '早く寝たほうがいいですよ'] },
        ],
        tip: ['Triệu chứng thường gặp', 'Muốn nói “tôi bị sốt” dùng 熱があります; “tôi bị ho” dùng 咳が出ます; “tôi bị cảm” dùng 風邪をひきました (thể た của ひく). Đừng dùng 風邪があります.'],
      },
      {
        title: { vi: 'Điện thoại, hẹn và trình tự việc làm (〜てから・〜まえに)', en: 'Phone Calls and Sequencing' },
        intro: 'Bạn cần gọi điện đặt lịch, thông báo đến muộn và nói trình tự việc làm. Bài này dạy 〜てから, 〜まえに, 〜ましょうか và các câu thường dùng khi nghe điện thoại.',
        vocab: [
          ['電話', 'でんわ (denwa)', 'noun', 'điện thoại; cuộc gọi', '会社に電話します。', 'Tôi gọi điện đến công ty.'],
          ['もしもし', 'もしもし (moshimoshi)', 'phrase', 'a lô', 'もしもし、田中です。', 'A lô, Tanaka đây ạ.'],
          ['予約', 'よやく (yoyaku)', 'noun', 'đặt trước', '席を予約します。', 'Tôi đặt chỗ.'],
          ['伝えます', 'つたえます (tsutaemasu)', 'verb', 'nhắn lại, truyền đạt', '田中さんに伝えます。', 'Tôi sẽ nhắn lại cho anh Tanaka.'],
          ['連絡します', 'れんらくします (renraku shimasu)', 'verb', 'liên lạc', 'あとで連絡します。', 'Lát nữa tôi sẽ liên lạc.'],
          ['後で', 'あとで (ato de)', 'adverb', 'sau đó, lát nữa', '後でまた電話します。', 'Lát nữa tôi sẽ gọi lại.'],
          ['時間', 'じかん (jikan)', 'noun', 'thời gian', '時間がありません。', 'Tôi không có thời gian.'],
          ['会議', 'かいぎ (kaigi)', 'noun', 'cuộc họp', '三時から会議があります。', 'Từ ba giờ có cuộc họp.'],
          ['お待たせしました', 'おまたせしました (omatase shimashita)', 'phrase', 'xin lỗi đã để bạn đợi', 'お待たせしました、すみません。', 'Xin lỗi đã để bạn đợi.'],
          ['すぐ', 'すぐ (sugu)', 'adverb', 'ngay', 'すぐ行きます。', 'Tôi đi ngay.'],
        ],
        grammar: {
          title: 'Vてから / Vるまえに / Vましょうか',
          explain: 'Vてから diễn đạt “sau khi làm… thì…”: 食べてから薬を飲みます (sau khi ăn thì uống thuốc). Vるまえに (thể từ điển) = “trước khi…”: 寝るまえに歯を磨きます. Danh từ + のまえに: 会議のまえに. Đề nghị giúp đỡ: Vましょうか (“để tôi … nhé?”): 電話しましょうか. Khi nghe máy, dùng もしもし, và khi để người ta đợi lâu nói お待たせしました.',
          examples: [
            ['食べてから、薬を飲んでください。', 'Hãy uống thuốc sau khi ăn.'],
            ['寝るまえに、歯を磨きます。', 'Trước khi ngủ tôi đánh răng.'],
            ['私が田中さんに電話しましょうか。', 'Để tôi gọi cho anh Tanaka nhé?'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'もしもし、田中さんはいらっしゃいますか。', 'A lô, anh Tanaka có ở đó không ạ?'],
            ['受付', 'ただいま会議中です。後で伝えましょうか。', 'Hiện anh ấy đang họp. Lát nữa tôi nhắn lại nhé?'],
            ['リン', 'はい、お願いします。会議が終わってから、電話してください。', 'Vâng, nhờ bạn. Sau khi họp xong, nhờ anh gọi lại cho tôi.'],
            ['受付', 'わかりました。お名前を教えてください。', 'Tôi hiểu rồi. Xin cho tôi biết tên bạn.'],
          ],
        },
        reorder: [
          ['寝る|まえ|に|、|歯|を|磨きます|。', 'Trước khi ngủ tôi đánh răng.'],
          ['私|が|田中さん|に|電話しましょうか|。', 'Để tôi gọi cho anh Tanaka nhé?'],
        ],
        grammarQ: [
          { prompt: 'Nhờ ai “uống thuốc sau khi ăn” bằng 〜てから.', source: '食べます / 薬を飲みます', pattern: 'Vてから、〜。', answers: ['食べてから、薬を飲んでください。', '食べてから、薬を飲んでください', '食べてから薬を飲んでください。', '食べてから薬を飲んでください'] },
        ],
        tip: ['Lịch sự trên điện thoại', 'Trong công ty, nói 「少々お待ちください」 (xin vui lòng chờ một chút) khi chuyển máy, và kết thúc bằng 「失礼します」. Gọi điện cho cấp trên hoặc khách hàng tuyệt đối không ngắt máy trước.'],
      },
      {
        title: { vi: 'Lý do và nói chuyện thân mật (〜から・thể thường)', en: 'Reasons and Casual Speech' },
        intro: 'Bạn muốn giải thích lý do xin nghỉ, từ chối khéo và trò chuyện thân mật với bạn bè. Bài này dạy 〜から, 〜ので, 〜でも và thể thường trong hội thoại.',
        vocab: [
          ['理由', 'りゆう (riyū)', 'noun', 'lý do', '遅れた理由を話します。', 'Tôi giải thích lý do đến muộn.'],
          ['忙しい', 'いそがしい (isogashii)', 'i-adjective', 'bận rộn', '今週はとても忙しいです。', 'Tuần này tôi rất bận.'],
          ['残念', 'ざんねん (zannen)', 'na-adjective', 'đáng tiếc', 'それは残念ですね。', 'Thật đáng tiếc nhỉ.'],
          ['心配', 'しんぱい (shinpai)', 'noun', 'lo lắng', '心配しないでください。', 'Xin đừng lo lắng.'],
          ['疲れます', 'つかれます (tsukaremasu)', 'verb', 'mệt', '仕事で疲れます。', 'Tôi mệt vì công việc.'],
          ['暇', 'ひま (hima)', 'na-adjective', 'rảnh rỗi', '今日は暇です。', 'Hôm nay tôi rảnh.'],
          ['仕事', 'しごと (shigoto)', 'noun', 'công việc', '仕事が終わります。', 'Công việc kết thúc.'],
          ['同僚', 'どうりょう (dōryō)', 'noun', 'đồng nghiệp', '同僚と昼ごはんを食べます。', 'Tôi ăn trưa với đồng nghiệp.'],
          ['でも', 'でも (demo)', 'conjunction', 'nhưng', 'でも、行きたいです。', 'Nhưng tôi vẫn muốn đi.'],
          ['だから', 'だから (dakara)', 'conjunction', 'vì vậy', 'だから、行けません。', 'Vì vậy tôi không đi được.'],
        ],
        grammar: {
          title: 'Câu 1 + から / ので + câu 2 và thể thường',
          explain: 'から và ので đều nối nguyên nhân với kết quả: 忙しいから、行けません (vì bận nên không đi được). ので mềm và lịch sự hơn, dùng thể thường trước nó; với tính từ な/danh từ đổi だ thành な: 暇なので. から có thể đứng cuối câu để giải thích: 行けません。忙しいですから. Thể thường (普通形) là dạng thân mật của です/ます: 食べます→食べる, 食べました→食べた, 食べません→食べない. Dùng với bạn bè và trong câu trích dẫn như 〜と思います.',
          examples: [
            ['今週は忙しいから、行けません。', 'Vì tuần này bận nên tôi không đi được.'],
            ['暇なので、散歩に行きます。', 'Vì rảnh nên tôi đi dạo.'],
            ['疲れたから、早く寝る。', 'Vì mệt nên tôi đi ngủ sớm (thân mật).'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', '明日、みんなで食事に行きませんか。', 'Ngày mai mọi người cùng đi ăn nhé?'],
            ['リン', 'すみません、明日は仕事が忙しいので、行けません。', 'Xin lỗi, ngày mai công việc bận nên tôi không đi được.'],
            ['田中', 'そうですか。残念ですね。', 'Vậy à. Tiếc quá nhỉ.'],
            ['リン', 'また今度、誘ってください。', 'Lần sau xin hãy rủ tôi nhé.'],
          ],
        },
        reorder: [
          ['今週|は|忙しい|から|、|行けません|。', 'Vì tuần này bận nên tôi không đi được.'],
          ['暇|な|ので|、|散歩|に|行きます|。', 'Vì rảnh nên tôi đi dạo.'],
        ],
        grammarQ: [
          { prompt: 'Từ chối khéo: “Vì bận nên tôi không đi được” bằng 〜から.', source: '忙しい / 行けません', pattern: '普通形 + から、〜。', answers: ['忙しいから、行けません。', '忙しいから、行けません', '忙しいから行けません。', '忙しいから行けません', '忙しいので、行けません。', '忙しいので、行けません'] },
        ],
        tip: ['から hay ので?', 'Dùng ので để giải thích khách quan, lịch sự (xin nghỉ, từ chối); dùng から khi muốn nhấn mạnh lý do hoặc nói với người thân. Cả hai đều cần thể thường ở phía trước.'],
      },
    ],
  },
];
