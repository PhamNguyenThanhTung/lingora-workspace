import type { UnitSpec } from '../types.ts';

/**
 * Japanese N4 — extension units (4–6): favors and conditions, reasons and appearances, passive and causative.
 * Same conventions as ja-n4.ts: readings are "かな (romaji)"; examples and dialogue lines carry no romaji.
 */
export const JA_N4_EXTRA_UNITS: UnitSpec[] = [
  {
    level: 'N4',
    names: { vi: 'Làm giúp và điều kiện', en: 'Favors and Conditions' },
    lessons: [
      {
        title: { vi: 'Làm giúp và được giúp (〜てあげる・〜てもらう・〜てくれる)', en: 'Doing Favors (~te ageru, ~te morau, ~te kureru)' },
        intro: 'Bạn muốn kể mình đã giúp ai, được ai giúp hay ai đã giúp mình. Bài này dạy ba mẫu て + cho nhận để nói lòng biết ơn một cách tự nhiên.',
        vocab: [
          ['手伝います', 'てつだいます (tetsudaimasu)', 'verb', 'giúp đỡ', '友達が引っ越しを手伝います。', 'Bạn giúp tôi chuyển nhà.'],
          ['引っ越し', 'ひっこし (hikkoshi)', 'noun', 'việc chuyển nhà', '来月、引っ越しをします。', 'Tháng sau tôi chuyển nhà.'],
          ['案内します', 'あんないします (annai shimasu)', 'verb', 'hướng dẫn, dẫn đường', '友達に町を案内します。', 'Tôi dẫn bạn đi tham quan thị trấn.'],
          ['送ります', 'おくります (okurimasu)', 'verb', 'gửi', '駅まで車で送ります。', 'Tôi đưa bạn đến ga bằng ô tô.'],
          ['迎えます', 'むかえます (mukaemasu)', 'verb', 'đón', '空港で友達を迎えます。', 'Tôi đón bạn ở sân bay.'],
          ['直します', 'なおします (naoshimasu)', 'verb', 'sửa chữa', '兄が自転車を直します。', 'Anh trai sửa xe đạp cho tôi.'],
          ['親切', 'しんせつ (shinsetsu)', 'na-adjective', 'tốt bụng, thân thiện', '親切な人に会いました。', 'Tôi đã gặp một người tốt bụng.'],
          ['お礼', 'おれい (orei)', 'noun', 'lời cảm ơn', 'お礼にお菓子をあげます。', 'Để cảm ơn, tôi tặng bánh kẹo.'],
          ['助かります', 'たすかります (tasukarimasu)', 'verb', 'được giúp, đỡ quá', '手伝ってくれて助かります。', 'Bạn giúp tôi thật đỡ quá.'],
          ['荷物', 'にもつ (nimotsu)', 'noun', 'hành lý, bưu kiện', '荷物を持ってあげます。', 'Tôi xách hành lý giúp bạn.'],
        ],
        grammar: {
          title: '〜てあげる / 〜てもらう / 〜てくれる',
          explain: 'Ba mẫu này gắn thể て với động từ cho nhận để nói về việc làm giúp. 〜てあげます: mình làm giúp người khác (友達に荷物を持ってあげます). 〜てもらいます: mình được ai làm giúp, người làm đi với に (友達に手伝ってもらいます). 〜てくれます: người khác làm giúp mình, chủ ngữ là người làm (友達が手伝ってくれます). Với người trên, dùng 〜ていただきます thay cho もらいます.',
          examples: [
            ['友達に荷物を持ってあげます。', 'Tôi xách hành lý giúp bạn.'],
            ['友達に引っ越しを手伝ってもらいました。', 'Tôi đã được bạn giúp chuyển nhà.'],
            ['田中さんが駅まで送ってくれました。', 'Anh Tanaka đã đưa tôi đến ga.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', '引っ越しはどうでしたか。', 'Việc chuyển nhà thế nào rồi?', ],
            ['リン', '友達が手伝ってくれたので、助かりました。', 'Nhờ bạn giúp nên tôi đỡ quá.'],
            ['田中', 'いい友達ですね。お礼は何かしましたか。', 'Bạn tốt nhỉ. Bạn đã cảm ơn bằng gì chưa?'],
            ['リン', 'はい、晩ご飯を作ってあげました。', 'Vâng, tôi đã nấu bữa tối cho bạn.'],
          ],
        },
        reorder: [
          ['友達|に|荷物|を|持って|あげます|。', 'Tôi xách hành lý giúp bạn.'],
          ['田中さん|が|駅|まで|送って|くれました|。', 'Anh Tanaka đã đưa tôi đến ga.'],
        ],
        grammarQ: [
          { prompt: 'Nói mình đã được bạn giúp chuyển nhà (dùng もらいました).', source: '友達 / 引っ越し / 手伝う', pattern: '友達に〜を手伝ってもらいました', answers: ['友達に引っ越しを手伝ってもらいました。', '友達に引っ越しを手伝ってもらいました'] },
          { prompt: 'Nói anh Tanaka đã đưa mình đến ga (dùng くれました).', source: '田中さん / 駅 / 送る', pattern: 'N が〜てくれました', answers: ['田中さんが駅まで送ってくれました。', '田中さんが駅まで送ってくれました'] },
        ],
        tip: ['Ơn huệ trong tiếng Nhật', 'Người Nhật rất để ý ai làm ơn cho ai. Chọn đúng あげる / もらう / くれる thể hiện bạn có ý thức về ơn huệ và là cách nói lịch sự tự nhiên.'],
      },
      {
        title: { vi: 'Nếu… thì… (〜たら)', en: 'If and When (~tara)' },
        intro: 'Bạn muốn nói “nếu mai mưa thì tôi ở nhà” hoặc “khi nào xong thì gọi cho tôi”. Bài này dạy mẫu điều kiện 〜たら, mẫu đa năng nhất của N4.',
        vocab: [
          ['もし', 'もし (moshi)', 'adverb', 'nếu như', 'もし雨が降ったら、行きません。', 'Nếu trời mưa thì tôi không đi.'],
          ['宝くじ', 'たからくじ (takarakuji)', 'noun', 'vé số', '宝くじに当たったら、旅行します。', 'Nếu trúng vé số tôi sẽ đi du lịch.'],
          ['当たります', 'あたります (atarimasu)', 'verb', 'trúng (giải)', '宝くじが当たります。', 'Tôi trúng vé số.'],
          ['着きます', 'つきます (tsukimasu)', 'verb', 'đến nơi', '駅に着いたら、電話します。', 'Khi đến ga tôi sẽ gọi điện.'],
          ['終わります', 'おわります (owarimasu)', 'verb', 'kết thúc', '仕事が終わったら、帰ります。', 'Khi xong việc tôi sẽ về.'],
          ['安い', 'やすい (yasui)', 'i-adjective', 'rẻ', '安かったら、買います。', 'Nếu rẻ thì tôi mua.'],
          ['暇', 'ひま (hima)', 'na-adjective', 'rảnh rỗi', '暇だったら、遊びに来てください。', 'Nếu rảnh, hãy đến chơi.'],
          ['お金持ち', 'おかねもち (okanemochi)', 'noun', 'người giàu', 'お金持ちになったら、家を買います。', 'Nếu giàu tôi sẽ mua nhà.'],
          ['合格します', 'ごうかくします (gōkaku shimasu)', 'verb', 'đỗ, thi đậu', '試験に合格したら、お祝いします。', 'Nếu đỗ kỳ thi, chúng ta sẽ ăn mừng.'],
          ['お祝い', 'おいわい (oiwai)', 'noun', 'lời chúc mừng, quà mừng', 'みんなでお祝いをします。', 'Mọi người cùng ăn mừng.'],
        ],
        grammar: {
          title: '〜たら (điều kiện giả định và “khi … xong”)',
          explain: 'Cách tạo: thể quá khứ thường + ら (行った→行ったら, 高かった→高かったら, 暇だった→暇だったら). Dùng để nói “nếu” (もし雨が降ったら) hoặc “sau khi … xảy ra thì” (駅に着いたら電話します). Vế sau có thể là ý chí, yêu cầu, lời mời (行きましょう, 電話してください) — điều mà 〜と không làm được. Khi dùng cho tương lai gần thì cứ coi như “khi nào … thì …”.',
          examples: [
            ['もし雨が降ったら、家にいます。', 'Nếu trời mưa thì tôi ở nhà.'],
            ['駅に着いたら、電話してください。', 'Khi đến ga, hãy gọi điện cho tôi.'],
            ['宝くじに当たったら、旅行します。', 'Nếu trúng vé số tôi sẽ đi du lịch.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', '週末は何をしますか。', 'Cuối tuần bạn làm gì?'],
            ['リン', '晴れたら、公園へ行きます。雨が降ったら、家で勉強します。', 'Nếu trời nắng thì tôi đi công viên. Nếu mưa thì học ở nhà.'],
            ['田中', '宿題が終わったら、いっしょに映画を見ませんか。', 'Xong bài tập thì cùng xem phim nhé?'],
            ['リン', 'いいですね。終わったら、連絡します。', 'Hay đấy. Xong rồi tôi sẽ liên lạc.'],
          ],
        },
        reorder: [
          ['駅|に|着いたら|、|電話して|ください|。', 'Khi đến ga, hãy gọi điện cho tôi.'],
          ['宝くじ|に|当たったら|、|旅行します|。', 'Nếu trúng vé số tôi sẽ đi du lịch.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Nếu trời mưa thì tôi ở nhà” bằng 〜たら.', source: 'もし / 雨が降る / 家にいます', pattern: 'もし + V-たら、〜', answers: ['もし雨が降ったら、家にいます。', 'もし雨が降ったら、家にいます'] },
          { prompt: 'Nói “Khi đến ga, hãy gọi điện cho tôi”.', source: '駅 / 着く / 電話', pattern: 'V-たら、V-てください', answers: ['駅に着いたら、電話してください。', '駅に着いたら、電話してください'] },
        ],
        tip: ['Quá khứ ≠ quá khứ', 'Dù có chữ た, 〜たら không nói về quá khứ. Nó chỉ mượn dạng た để chỉ “sau khi việc đó đã xảy ra”.'],
      },
      {
        title: { vi: 'Hễ… là… (〜と・〜ば)', en: 'Natural Results and Conditions (~to, ~ba)' },
        intro: 'Bạn muốn nói “nhấn nút này thì cửa mở” hoặc “nếu luyện nhiều thì sẽ giỏi”. Bài này dạy 〜と cho kết quả tất yếu và 〜ば cho điều kiện cần thiết.',
        vocab: [
          ['ボタン', 'ぼたん (botan)', 'noun', 'nút bấm', 'ボタンを押します。', 'Tôi nhấn nút.'],
          ['押します', 'おします (oshimasu)', 'verb', 'nhấn, đẩy', 'このボタンを押します。', 'Tôi nhấn nút này.'],
          ['回します', 'まわします (mawashimasu)', 'verb', 'xoay, vặn', 'ハンドルを回します。', 'Tôi xoay vô lăng.'],
          ['春', 'はる (haru)', 'noun', 'mùa xuân', '春になると、桜が咲きます。', 'Cứ đến mùa xuân là hoa anh đào nở.'],
          ['咲きます', 'さきます (sakimasu)', 'verb', 'nở (hoa)', '花が咲きます。', 'Hoa nở.'],
          ['練習します', 'れんしゅうします (renshū shimasu)', 'verb', 'luyện tập', '毎日練習します。', 'Tôi luyện tập mỗi ngày.'],
          ['上手になります', 'じょうずになります (jōzu ni narimasu)', 'phrase', 'trở nên giỏi', '練習すれば、上手になります。', 'Nếu luyện tập sẽ giỏi lên.'],
          ['急ぎます', 'いそぎます (isogimasu)', 'verb', 'vội, gấp', '急げば、間に合います。', 'Nếu khẩn trương thì kịp.'],
          ['間に合います', 'まにあいます (ma ni aimasu)', 'verb', 'kịp giờ', '電車に間に合います。', 'Tôi kịp chuyến tàu.'],
          ['左', 'ひだり (hidari)', 'noun', 'bên trái', '左に曲がると、駅があります。', 'Rẽ trái là có nhà ga.'],
        ],
        grammar: {
          title: '〜と (hễ… thì) và 〜ば (nếu… thì)',
          explain: '〜と (thể từ điển + と) diễn tả kết quả tự nhiên, tất yếu: ボタンを押すとドアが開きます (hễ nhấn nút thì cửa mở). Vế sau không dùng ý chí hay yêu cầu. 〜ば (nhóm 1 đổi う→え + ば, nhóm 2 る→れば, 〜なければ, 安ければ) nêu điều kiện cần: 練習すれば上手になります. Dùng 〜ば cho lời khuyên: 早く行けばいいです.',
          examples: [
            ['左に曲がると、駅があります。', 'Rẽ trái là có nhà ga.'],
            ['春になると、桜が咲きます。', 'Cứ đến mùa xuân là hoa anh đào nở.'],
            ['練習すれば、上手になります。', 'Nếu luyện tập thì sẽ giỏi lên.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'この機械はどうやって使いますか。', 'Cái máy này dùng thế nào ạ?'],
            ['田中', 'このボタンを押すと、お茶が出ます。', 'Hễ nhấn nút này là trà chảy ra.'],
            ['リン', '日本語は難しいですが、練習すれば上手になりますか。', 'Tiếng Nhật khó, nhưng luyện tập thì sẽ giỏi chứ ạ?'],
            ['田中', 'はい、毎日練習すれば、必ず上手になります。', 'Vâng, nếu luyện tập mỗi ngày, chắc chắn sẽ giỏi.'],
          ],
        },
        reorder: [
          ['左|に|曲がると|、|駅|が|あります|。', 'Rẽ trái là có nhà ga.'],
          ['練習すれば|、|上手|に|なります|。', 'Nếu luyện tập thì sẽ giỏi lên.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Cứ đến mùa xuân là hoa anh đào nở” bằng 〜と.', source: '春 / 桜 / 咲きます', pattern: 'N になると、〜', answers: ['春になると、桜が咲きます。', '春になると、桜が咲きます'] },
          { prompt: 'Nói “Nếu luyện tập thì sẽ giỏi lên” bằng 〜ば.', source: '練習する / 上手', pattern: 'V-ば、〜', answers: ['練習すれば、上手になります。', '練習すれば、上手になります'] },
        ],
        tip: ['Chọn と, ば hay たら', 'と: kết quả tất yếu. ば: điều kiện cần. たら: dùng được nhiều nhất và cho phép vế sau có ý chí. Khi chưa chắc, cứ dùng たら.'],
      },
    ],
  },
  {
    level: 'N4',
    names: { vi: 'Lý do và suy đoán', en: 'Reasons and Appearances' },
    lessons: [
      {
        title: { vi: 'Vì… nên… (〜ので・〜のに)', en: 'Reasons and Contrast (~node, ~noni)' },
        intro: 'Bạn muốn giải thích lý do lịch sự trong công việc hoặc bày tỏ bất mãn. Bài này dạy 〜ので (vì) mềm hơn から và 〜のに (vậy mà).',
        vocab: [
          ['事故', 'じこ (jiko)', 'noun', 'tai nạn', '事故があったので、遅れました。', 'Vì có tai nạn nên tôi đến muộn.'],
          ['遅刻します', 'ちこくします (chikoku shimasu)', 'verb', 'đi trễ', '寝坊して遅刻します。', 'Tôi ngủ quên nên đi trễ.'],
          ['寝坊します', 'ねぼうします (nebō shimasu)', 'verb', 'ngủ quên', '今朝、寝坊しました。', 'Sáng nay tôi ngủ quên.'],
          ['渋滞', 'じゅうたい (jūtai)', 'noun', 'tắc đường', '渋滞しているので、遅れます。', 'Vì tắc đường nên tôi sẽ đến muộn.'],
          ['謝ります', 'あやまります (ayamarimasu)', 'verb', 'xin lỗi', '先生に謝ります。', 'Tôi xin lỗi thầy.'],
          ['特別', 'とくべつ (tokubetsu)', 'na-adjective', 'đặc biệt', '今日は特別な日です。', 'Hôm nay là ngày đặc biệt.'],
          ['練習', 'れんしゅう (renshū)', 'noun', 'sự luyện tập', '毎日練習したのに、できません。', 'Tôi đã luyện mỗi ngày vậy mà vẫn chưa làm được.'],
          ['足ります', 'たります (tarimasu)', 'verb', 'đủ', 'お金が足りません。', 'Tôi không đủ tiền.'],
          ['困ります', 'こまります (komarimasu)', 'verb', 'gặp rắc rối, khó xử', '道がわからなくて困ります。', 'Tôi không biết đường nên rất khó xử.'],
          ['残念', 'ざんねん (zannen)', 'na-adjective', 'đáng tiếc', '行けなくて残念です。', 'Không đi được thật đáng tiếc.'],
        ],
        grammar: {
          title: '〜ので (lý do lịch sự) và 〜のに (vậy mà)',
          explain: '〜ので nối lý do khách quan, nghe mềm và lịch sự hơn 〜から: 事故があったので、遅れました. Với tính từ な và danh từ dùng 〜なので (暇なので, 休みなので). 〜のに diễn tả kết quả ngược với kỳ vọng, thường kèm bất mãn hoặc tiếc nuối: 練習したのに、できません. Vế sau 〜のに không dùng lời yêu cầu hay ý chí.',
          examples: [
            ['事故があったので、遅れました。', 'Vì có tai nạn nên tôi đến muộn.'],
            ['毎日練習したのに、できません。', 'Tôi đã luyện mỗi ngày vậy mà vẫn chưa làm được.'],
            ['今日は休みなので、家にいます。', 'Vì hôm nay nghỉ nên tôi ở nhà.'],
          ],
        },
        dialogue: {
          lines: [
            ['先生', 'リンさん、今日はどうして遅れましたか。', 'Linh, sao hôm nay em đến muộn?'],
            ['リン', '電車で事故があったので、遅れました。すみません。', 'Vì tàu có tai nạn nên em đến muộn. Em xin lỗi.'],
            ['先生', 'そうですか。大変でしたね。', 'Vậy à. Vất vả nhỉ.'],
            ['リン', 'はい。早く出たのに、間に合いませんでした。', 'Vâng. Em đã ra khỏi nhà sớm vậy mà vẫn không kịp.'],
          ],
        },
        reorder: [
          ['事故|が|あった|ので|、|遅れました|。', 'Vì có tai nạn nên tôi đến muộn.'],
          ['毎日|練習した|のに|、|できません|。', 'Tôi đã luyện mỗi ngày vậy mà vẫn chưa làm được.'],
        ],
        grammarQ: [
          { prompt: 'Giải thích lý do đến muộn: vì có tai nạn.', source: '事故 / 遅れました', pattern: '〜ので、〜', answers: ['事故があったので、遅れました。', '事故があったので、遅れました'] },
          { prompt: 'Bày tỏ tiếc nuối: đã luyện mỗi ngày vậy mà không làm được.', source: '毎日 / 練習 / できません', pattern: 'V-たのに、〜', answers: ['毎日練習したのに、できません。', '毎日練習したのに、できません'] },
        ],
        tip: ['から hay ので?', 'Với cấp trên, khách hàng hoặc người lạ, dùng ので và kết thúc bằng 〜です/ます. から nghe chủ quan hơn và hơi gay gắt.'],
      },
      {
        title: { vi: 'Trông có vẻ… (〜そうです: dáng vẻ)', en: 'Looks Like (~sō desu)' },
        intro: 'Bạn nhìn thấy cái bánh trông ngon, trời trông sắp mưa. Bài này dạy mẫu 〜そうです để nói điều bạn suy ra từ vẻ bề ngoài.',
        vocab: [
          ['おいしそう', 'おいしそう (oishisō)', 'na-adjective', 'trông ngon', 'このケーキはおいしそうです。', 'Chiếc bánh này trông ngon.'],
          ['雲', 'くも (kumo)', 'noun', 'đám mây', '黒い雲が出ています。', 'Mây đen đang kéo đến.'],
          ['降りそう', 'ふりそう (furisō)', 'phrase', 'trông sắp mưa', '雨が降りそうです。', 'Trông trời sắp mưa.'],
          ['眠い', 'ねむい (nemui)', 'i-adjective', 'buồn ngủ', '眠そうですね。', 'Trông bạn buồn ngủ nhỉ.'],
          ['元気', 'げんき (genki)', 'na-adjective', 'khỏe mạnh', '元気そうですね。', 'Trông bạn khỏe nhỉ.'],
          ['楽しい', 'たのしい (tanoshii)', 'i-adjective', 'vui', '楽しそうに笑っています。', 'Họ đang cười trông rất vui.'],
          ['笑います', 'わらいます (waraimasu)', 'verb', 'cười', '友達が笑います。', 'Bạn cười.'],
          ['落ちます', 'おちます (ochimasu)', 'verb', 'rơi', 'このコップは落ちそうです。', 'Cái cốc này trông sắp rơi.'],
          ['重い', 'おもい (omoi)', 'i-adjective', 'nặng', 'その荷物は重そうです。', 'Hành lý đó trông nặng.'],
          ['壊れます', 'こわれます (kowaremasu)', 'verb', 'hỏng', '傘が壊れそうです。', 'Chiếc ô trông sắp hỏng.'],
        ],
        grammar: {
          title: '〜そうです (nhìn có vẻ)',
          explain: 'Cách tạo: bỏ い với tính từ い, bỏ な với tính từ な, bỏ ます với động từ rồi thêm そうです: おいしい→おいしそうです, 元気→元気そうです, 降ります→降りそうです. Nghĩa: “trông có vẻ”, dựa trên quan sát trực tiếp. Ngoại lệ: いい→よさそうです, ない→なさそうです. Cẩn thận: bản thân động từ chia ở ます-stem + そう nghĩa là “sắp sửa”.',
          examples: [
            ['このケーキはおいしそうです。', 'Chiếc bánh này trông ngon.'],
            ['雨が降りそうです。', 'Trông trời sắp mưa.'],
            ['その荷物は重そうですね。', 'Hành lý đó trông nặng nhỉ.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', '空に黒い雲が出ていますね。', 'Trên trời có mây đen nhỉ.'],
            ['リン', 'はい、雨が降りそうです。傘を持っていきましょう。', 'Vâng, trông trời sắp mưa. Mang ô theo nhé.'],
            ['田中', 'リンさん、眠そうですね。', 'Linh, trông bạn buồn ngủ nhỉ.'],
            ['リン', 'ええ、昨日夜遅くまで勉強しました。', 'Vâng, hôm qua tôi học đến khuya.'],
          ],
        },
        reorder: [
          ['雨|が|降りそう|です|。', 'Trông trời sắp mưa.'],
          ['この|ケーキ|は|おいしそう|です|。', 'Chiếc bánh này trông ngon.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Trông trời sắp mưa” bằng 〜そうです.', source: '雨 / 降ります', pattern: 'V-stem + そうです', answers: ['雨が降りそうです。', '雨が降りそうです'] },
          { prompt: 'Nói chiếc bánh trông ngon.', source: 'ケーキ / おいしい', pattern: 'tính từ + そうです', answers: ['このケーキはおいしそうです。', 'このケーキはおいしそうです'] },
        ],
        tip: ['Hai nghĩa của そう', 'ます-stem + そうです = “sắp”, 普通形 + そうです = “nghe nói” (bài sau). Hãy xem hình thức đi trước そう để phân biệt.'],
      },
      {
        title: { vi: 'Nghe nói… (〜そうです・〜らしい)', en: 'Hearsay and Evidence (~sō desu, ~rashii)' },
        intro: 'Bạn muốn truyền đạt thông tin nghe được từ tivi, bạn bè. Bài này dạy 〜そうです (nghe nói) và 〜らしい (hình như) cùng cách phân biệt với dáng vẻ.',
        vocab: [
          ['ニュース', 'にゅーす (nyūsu)', 'noun', 'tin tức', 'ニュースで見ました。', 'Tôi đã xem trên tin tức.'],
          ['噂', 'うわさ (uwasa)', 'noun', 'tin đồn', '噂によると、店が閉まるそうです。', 'Theo tin đồn thì cửa hàng sắp đóng cửa.'],
          ['予報', 'よほう (yohō)', 'noun', 'dự báo', '天気予報によると、明日は雪です。', 'Theo dự báo thời tiết, ngày mai có tuyết.'],
          ['台風', 'たいふう (taifū)', 'noun', 'bão', '台風が近づいています。', 'Bão đang đến gần.'],
          ['近づきます', 'ちかづきます (chikazukimasu)', 'verb', 'đến gần', '台風が近づきます。', 'Bão đang tiến lại gần.'],
          ['結果', 'けっか (kekka)', 'noun', 'kết quả', '試験の結果はよかったそうです。', 'Nghe nói kết quả kỳ thi tốt.'],
          ['事件', 'じけん (jiken)', 'noun', 'vụ việc', '駅で事件があったそうです。', 'Nghe nói ở ga có vụ việc.'],
          ['中止', 'ちゅうし (chūshi)', 'noun', 'hoãn, hủy', '試合は中止になりました。', 'Trận đấu đã bị hủy.'],
          ['発表します', 'はっぴょうします (happyō shimasu)', 'verb', 'công bố, thuyết trình', '先生が結果を発表します。', 'Thầy công bố kết quả.'],
          ['確か', 'たしか (tashika)', 'na-adjective', 'chắc chắn', '確かではありません。', 'Tôi không chắc lắm.'],
        ],
        grammar: {
          title: '〜そうです (nghe nói) / 〜らしい (hình như)',
          explain: '普通形 + そうです nghĩa là “nghe nói”, thông tin truyền lại từ nguồn khác: 明日は雪が降るそうです. Thường kèm nguồn: 〜によると (theo …): 天気予報によると… 〜らしい là suy đoán dựa trên bằng chứng gián tiếp: 誰もいないらしい (hình như không có ai). Khác với 〜そうです (dáng vẻ), vế trước ở thể thường, danh từ không thêm だ (雨だそうです là nghe nói trời mưa).',
          examples: [
            ['天気予報によると、明日は雪が降るそうです。', 'Theo dự báo thời tiết, nghe nói ngày mai có tuyết.'],
            ['試験の結果はよかったそうです。', 'Nghe nói kết quả kỳ thi tốt.'],
            ['田中さんは今日休みらしいです。', 'Hình như hôm nay anh Tanaka nghỉ.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'ニュースを見ましたか。台風が近づいているそうです。', 'Bạn xem tin chưa? Nghe nói bão đang đến gần.'],
            ['リン', 'えっ、本当ですか。明日の試合はどうなりますか。', 'Ơ, thật không? Trận đấu ngày mai sẽ thế nào?'],
            ['田中', '中止になるらしいです。', 'Hình như sẽ bị hủy.'],
            ['リン', '残念ですが、仕方がありませんね。', 'Đáng tiếc nhưng đành chịu nhỉ.'],
          ],
        },
        reorder: [
          ['天気予報|に|よると|、|明日|は|雪|が|降る|そうです|。', 'Theo dự báo thời tiết, nghe nói ngày mai có tuyết.'],
          ['試験|の|結果|は|よかった|そうです|。', 'Nghe nói kết quả kỳ thi tốt.'],
        ],
        grammarQ: [
          { prompt: 'Truyền lại tin: nghe nói kết quả kỳ thi tốt.', source: '試験の結果 / よかった', pattern: '普通形 + そうです', answers: ['試験の結果はよかったそうです。', '試験の結果はよかったそうです'] },
          { prompt: 'Nói hình như hôm nay anh Tanaka nghỉ.', source: '田中さん / 休み', pattern: '〜らしいです', answers: ['田中さんは今日休みらしいです。', '田中さんは今日休みらしいです'] },
        ],
        tip: ['Nêu nguồn tin', 'Luôn nêu nguồn bằng 〜によると hoặc 〜で聞きました khi dùng そうです để tránh nghe như bạn tự khẳng định.'],
      },
    ],
  },
  {
    level: 'N4',
    names: { vi: 'Bị động và sai khiến', en: 'Passive and Causative' },
    lessons: [
      {
        title: { vi: 'Bị động (〜られる)', en: 'The Passive Voice' },
        intro: 'Bạn muốn nói mình bị mắng, được khen hay bị làm phiền. Bài này dạy thể bị động của ba nhóm động từ và cách dùng に chỉ tác nhân.',
        vocab: [
          ['褒めます', 'ほめます (homemasu)', 'verb', 'khen', '先生が学生を褒めます。', 'Thầy khen học sinh.'],
          ['叱ります', 'しかります (shikarimasu)', 'verb', 'mắng', '母が弟を叱ります。', 'Mẹ mắng em trai.'],
          ['頼みます', 'たのみます (tanomimasu)', 'verb', 'nhờ, yêu cầu', '友達に仕事を頼みます。', 'Tôi nhờ bạn làm việc.'],
          ['誘います', 'さそいます (sasoimasu)', 'verb', 'rủ, mời', '友達を旅行に誘います。', 'Tôi rủ bạn đi du lịch.'],
          ['踏みます', 'ふみます (fumimasu)', 'verb', 'giẫm', '電車で足を踏みます。', 'Giẫm vào chân trên tàu.'],
          ['盗みます', 'ぬすみます (nusumimasu)', 'verb', 'ăn trộm', '泥棒が財布を盗みます。', 'Kẻ trộm lấy cắp ví.'],
          ['泥棒', 'どろぼう (dorobō)', 'noun', 'kẻ trộm', '泥棒が入りました。', 'Kẻ trộm đã đột nhập.'],
          ['財布', 'さいふ (saifu)', 'noun', 'ví tiền', '財布を盗まれました。', 'Tôi bị trộm mất ví.'],
          ['迷惑', 'めいわく (meiwaku)', 'noun', 'phiền hà', 'ご迷惑をおかけしました。', 'Xin lỗi vì đã làm phiền.'],
          ['作ります', 'つくります (tsukurimasu)', 'verb', 'làm, chế tạo', 'この車は日本で作られました。', 'Chiếc xe này được sản xuất ở Nhật.'],
        ],
        grammar: {
          title: 'Thể bị động 〜られる',
          explain: 'Nhóm 1: đổi âm cuối sang cột あ + れる (褒める khác; 書く→書かれる, 叱る→叱られる). Nhóm 2: bỏ る thêm られる (食べる→食べられる, 褒める→褒められる). Nhóm 3: する→される, 来る→来られる. Chủ thể bị tác động thành chủ ngữ, người tác động đi với に: 私は先生に褒められました (tôi được thầy khen). Còn dùng cho “bị phiền”: 雨に降られました (bị mưa ướt).',
          examples: [
            ['私は先生に褒められました。', 'Tôi được thầy khen.'],
            ['電車で財布を盗まれました。', 'Tôi bị trộm mất ví trên tàu.'],
            ['この車は日本で作られました。', 'Chiếc xe này được sản xuất ở Nhật.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'どうしたんですか。元気がありませんね。', 'Có chuyện gì vậy? Trông bạn không khỏe.'],
            ['リン', '電車で財布を盗まれました。', 'Tôi bị trộm mất ví trên tàu.'],
            ['田中', 'それは大変ですね。警察に言いましたか。', 'Vất vả quá. Bạn báo cảnh sát chưa?'],
            ['リン', 'はい、駅の人に頼みました。', 'Rồi, tôi đã nhờ nhân viên nhà ga.'],
          ],
        },
        reorder: [
          ['私|は|先生|に|褒められました|。', 'Tôi được thầy khen.'],
          ['電車|で|財布|を|盗まれました|。', 'Tôi bị trộm mất ví trên tàu.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi được thầy khen” bằng thể bị động.', source: '先生 / 褒めます', pattern: 'N は N に V-られる', answers: ['私は先生に褒められました。', '私は先生に褒められました'] },
          { prompt: 'Nói tôi bị trộm mất ví trên tàu.', source: '電車 / 財布 / 盗みます', pattern: 'N を V-られる', answers: ['電車で財布を盗まれました。', '電車で財布を盗まれました'] },
        ],
        tip: ['Bị động “phiền hà”', 'Tiếng Nhật có kiểu bị động mà tiếng Việt khó dịch: 雨に降られた (bị mưa dính). Nó diễn tả bạn khó chịu vì ai đó hay việc gì đó làm ảnh hưởng bạn.'],
      },
      {
        title: { vi: 'Sai khiến (〜させる)', en: 'The Causative (~saseru)' },
        intro: 'Bạn muốn nói “bố mẹ bắt tôi học” hay “xin cho tôi nghỉ”. Bài này dạy thể sai khiến và mẫu xin phép 〜させてください.',
        vocab: [
          ['嫌がります', 'いやがります (iyagarimasu)', 'verb', 'tỏ ra không thích', '弟は野菜を嫌がります。', 'Em trai tỏ ra không thích rau.'],
          ['待たせます', 'またせます (matasemasu)', 'verb', 'bắt đợi', '客を待たせます。', 'Làm khách phải đợi.'],
          ['休ませます', 'やすませます (yasumasemasu)', 'verb', 'cho nghỉ', '社員を休ませます。', 'Cho nhân viên nghỉ.'],
          ['習います', 'ならいます (naraimasu)', 'verb', 'học (từ ai)', 'ピアノを習います。', 'Tôi học đàn piano.'],
          ['習い事', 'ならいごと (naraigoto)', 'noun', 'lớp học năng khiếu', '子どもに習い事をさせます。', 'Cho con học lớp năng khiếu.'],
          ['子ども', 'こども (kodomo)', 'noun', 'trẻ em, con', '子どもを公園で遊ばせます。', 'Cho con chơi ở công viên.'],
          ['遊びます', 'あそびます (asobimasu)', 'verb', 'chơi', '子どもが遊びます。', 'Trẻ con chơi.'],
          ['社長', 'しゃちょう (shachō)', 'noun', 'giám đốc', '社長が社員に働かせます。', 'Giám đốc bắt nhân viên làm việc.'],
          ['許可', 'きょか (kyoka)', 'noun', 'sự cho phép', '許可をもらいます。', 'Tôi xin phép.'],
          ['早退します', 'そうたいします (sōtai shimasu)', 'verb', 'về sớm', '熱があるので、早退します。', 'Vì bị sốt nên tôi xin về sớm.'],
        ],
        grammar: {
          title: 'Thể sai khiến 〜させる / 〜させてください',
          explain: 'Nhóm 1: cột あ + せる (書く→書かせる, 待つ→待たせる). Nhóm 2: bỏ る thêm させる (食べる→食べさせる). Nhóm 3: する→させる, 来る→来させる. Nghĩa: bắt / để ai làm gì. 母は子どもに野菜を食べさせます (mẹ bắt con ăn rau). Dạng xin phép lịch sự: 〜させてください hoặc 〜させていただけませんか: 今日は早退させてください.',
          examples: [
            ['母は子どもに野菜を食べさせます。', 'Mẹ bắt con ăn rau.'],
            ['すみません、今日は早退させてください。', 'Xin lỗi, hôm nay xin cho tôi về sớm.'],
            ['社長は社員を休ませました。', 'Giám đốc cho nhân viên nghỉ.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', '課長、熱があるので、今日は早退させてください。', 'Thưa trưởng phòng, em bị sốt nên hôm nay xin cho em về sớm.'],
            ['課長', 'それはいけませんね。早く病院に行きなさい。', 'Vậy không ổn. Hãy đến bệnh viện sớm nhé.'],
            ['リン', 'ありがとうございます。仕事は明日します。', 'Cảm ơn trưởng phòng. Công việc em sẽ làm vào ngày mai.'],
            ['課長', '無理をしないで、ゆっくり休んでください。', 'Đừng cố quá, hãy nghỉ ngơi cho kỹ.'],
          ],
        },
        reorder: [
          ['母|は|子ども|に|野菜|を|食べさせます|。', 'Mẹ bắt con ăn rau.'],
          ['すみません|、|今日|は|早退させて|ください|。', 'Xin lỗi, hôm nay xin cho tôi về sớm.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Mẹ bắt con ăn rau” bằng thể sai khiến.', source: '母 / 子ども / 野菜 / 食べます', pattern: 'N は N に N を V-させます', answers: ['母は子どもに野菜を食べさせます。', '母は子どもに野菜を食べさせます'] },
          { prompt: 'Xin phép về sớm hôm nay (させてください).', source: '今日 / 早退', pattern: 'V-させてください', answers: ['今日は早退させてください。', '今日は早退させてください'] },
        ],
        tip: ['Sai khiến = bắt hoặc cho phép', 'させる có thể là “bắt ai làm” hoặc “để ai làm”, tuỳ ngữ cảnh. Khi xin phép, させてください luôn mang nghĩa “xin để tôi làm”.'],
      },
      {
        title: { vi: 'Làm sẵn và lỡ làm (〜ておく・〜てしまう)', en: 'Preparing and Regretting (~te oku, ~te shimau)' },
        intro: 'Bạn muốn nói “tôi đã đặt chỗ trước” hay “lỡ quên ví mất rồi”. Bài này dạy hai trợ động từ hay gặp nhất: 〜ておく và 〜てしまう.',
        vocab: [
          ['準備', 'じゅんび (junbi)', 'noun', 'sự chuẩn bị', '旅行の準備をします。', 'Tôi chuẩn bị cho chuyến du lịch.'],
          ['予約します', 'よやくします (yoyaku shimasu)', 'verb', 'đặt trước', 'ホテルを予約します。', 'Tôi đặt khách sạn trước.'],
          ['調べます', 'しらべます (shirabemasu)', 'verb', 'tra cứu, tìm hiểu', '電車の時間を調べます。', 'Tôi tra giờ tàu.'],
          ['忘れ物', 'わすれもの (wasuremono)', 'noun', 'đồ để quên', '忘れ物をしました。', 'Tôi bỏ quên đồ.'],
          ['なくします', 'なくします (nakushimasu)', 'verb', 'làm mất', '鍵をなくしました。', 'Tôi đã làm mất chìa khóa.'],
          ['鍵', 'かぎ (kagi)', 'noun', 'chìa khóa', '鍵をかばんに入れておきます。', 'Tôi để sẵn chìa khóa vào cặp.'],
          ['壊します', 'こわします (kowashimasu)', 'verb', 'làm hỏng', '携帯を壊してしまいました。', 'Tôi lỡ làm hỏng điện thoại.'],
          ['食べ過ぎます', 'たべすぎます (tabesugimasu)', 'verb', 'ăn quá nhiều', 'ケーキを食べ過ぎました。', 'Tôi đã ăn bánh quá nhiều.'],
          ['冷やします', 'ひやします (hiyashimasu)', 'verb', 'làm lạnh', 'ビールを冷やしておきます。', 'Tôi để sẵn bia vào chỗ lạnh.'],
          ['席', 'せき (seki)', 'noun', 'chỗ ngồi', '席を取っておきます。', 'Tôi giữ sẵn chỗ ngồi.'],
        ],
        grammar: {
          title: '〜ておく (làm sẵn) / 〜てしまう (lỡ làm, làm xong)',
          explain: 'V-ておきます nghĩa là làm trước để chuẩn bị hoặc để nguyên trạng thái: ホテルを予約しておきます (đặt sẵn khách sạn). Dạng thân mật: 〜とく. V-てしまいます nghĩa là làm xong hoàn toàn hoặc lỡ làm điều đáng tiếc: 宿題を全部してしまいました (làm xong hết bài), 鍵をなくしてしまいました (lỡ làm mất chìa khóa). Dạng thân mật: 〜ちゃう.',
          examples: [
            ['旅行の前に、ホテルを予約しておきます。', 'Trước chuyến đi tôi sẽ đặt sẵn khách sạn.'],
            ['電車の中で鍵をなくしてしまいました。', 'Tôi lỡ làm mất chìa khóa trên tàu.'],
            ['宿題を全部してしまいました。', 'Tôi đã làm xong hết bài tập.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', '来週の旅行の準備はできましたか。', 'Bạn đã chuẩn bị xong chuyến du lịch tuần sau chưa?'],
            ['リン', 'はい、ホテルは予約しておきました。', 'Rồi, tôi đã đặt sẵn khách sạn.'],
            ['田中', '電車の時間も調べておきましたか。', 'Bạn đã tra sẵn giờ tàu chưa?'],
            ['リン', 'あっ、まだです。調べておきます。', 'À, chưa. Tôi sẽ tra trước.'],
          ],
        },
        reorder: [
          ['旅行|の|前|に|、|ホテル|を|予約しておきます|。', 'Trước chuyến đi tôi sẽ đặt sẵn khách sạn.'],
          ['電車|の|中|で|鍵|を|なくしてしまいました|。', 'Tôi lỡ làm mất chìa khóa trên tàu.'],
        ],
        grammarQ: [
          { prompt: 'Nói sẽ đặt sẵn khách sạn trước chuyến đi.', source: 'ホテル / 予約', pattern: 'V-ておきます', answers: ['ホテルを予約しておきます。', 'ホテルを予約しておきます', '旅行の前に、ホテルを予約しておきます。'] },
          { prompt: 'Nói lỡ làm mất chìa khóa trên tàu.', source: '鍵 / なくします', pattern: 'V-てしまいました', answers: ['電車の中で鍵をなくしてしまいました。', '電車の中で鍵をなくしてしまいました'] },
        ],
        tip: ['てしまう = tiếc nuối', 'Khi gắn てしまいました vào hành động ngoài ý muốn, người nghe hiểu ngay bạn tiếc hoặc áy náy. Nên dùng khi xin lỗi.'],
      },
    ],
  },
];
