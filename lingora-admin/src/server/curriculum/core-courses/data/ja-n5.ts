import type { UnitSpec } from '../types.ts';

/**
 * Japanese N5 — Beginner. Can-do: greet and introduce yourself, talk about family, things and daily life,
 * shop, ask the way and use basic polite (です/ます) sentences.
 * Vocabulary readings are written "かな (romaji)"; verbs are listed in the polite ます form so they appear
 * exactly as learners meet them in sentences.
 */
export const JA_N5_UNITS: UnitSpec[] = [
  {
    level: 'N5',
    names: { vi: 'Làm quen và giới thiệu', en: 'Meeting People' },
    lessons: [
      {
        title: { vi: 'Chào hỏi cơ bản', en: 'Basic Greetings' },
        intro: 'Bạn bước vào lớp tiếng Nhật và gặp thầy cô, bạn mới. Sau bài này bạn biết chào theo từng thời điểm trong ngày, tự giới thiệu ngắn, cảm ơn, xin lỗi và tạm biệt bằng tiếng Nhật lịch sự.',
        vocab: [
          ['おはようございます', 'おはようございます (ohayō gozaimasu)', 'phrase', 'chào buổi sáng (lịch sự)', 'おはようございます、田中さん。', 'Chào buổi sáng, anh Tanaka.'],
          ['こんにちは', 'こんにちは (konnichiwa)', 'phrase', 'xin chào (ban ngày)', 'こんにちは、はじめまして。', 'Xin chào, rất hân hạnh được gặp.'],
          ['こんばんは', 'こんばんは (konbanwa)', 'phrase', 'chào buổi tối', 'こんばんは、山田さん。', 'Chào buổi tối, chị Yamada.'],
          ['はじめまして', 'はじめまして (hajimemashite)', 'phrase', 'rất hân hạnh (lần đầu gặp)', 'はじめまして、リンです。', 'Rất hân hạnh, tôi là Linh.'],
          ['よろしくお願いします', 'よろしくおねがいします (yoroshiku onegaishimasu)', 'phrase', 'xin được giúp đỡ', 'どうぞよろしくお願いします。', 'Rất mong được giúp đỡ.'],
          ['ありがとうございます', 'ありがとうございます (arigatō gozaimasu)', 'phrase', 'cảm ơn (lịch sự)', 'ありがとうございます、先生。', 'Em cảm ơn thầy.'],
          ['すみません', 'すみません (sumimasen)', 'phrase', 'xin lỗi; xin phép', 'すみません、田中さんですか。', 'Xin lỗi, có phải anh Tanaka không ạ?'],
          ['さようなら', 'さようなら (sayōnara)', 'phrase', 'tạm biệt', 'さようなら、また明日。', 'Tạm biệt, hẹn mai gặp lại.'],
          ['はい', 'はい (hai)', 'interjection', 'vâng, dạ', 'はい、リンです。', 'Vâng, tôi là Linh.'],
          ['いいえ', 'いいえ (iie)', 'interjection', 'không (phủ định)', 'いいえ、だいじょうぶです。', 'Không, tôi ổn ạ.'],
        ],
        grammar: {
          title: 'Lời chào + tên + さん',
          explain: 'Tiếng Nhật có lời chào riêng cho từng thời điểm: おはようございます (sáng), こんにちは (ban ngày), こんばんは (tối). Sau lời chào có thể thêm tên người kèm さん để thể hiện sự kính trọng; さん đứng sau tên, không bao giờ dùng với tên của chính mình. Với thầy cô dùng 先生 thay cho さん.',
          examples: [
            ['おはようございます、田中さん。', 'Chào buổi sáng, anh Tanaka.', 'Ohayō gozaimasu, Tanaka-san.'],
            ['こんにちは、リンさん。', 'Xin chào, bạn Linh.', 'Konnichiwa, Rin-san.'],
            ['こんばんは、先生。', 'Chào buổi tối, thầy/cô.', 'Konbanwa, sensei.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'おはようございます、田中さん。', 'Chào buổi sáng, anh Tanaka.', 'Ohayō gozaimasu, Tanaka-san.'],
            ['田中', 'おはようございます。はじめまして、田中です。', 'Chào buổi sáng. Rất hân hạnh, tôi là Tanaka.', 'Ohayō gozaimasu. Hajimemashite, Tanaka desu.'],
            ['リン', 'はじめまして、リンです。', 'Rất hân hạnh, tôi là Linh.', 'Hajimemashite, Rin desu.'],
            ['田中', 'どうぞよろしくお願いします。', 'Rất mong được giúp đỡ.', 'Dōzo yoroshiku onegaishimasu.'],
            ['リン', 'こちらこそ。ありがとうございます。', 'Tôi mới là người mong được giúp. Cảm ơn anh.', 'Kochira koso. Arigatō gozaimasu.'],
          ],
        },
        reorder: [
          ['はじめまして|、|リン|です|。', 'Rất hân hạnh, tôi là Linh.'],
          ['どうぞ|よろしく|お願いします|。', 'Rất mong được giúp đỡ.'],
        ],
        grammarQ: [
          { prompt: 'Chào buổi sáng anh Tanaka (田中) bằng mẫu lịch sự + さん.', source: '田中', pattern: 'おはようございます、＋ tên ＋ さん。', answers: ['おはようございます、田中さん。', 'おはようございます、田中さん', 'おはようございます田中さん'] },
        ],
        tip: ['Cúi chào', 'Người Nhật thường kèm cái cúi đầu nhẹ khi chào và cảm ơn. Chào càng trang trọng thì cúi càng sâu; với bạn bè một cái gật đầu là đủ.'],
      },
      {
        title: { vi: 'Tôi là… (Aは Bです)', en: 'I Am… (A は B です)' },
        intro: 'Bạn cần nói mình là ai, làm nghề gì và đến từ nước nào. Bài này dạy mẫu câu nền tảng của tiếng Nhật: AはBです, cách phủ định và cách hỏi bằng か.',
        vocab: [
          ['私', 'わたし (watashi)', 'pronoun', 'tôi', '私はリンです。', 'Tôi là Linh.'],
          ['学生', 'がくせい (gakusei)', 'noun', 'học sinh, sinh viên', '私は学生です。', 'Tôi là sinh viên.'],
          ['先生', 'せんせい (sensei)', 'noun', 'giáo viên, thầy cô', '田中さんは先生です。', 'Anh Tanaka là giáo viên.'],
          ['会社員', 'かいしゃいん (kaishain)', 'noun', 'nhân viên công ty', '父は会社員です。', 'Bố tôi là nhân viên công ty.'],
          ['医者', 'いしゃ (isha)', 'noun', 'bác sĩ', '山田さんは医者です。', 'Chị Yamada là bác sĩ.'],
          ['ベトナム', 'ベトナム (betonamu)', 'noun', 'Việt Nam', '私はベトナムから来ました。', 'Tôi đến từ Việt Nam.'],
          ['日本', 'にほん (nihon)', 'noun', 'Nhật Bản', '日本は小さい国です。', 'Nhật Bản là một đất nước nhỏ.'],
          ['人', 'じん (jin)', 'suffix', '-người (quốc tịch)', 'リンさんはベトナム人です。', 'Linh là người Việt Nam.'],
          ['友達', 'ともだち (tomodachi)', 'noun', 'bạn bè', 'こちらは友達のミンさんです。', 'Đây là bạn tôi, Minh.'],
          ['名前', 'なまえ (namae)', 'noun', 'tên', 'お名前は何ですか。', 'Tên bạn là gì ạ?'],
        ],
        grammar: {
          title: 'Aは Bです / Aは Bではありません / …ですか',
          explain: 'Trợ từ は (đọc là “wa”) đánh dấu chủ đề của câu; です là từ kết câu lịch sự, tương đương “là”. Phủ định: ではありません (hoặc じゃありません). Câu hỏi chỉ cần thêm か cuối câu, không đổi trật tự từ. Tiếng Nhật thường lược bỏ chủ ngữ khi đã rõ, nên đừng nói 私 quá nhiều.',
          examples: [
            ['私は学生です。', 'Tôi là sinh viên.', 'Watashi wa gakusei desu.'],
            ['リンさんは先生ではありません。', 'Linh không phải là giáo viên.', 'Rin-san wa sensei dewa arimasen.'],
            ['田中さんは日本人ですか。', 'Anh Tanaka là người Nhật phải không?', 'Tanaka-san wa nihonjin desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'お名前は何ですか。', 'Tên bạn là gì?', 'Onamae wa nan desu ka.'],
            ['リン', 'リンです。ベトナムから来ました。', 'Tôi là Linh. Tôi đến từ Việt Nam.', 'Rin desu. Betonamu kara kimashita.'],
            ['田中', 'リンさんは学生ですか。', 'Linh là sinh viên phải không?', 'Rin-san wa gakusei desu ka.'],
            ['リン', 'はい、学生です。田中さんは先生ですか。', 'Vâng, tôi là sinh viên. Anh Tanaka là giáo viên phải không?', 'Hai, gakusei desu. Tanaka-san wa sensei desu ka.'],
            ['田中', 'いいえ、会社員です。', 'Không, tôi là nhân viên công ty.', 'Iie, kaishain desu.'],
          ],
        },
        reorder: [
          ['私|は|学生|です|。', 'Tôi là sinh viên.'],
          ['田中さん|は|先生|です|か|。', 'Anh Tanaka là giáo viên phải không?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Linh không phải là giáo viên” bằng dạng phủ định lịch sự.', source: 'リンさん / 先生', pattern: 'Aは Bではありません。', answers: ['リンさんは先生ではありません。', 'リンさんは先生ではありません', 'リンさんは先生じゃありません。', 'リンさんは先生じゃありません'] },
          { prompt: 'Hỏi anh Tanaka có phải người Nhật không.', source: '田中さん / 日本人', pattern: 'Aは Bですか。', answers: ['田中さんは日本人ですか。', '田中さんは日本人ですか', '田中さんは日本人ですか？', '田中さんは日本人ですか?'] },
        ],
        tip: ['は đọc là “wa”', 'Khi làm trợ từ, は được đọc là “wa”, không phải “ha”. Cách viết và cách đọc khác nhau là điều rất thường gặp ở các trợ từ như は, へ, を.'],
      },
      {
        title: { vi: 'Số đếm, tuổi và số điện thoại', en: 'Numbers, Age and Phone Numbers' },
        intro: 'Bạn cần nói tuổi, số điện thoại và đếm đồ vật cơ bản. Sau bài này bạn đếm được từ 0 đến 100, hỏi và trả lời tuổi bằng 〜さい và đọc số điện thoại.',
        vocab: [
          ['一', 'いち (ichi)', 'number', 'một', '一から十まで言います。', 'Tôi đọc từ một đến mười.'],
          ['二', 'に (ni)', 'number', 'hai', '二時に会います。', 'Chúng ta gặp nhau lúc hai giờ.'],
          ['三', 'さん (san)', 'number', 'ba', '三人で行きます。', 'Ba người cùng đi.'],
          ['四', 'よん (yon)', 'number', 'bốn', '四月に日本へ行きます。', 'Tháng Tư tôi đi Nhật.'],
          ['五', 'ご (go)', 'number', 'năm', '五時に帰ります。', 'Tôi về nhà lúc năm giờ.'],
          ['十', 'じゅう (jū)', 'number', 'mười', '十人の学生がいます。', 'Có mười sinh viên.'],
          ['百', 'ひゃく (hyaku)', 'number', 'một trăm', '百円です。', 'Một trăm yên.'],
          ['歳', 'さい (sai)', 'counter', 'tuổi', '私は二十歳です。', 'Tôi hai mươi tuổi.'],
          ['電話番号', 'でんわばんごう (denwa bangō)', 'noun', 'số điện thoại', '電話番号は何番ですか。', 'Số điện thoại của bạn là số mấy?'],
          ['何', 'なん (nan)', 'pronoun', 'cái gì, mấy', 'これは何ですか。', 'Đây là cái gì?'],
        ],
        grammar: {
          title: 'Số đếm 0–100 và 〜歳 (さい)',
          explain: 'Các số 1–10: いち, に, さん, よん/し, ご, ろく, なな/しち, はち, きゅう/く, じゅう. Số lớn ghép theo quy tắc: 11 = 十一 (じゅういち), 20 = 二十 (にじゅう), 35 = 三十五 (さんじゅうご). Tuổi dùng 〜歳: 一歳 (いっさい), 八歳 (はっさい), 二十歳 (はたち, đặc biệt). Hỏi tuổi lịch sự: おいくつですか; thân mật: 何歳ですか.',
          examples: [
            ['私は二十歳です。', 'Tôi hai mươi tuổi.', 'Watashi wa hatachi desu.'],
            ['お母さんは四十五歳です。', 'Mẹ tôi bốn mươi lăm tuổi.', 'Okāsan wa yonjū-go sai desu.'],
            ['電話番号は〇九〇の一二三四です。', 'Số điện thoại là 090-1234.', 'Denwa bangō wa zero-kyū-zero no ichi-ni-san-yon desu.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'リンさんは何歳ですか。', 'Linh bao nhiêu tuổi?', 'Rin-san wa nan-sai desu ka.'],
            ['リン', '二十歳です。田中さんは？', 'Tôi hai mươi tuổi. Còn anh Tanaka?', 'Hatachi desu. Tanaka-san wa?'],
            ['田中', '三十五歳です。電話番号は何番ですか。', 'Tôi ba mươi lăm tuổi. Số điện thoại của bạn là số mấy?', 'Sanjū-go sai desu. Denwa bangō wa nan-ban desu ka.'],
            ['リン', '〇九〇の五五五の一二三四です。', 'Là 090-555-1234.', 'Zero-kyū-zero no go-go-go no ichi-ni-san-yon desu.'],
          ],
        },
        reorder: [
          ['私|は|二十歳|です|。', 'Tôi hai mươi tuổi.'],
          ['電話番号|は|何番|です|か|。', 'Số điện thoại là số mấy?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi hai mươi tuổi” (dùng 歳).', source: '私 / 20', pattern: 'Aは ○○歳です。', answers: ['私は二十歳です。', '私は二十歳です', '私は20歳です。', '私は20歳です', '私ははたちです。', '私ははたちです'] },
        ],
        tip: ['Hai cách đọc 4, 7, 9', 'Số 4 (よん/し), 7 (なな/しち), 9 (きゅう/く) có hai cách đọc. Với số điện thoại và tuổi, người Nhật thường chọn よん, なな, きゅう để tránh nhầm; し gợi chữ “chết” (死) nên bị tránh.'],
      },
    ],
  },
  {
    level: 'N5',
    names: { vi: 'Đồ vật và gia đình', en: 'Things and Family' },
    lessons: [
      {
        title: { vi: 'Đây là gì? (これ・それ・あれ)', en: 'What Is This? (kore, sore, are)' },
        intro: 'Bạn muốn hỏi và gọi tên đồ vật xung quanh. Bài này dạy hệ thống chỉ định これ・それ・あれ, この・その・あの, cùng trợ từ の để nói “của ai”.',
        vocab: [
          ['本', 'ほん (hon)', 'noun', 'sách', 'これは日本語の本です。', 'Đây là sách tiếng Nhật.'],
          ['鉛筆', 'えんぴつ (enpitsu)', 'noun', 'bút chì', 'それは私の鉛筆です。', 'Đó là bút chì của tôi.'],
          ['かばん', 'かばん (kaban)', 'noun', 'cặp, túi', 'あのかばんは先生のです。', 'Cái cặp kia là của thầy.'],
          ['傘', 'かさ (kasa)', 'noun', 'cái ô', '傘はどこですか。', 'Cái ô ở đâu?'],
          ['携帯電話', 'けいたいでんわ (keitai denwa)', 'noun', 'điện thoại di động', '携帯電話を忘れました。', 'Tôi quên điện thoại di động.'],
          ['時計', 'とけい (tokei)', 'noun', 'đồng hồ', 'この時計は高いです。', 'Cái đồng hồ này đắt.'],
          ['机', 'つくえ (tsukue)', 'noun', 'bàn học', '机の上に本があります。', 'Trên bàn có quyển sách.'],
          ['椅子', 'いす (isu)', 'noun', 'ghế', '椅子に座ります。', 'Tôi ngồi xuống ghế.'],
          ['辞書', 'じしょ (jisho)', 'noun', 'từ điển', 'これは辞書ですか。', 'Đây có phải từ điển không?'],
          ['誰', 'だれ (dare)', 'pronoun', 'ai', 'あの人は誰ですか。', 'Người kia là ai?'],
        ],
        grammar: {
          title: 'これ / それ / あれ và この / その / あの + の',
          explain: 'これ (gần người nói), それ (gần người nghe), あれ (xa cả hai) thay thế cho danh từ và đứng một mình. この/その/あの phải đi kèm danh từ: この本, その傘, あの時計. Trợ từ の nối hai danh từ để chỉ sở hữu hoặc thuộc tính: 私の本 (sách của tôi), 日本語の本 (sách tiếng Nhật). Hỏi “cái gì” dùng 何, hỏi “của ai” dùng 誰の.',
          examples: [
            ['これは私の本です。', 'Đây là sách của tôi.', 'Kore wa watashi no hon desu.'],
            ['それは何ですか。', 'Đó là cái gì?', 'Sore wa nan desu ka.'],
            ['あの傘は誰のですか。', 'Cái ô kia là của ai?', 'Ano kasa wa dare no desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、それは何ですか。', 'Xin lỗi, đó là cái gì vậy?', 'Sumimasen, sore wa nan desu ka.'],
            ['田中', 'これは辞書です。', 'Đây là từ điển.', 'Kore wa jisho desu.'],
            ['リン', 'あのかばんは誰のですか。', 'Cái cặp kia là của ai?', 'Ano kaban wa dare no desu ka.'],
            ['田中', 'あれは先生のです。', 'Kia là của thầy giáo.', 'Are wa sensei no desu.'],
          ],
        },
        reorder: [
          ['これ|は|辞書|です|。', 'Đây là từ điển.'],
          ['あの|かばん|は|誰|の|です|か|。', 'Cái cặp kia là của ai?'],
        ],
        grammarQ: [
          { prompt: 'Nói “Đây là sách của tôi”.', source: 'これ / 私 / 本', pattern: 'これは ○○の ○○です。', answers: ['これは私の本です。', 'これは私の本です', 'これはわたしの本です。', 'これはわたしの本です'] },
        ],
        tip: ['の ở cuối câu', 'Khi danh từ đã rõ, có thể bỏ nó sau の: 「あれは先生のです」 = “Kia là (cái) của thầy”. Đây là cách nói rất tự nhiên trong hội thoại.'],
      },
      {
        title: { vi: 'Gia đình của tôi', en: 'My Family' },
        intro: 'Bạn muốn giới thiệu gia đình với bạn mới. Bài này dạy từ chỉ người thân (nói về gia đình mình và gia đình người khác), cách nói số người và mẫu 〜がいます.',
        vocab: [
          ['家族', 'かぞく (kazoku)', 'noun', 'gia đình', '私の家族は五人です。', 'Gia đình tôi có năm người.'],
          ['父', 'ちち (chichi)', 'noun', 'bố (của mình)', '父は会社員です。', 'Bố tôi là nhân viên công ty.'],
          ['母', 'はは (haha)', 'noun', 'mẹ (của mình)', '母は料理が上手です。', 'Mẹ tôi nấu ăn giỏi.'],
          ['兄', 'あに (ani)', 'noun', 'anh trai (của mình)', '兄は東京に住んでいます。', 'Anh trai tôi sống ở Tokyo.'],
          ['姉', 'あね (ane)', 'noun', 'chị gái (của mình)', '姉は先生です。', 'Chị gái tôi là giáo viên.'],
          ['弟', 'おとうと (otōto)', 'noun', 'em trai (của mình)', '弟は高校生です。', 'Em trai tôi là học sinh cấp ba.'],
          ['妹', 'いもうと (imōto)', 'noun', 'em gái (của mình)', '妹はかわいいです。', 'Em gái tôi dễ thương.'],
          ['お父さん', 'おとうさん (otōsan)', 'noun', 'bố (của người khác)', 'お父さんはお元気ですか。', 'Bố bạn có khỏe không?'],
          ['お母さん', 'おかあさん (okāsan)', 'noun', 'mẹ (của người khác)', 'お母さんは何歳ですか。', 'Mẹ bạn bao nhiêu tuổi?'],
          ['一人', 'ひとり (hitori)', 'noun', 'một người', '妹が一人います。', 'Tôi có một em gái.'],
        ],
        grammar: {
          title: 'Từ chỉ người thân + がいます / 〜人',
          explain: 'Tiếng Nhật phân biệt gia đình mình (父, 母, 兄, 姉…) và gia đình người khác (お父さん, お母さん, お兄さん, お姉さん…). Khi nói về người trong nhà mình dùng từ khiêm nhường; khi hỏi về nhà người khác dùng từ kính trọng. Có người dùng います: 妹がいます (tôi có em gái). Đếm người: 一人, 二人, 三人 (さんにん)… với ngoại lệ ひとり, ふたり.',
          examples: [
            ['私の家族は四人です。', 'Gia đình tôi có bốn người.', 'Watashi no kazoku wa yonin desu.'],
            ['兄が一人います。', 'Tôi có một anh trai.', 'Ani ga hitori imasu.'],
            ['お母さんは先生ですか。', 'Mẹ bạn là giáo viên phải không?', 'Okāsan wa sensei desu ka.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'リンさんの家族は何人ですか。', 'Gia đình Linh có mấy người?', 'Rin-san no kazoku wa nannin desu ka.'],
            ['リン', '四人です。父と母と妹と私です。', 'Bốn người. Bố, mẹ, em gái và tôi.', 'Yonin desu. Chichi to haha to imōto to watashi desu.'],
            ['田中', 'お父さんは何をしていますか。', 'Bố bạn làm nghề gì?', 'Otōsan wa nani o shite imasu ka.'],
            ['リン', '父は会社員です。母は先生です。', 'Bố tôi là nhân viên công ty. Mẹ tôi là giáo viên.', 'Chichi wa kaishain desu. Haha wa sensei desu.'],
          ],
        },
        reorder: [
          ['私|の|家族|は|五人|です|。', 'Gia đình tôi có năm người.'],
          ['父|は|会社員|です|。', 'Bố tôi là nhân viên công ty.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi có một em gái” bằng mẫu がいます.', source: '妹 / 一人', pattern: '○○が 一人います。', answers: ['妹が一人います。', '妹が一人います', '妹がひとりいます。', '妹がひとりいます'] },
        ],
        tip: ['Nhà mình – nhà người', 'Gọi bố mình là 父 khi nói với người ngoài, nhưng gọi bố bạn là お父さん. Dùng nhầm sẽ nghe rất thiếu tế nhị. Trong nhà, trẻ em vẫn gọi trực tiếp bố mẹ mình là お父さん, お母さん.'],
      },
      {
        title: { vi: 'Mô tả người và vật (tính từ)', en: 'Describing People and Things' },
        intro: 'Bạn muốn nhận xét một chiếc áo đẹp, một quán ăn rẻ hay một người tốt bụng. Bài này dạy hai loại tính từ い và な, cách phủ định và ghép với danh từ.',
        vocab: [
          ['大きい', 'おおきい (ōkii)', 'i-adjective', 'to, lớn', 'これは大きいかばんです。', 'Đây là cái cặp lớn.'],
          ['小さい', 'ちいさい (chiisai)', 'i-adjective', 'nhỏ', '小さい犬がいます。', 'Có một chú chó nhỏ.'],
          ['新しい', 'あたらしい (atarashii)', 'i-adjective', 'mới', '新しい車を買いました。', 'Tôi đã mua chiếc xe mới.'],
          ['古い', 'ふるい (furui)', 'i-adjective', 'cũ', '古い本を読みます。', 'Tôi đọc sách cũ.'],
          ['高い', 'たかい (takai)', 'i-adjective', 'đắt; cao', 'この時計は高いです。', 'Chiếc đồng hồ này đắt.'],
          ['安い', 'やすい (yasui)', 'i-adjective', 'rẻ', 'このお店は安いです。', 'Cửa hàng này rẻ.'],
          ['おいしい', 'おいしい (oishii)', 'i-adjective', 'ngon', 'このラーメンはおいしいです。', 'Món mì ramen này ngon.'],
          ['きれい', 'きれい (kirei)', 'na-adjective', 'đẹp; sạch', 'あの町はきれいです。', 'Thị trấn kia sạch đẹp.'],
          ['有名', 'ゆうめい (yūmei)', 'na-adjective', 'nổi tiếng', '有名な先生に会いました。', 'Tôi đã gặp một thầy giáo nổi tiếng.'],
          ['親切', 'しんせつ (shinsetsu)', 'na-adjective', 'tốt bụng, thân thiện', '田中さんは親切です。', 'Anh Tanaka rất tốt bụng.'],
        ],
        grammar: {
          title: 'Tính từ い・な: câu kết thúc, bổ nghĩa danh từ, phủ định',
          explain: 'Tính từ い kết thúc bằng い: 高い→高いです; phủ định bỏ い thêm くないです (高くないです); bổ nghĩa danh từ trực tiếp (高い本). Tính từ な cần な khi đứng trước danh từ (きれいな町), và phủ định bằng ではありません (きれいではありません). Ngoại lệ: いい (tốt) → よくないです. Trong câu kết thúc, cả hai loại đều thêm です.',
          examples: [
            ['この本は高くないです。', 'Quyển sách này không đắt.', 'Kono hon wa takakunai desu.'],
            ['きれいな町ですね。', 'Đúng là một thị trấn đẹp nhỉ.', 'Kirei na machi desu ne.'],
            ['田中さんは親切な先生です。', 'Anh Tanaka là một giáo viên tốt bụng.', 'Tanaka-san wa shinsetsu na sensei desu.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'この時計はきれいですね。', 'Chiếc đồng hồ này đẹp nhỉ.', 'Kono tokei wa kirei desu ne.'],
            ['田中', 'ありがとうございます。でも、高いです。', 'Cảm ơn bạn. Nhưng nó đắt.', 'Arigatō gozaimasu. Demo, takai desu.'],
            ['リン', 'あの時計は安いですか。', 'Chiếc đồng hồ kia có rẻ không?', 'Ano tokei wa yasui desu ka.'],
            ['田中', 'はい、安いです。でも、古いです。', 'Vâng, nó rẻ. Nhưng nó cũ.', 'Hai, yasui desu. Demo, furui desu.'],
          ],
        },
        reorder: [
          ['この|時計|は|高い|です|。', 'Chiếc đồng hồ này đắt.'],
          ['田中さん|は|親切|です|。', 'Anh Tanaka rất tốt bụng.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Quyển sách này không đắt” (phủ định tính từ い).', source: 'この本 / 高い', pattern: 'い-adj → くないです', answers: ['この本は高くないです。', 'この本は高くないです', 'この本は高くありません。', 'この本は高くありません'] },
        ],
        tip: ['きれい và おいしい', 'きれい trông giống tính từ い nhưng là tính từ な (きれいな町, きれいではありません). Hãy học nó như một ngoại lệ để tránh nói きれいくない.'],
      },
    ],
  },
  {
    level: 'N5',
    names: { vi: 'Một ngày của tôi', en: 'My Day' },
    lessons: [
      {
        title: { vi: 'Thời gian và thói quen hằng ngày', en: 'Time and Daily Routines' },
        intro: 'Bạn muốn kể mình thức dậy, đi làm, ăn và ngủ lúc mấy giờ. Bài này dạy cách nói giờ, các động từ hằng ngày dạng ます/ません và trợ từ に chỉ thời điểm.',
        vocab: [
          ['起きます', 'おきます (okimasu)', 'verb', 'thức dậy', '毎朝六時に起きます。', 'Mỗi sáng tôi thức dậy lúc sáu giờ.'],
          ['寝ます', 'ねます (nemasu)', 'verb', 'đi ngủ', '夜十一時に寝ます。', 'Buổi tối tôi đi ngủ lúc mười một giờ.'],
          ['働きます', 'はたらきます (hatarakimasu)', 'verb', 'làm việc', '父は会社で働きます。', 'Bố tôi làm việc ở công ty.'],
          ['勉強します', 'べんきょうします (benkyō shimasu)', 'verb', 'học', '図書館で日本語を勉強します。', 'Tôi học tiếng Nhật ở thư viện.'],
          ['食べます', 'たべます (tabemasu)', 'verb', 'ăn', '朝ごはんを食べます。', 'Tôi ăn sáng.'],
          ['行きます', 'いきます (ikimasu)', 'verb', 'đi', '学校へ行きます。', 'Tôi đi đến trường.'],
          ['帰ります', 'かえります (kaerimasu)', 'verb', 'về', '五時に家へ帰ります。', 'Tôi về nhà lúc năm giờ.'],
          ['毎日', 'まいにち (mainichi)', 'noun', 'mỗi ngày', '毎日運動します。', 'Mỗi ngày tôi tập thể dục.'],
          ['朝', 'あさ (asa)', 'noun', 'buổi sáng', '朝は忙しいです。', 'Buổi sáng tôi bận.'],
          ['時', 'じ (ji)', 'counter', 'giờ', '今、三時です。', 'Bây giờ là ba giờ.'],
        ],
        grammar: {
          title: 'Động từ ます / ません + 〜時に',
          explain: 'Động từ lịch sự kết thúc bằng ます (khẳng định, hiện tại/tương lai) và ません (phủ định): 起きます / 起きません. Giờ nói bằng số + 時: 七時, 八時… (四時 là よじ, 七時 là しちじ, 九時 là くじ). Trợ từ に đứng sau thời điểm cụ thể: 七時に起きます. Với 毎朝, 毎日 không cần に. Hỏi giờ: 何時ですか.',
          examples: [
            ['毎朝七時に起きます。', 'Mỗi sáng tôi thức dậy lúc bảy giờ.', 'Maiasa shichiji ni okimasu.'],
            ['十一時に寝ます。', 'Tôi đi ngủ lúc mười một giờ.', 'Jūichiji ni nemasu.'],
            ['日曜日は働きません。', 'Chủ nhật tôi không làm việc.', 'Nichiyōbi wa hatarakimasen.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'リンさんは毎朝何時に起きますか。', 'Mỗi sáng Linh dậy lúc mấy giờ?', 'Rin-san wa maiasa nanji ni okimasu ka.'],
            ['リン', '六時に起きます。', 'Tôi dậy lúc sáu giờ.', 'Rokuji ni okimasu.'],
            ['田中', '何時に学校へ行きますか。', 'Bạn đi học lúc mấy giờ?', 'Nanji ni gakkō e ikimasu ka.'],
            ['リン', '八時に行きます。五時に家へ帰ります。', 'Tôi đi lúc tám giờ. Tôi về nhà lúc năm giờ.', 'Hachiji ni ikimasu. Goji ni ie e kaerimasu.'],
          ],
        },
        reorder: [
          ['毎朝|六時|に|起きます|。', 'Mỗi sáng tôi dậy lúc sáu giờ.'],
          ['五時|に|家|へ|帰ります|。', 'Tôi về nhà lúc năm giờ.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi đi ngủ lúc mười một giờ”.', source: '十一時 / 寝ます', pattern: '○時に 動詞ます。', answers: ['十一時に寝ます。', '十一時に寝ます', '11時に寝ます。', '11時に寝ます'] },
        ],
        tip: ['AM và PM', 'Tiếng Nhật thêm 午前 (ごぜん, sáng) hoặc 午後 (ごご, chiều) trước giờ: 午後三時 = 3 giờ chiều. Hệ 24 giờ được dùng cho lịch tàu và công việc.'],
      },
      {
        title: { vi: 'Đồ ăn thức uống và sở thích', en: 'Food, Drinks and Likes' },
        intro: 'Bạn đi ăn cùng bạn Nhật và muốn gọi món, nói món mình thích. Bài này dạy từ vựng đồ ăn thức uống, trợ từ を chỉ tân ngữ và mẫu 〜が好きです.',
        vocab: [
          ['ごはん', 'ごはん (gohan)', 'noun', 'cơm; bữa ăn', 'ごはんを食べましょう。', 'Cùng ăn cơm nào.'],
          ['パン', 'パン (pan)', 'noun', 'bánh mì', '朝はパンを食べます。', 'Buổi sáng tôi ăn bánh mì.'],
          ['肉', 'にく (niku)', 'noun', 'thịt', '肉が好きです。', 'Tôi thích thịt.'],
          ['魚', 'さかな (sakana)', 'noun', 'cá', '魚を食べますか。', 'Bạn có ăn cá không?'],
          ['野菜', 'やさい (yasai)', 'noun', 'rau', '野菜は体にいいです。', 'Rau tốt cho cơ thể.'],
          ['水', 'みず (mizu)', 'noun', 'nước', '水をください。', 'Cho tôi xin nước.'],
          ['お茶', 'おちゃ (ocha)', 'noun', 'trà', 'お茶を飲みます。', 'Tôi uống trà.'],
          ['コーヒー', 'コーヒー (kōhī)', 'noun', 'cà phê', 'コーヒーが好きです。', 'Tôi thích cà phê.'],
          ['飲みます', 'のみます (nomimasu)', 'verb', 'uống', '毎朝ミルクを飲みます。', 'Mỗi sáng tôi uống sữa.'],
          ['好き', 'すき (suki)', 'na-adjective', 'thích', '私は魚が好きです。', 'Tôi thích cá.'],
        ],
        grammar: {
          title: 'Aを Vます / Aが好きです',
          explain: 'Trợ từ を (đọc “o”) đánh dấu tân ngữ trực tiếp của động từ: コーヒーを飲みます (uống cà phê). Muốn nói mình thích cái gì dùng mẫu AがBです với 好き: 魚が好きです. Phủ định: 好きではありません. Hỏi “bạn thích gì?”: 何が好きですか. Mời ai làm gì dùng 〜ましょう (cùng làm nào).',
          examples: [
            ['毎朝コーヒーを飲みます。', 'Mỗi sáng tôi uống cà phê.', 'Maiasa kōhī o nomimasu.'],
            ['私は魚が好きです。', 'Tôi thích cá.', 'Watashi wa sakana ga suki desu.'],
            ['一緒にごはんを食べましょう。', 'Chúng ta cùng ăn cơm nào.', 'Issho ni gohan o tabemashō.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', 'リンさんは何が好きですか。', 'Linh thích món gì?', 'Rin-san wa nani ga suki desu ka.'],
            ['リン', '魚が好きです。肉は好きではありません。', 'Tôi thích cá. Tôi không thích thịt.', 'Sakana ga suki desu. Niku wa suki dewa arimasen.'],
            ['田中', 'じゃ、一緒にごはんを食べましょう。', 'Vậy cùng đi ăn cơm nào.', 'Ja, issho ni gohan o tabemashō.'],
            ['リン', 'はい、お願いします。お茶も飲みましょう。', 'Vâng. Mình cũng uống trà nữa nhé.', 'Hai, onegaishimasu. Ocha mo nomimashō.'],
          ],
        },
        reorder: [
          ['私|は|魚|が|好き|です|。', 'Tôi thích cá.'],
          ['毎朝|コーヒー|を|飲みます|。', 'Mỗi sáng tôi uống cà phê.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi uống trà” bằng mẫu Aを Vます.', source: 'お茶 / 飲みます', pattern: 'Aを Vます。', answers: ['お茶を飲みます。', 'お茶を飲みます', '私はお茶を飲みます。', '私はお茶を飲みます'] },
          { prompt: 'Nói “Tôi thích cà phê”.', source: 'コーヒー / 好き', pattern: 'Aが好きです。', answers: ['コーヒーが好きです。', 'コーヒーが好きです', '私はコーヒーが好きです。', '私はコーヒーが好きです'] },
        ],
        tip: ['Mời bằng 〜ましょう', '〜ましょう vừa là “hãy cùng làm nào” vừa là cách rủ nhẹ nhàng. Hỏi ý kiến thì dùng 〜ませんか (“bạn có muốn… không?”), lịch sự hơn.'],
      },
      {
        title: { vi: 'Nhà cửa và nơi chốn (あります・います)', en: 'Home and Places (arimasu, imasu)' },
        intro: 'Bạn muốn nói trong phòng có gì, ai đang ở đâu. Bài này dạy hai động từ tồn tại あります (vật) và います (người, động vật) cùng từ chỉ vị trí.',
        vocab: [
          ['家', 'いえ (ie)', 'noun', 'nhà', '私の家は駅の近くです。', 'Nhà tôi ở gần ga.'],
          ['部屋', 'へや (heya)', 'noun', 'căn phòng', '部屋はきれいです。', 'Căn phòng sạch sẽ.'],
          ['台所', 'だいどころ (daidokoro)', 'noun', 'nhà bếp', '母は台所にいます。', 'Mẹ tôi đang ở trong bếp.'],
          ['駅', 'えき (eki)', 'noun', 'nhà ga', '駅は右にあります。', 'Nhà ga ở bên phải.'],
          ['上', 'うえ (ue)', 'noun', 'phía trên', '机の上に辞書があります。', 'Trên bàn có từ điển.'],
          ['下', 'した (shita)', 'noun', 'phía dưới', '椅子の下に猫がいます。', 'Có con mèo dưới ghế.'],
          ['中', 'なか (naka)', 'noun', 'bên trong', 'かばんの中に鍵があります。', 'Trong cặp có chìa khóa.'],
          ['隣', 'となり (tonari)', 'noun', 'bên cạnh', '銀行の隣に郵便局があります。', 'Cạnh ngân hàng có bưu điện.'],
          ['猫', 'ねこ (neko)', 'noun', 'con mèo', '猫が一匹います。', 'Có một con mèo.'],
          ['どこ', 'どこ (doko)', 'pronoun', 'ở đâu', '田中さんはどこですか。', 'Anh Tanaka ở đâu?'],
        ],
        grammar: {
          title: 'Nに Nがあります / います',
          explain: 'あります dùng cho vật không tự di chuyển (sách, bàn, ga…); います dùng cho người và động vật. Mẫu: nơi chốn + に + chủ thể + が + あります/います (“ở … có …”). Mẫu ngược để hỏi vị trí: Aは + nơi chốn + にあります/います. Từ chỉ vị trí đi với の: 机の上, 椅子の下, かばんの中, 銀行の隣. Phủ định: ありません / いません.',
          examples: [
            ['机の上に本があります。', 'Trên bàn có quyển sách.', 'Tsukue no ue ni hon ga arimasu.'],
            ['台所に母がいます。', 'Mẹ đang ở trong bếp.', 'Daidokoro ni haha ga imasu.'],
            ['駅は銀行の隣にあります。', 'Nhà ga ở cạnh ngân hàng.', 'Eki wa ginkō no tonari ni arimasu.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、駅はどこですか。', 'Xin lỗi, nhà ga ở đâu ạ?', 'Sumimasen, eki wa doko desu ka.'],
            ['田中', '銀行の隣にあります。', 'Nó ở cạnh ngân hàng.', 'Ginkō no tonari ni arimasu.'],
            ['リン', '駅に郵便局がありますか。', 'Ở ga có bưu điện không?', 'Eki ni yūbinkyoku ga arimasu ka.'],
            ['田中', 'いいえ、ありません。', 'Không, không có.', 'Iie, arimasen.'],
          ],
        },
        reorder: [
          ['机|の|上|に|本|が|あります|。', 'Trên bàn có quyển sách.'],
          ['母|は|台所|に|います|。', 'Mẹ tôi ở trong bếp.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Dưới ghế có một con mèo” (dùng います).', source: '椅子の下 / 猫', pattern: '場所に Nが います。', answers: ['椅子の下に猫がいます。', '椅子の下に猫がいます', '椅子の下にねこがいます。', '椅子の下にねこがいます'] },
        ],
        tip: ['あります hay います?', 'Quy tắc nhanh: vật sống, biết di chuyển → います; còn lại → あります. Ngoại lệ vui: cây cối là あります, nhưng robot hoặc búp bê thường vẫn dùng あります.'],
      },
    ],
  },
  {
    level: 'N5',
    names: { vi: 'Mua sắm và đi lại', en: 'Shopping and Getting Around' },
    lessons: [
      {
        title: { vi: 'Mua sắm và hỏi giá', en: 'Shopping and Prices' },
        intro: 'Bạn vào cửa hàng ở Nhật, muốn hỏi giá và mua đồ. Bài này dạy cách hỏi いくら, đọc số tiền bằng yên và các câu thường dùng khi mua sắm.',
        vocab: [
          ['いくら', 'いくら (ikura)', 'pronoun', 'bao nhiêu tiền', 'これはいくらですか。', 'Cái này giá bao nhiêu?'],
          ['円', 'えん (en)', 'counter', 'yên (tiền Nhật)', 'この本は千円です。', 'Quyển sách này một nghìn yên.'],
          ['千', 'せん (sen)', 'number', 'nghìn', '千五百円です。', 'Một nghìn năm trăm yên.'],
          ['万', 'まん (man)', 'number', 'vạn (mười nghìn)', '一万円を出します。', 'Tôi đưa tờ mười nghìn yên.'],
          ['店', 'みせ (mise)', 'noun', 'cửa hàng', 'あの店は安いです。', 'Cửa hàng kia rẻ.'],
          ['買います', 'かいます (kaimasu)', 'verb', 'mua', '新しい靴を買います。', 'Tôi mua đôi giày mới.'],
          ['靴', 'くつ (kutsu)', 'noun', 'giày', '靴を見てもいいですか。', 'Tôi xem đôi giày được không?'],
          ['シャツ', 'シャツ (shatsu)', 'noun', 'áo sơ mi', 'このシャツは三千円です。', 'Chiếc áo sơ mi này ba nghìn yên.'],
          ['ください', 'ください (kudasai)', 'phrase', 'xin hãy cho tôi', 'それをください。', 'Cho tôi cái đó.'],
          ['全部で', 'ぜんぶで (zenbu de)', 'adverb', 'tất cả là', '全部で二千円です。', 'Tất cả là hai nghìn yên.'],
        ],
        grammar: {
          title: 'いくらですか / Nをください / 数 + 円',
          explain: 'Hỏi giá bằng いくらですか. Số tiền đọc theo số + 円: 百円, 千円, 一万円 (với 三百 là さんびゃく, 六百 là ろっぴゃく, 八百 là はっぴゃく, 三千 là さんぜん, 八千 là はっせん). Gọi món hoặc xin mua bằng Nをください. Muốn mua nhiều cái ghép số lượng: これを二つください (cho tôi hai cái này).',
          examples: [
            ['これはいくらですか。', 'Cái này giá bao nhiêu?', 'Kore wa ikura desu ka.'],
            ['このシャツは三千円です。', 'Chiếc áo sơ mi này ba nghìn yên.', 'Kono shatsu wa sanzen-en desu.'],
            ['それを二つください。', 'Cho tôi hai cái đó.', 'Sore o futatsu kudasai.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、この靴はいくらですか。', 'Xin lỗi, đôi giày này giá bao nhiêu ạ?', 'Sumimasen, kono kutsu wa ikura desu ka.'],
            ['店員', '八千円です。', 'Tám nghìn yên.', 'Hassen-en desu.'],
            ['リン', 'ちょっと高いですね。あのシャツはいくらですか。', 'Hơi đắt nhỉ. Còn chiếc áo sơ mi kia giá bao nhiêu?', 'Chotto takai desu ne. Ano shatsu wa ikura desu ka.'],
            ['店員', '三千円です。', 'Ba nghìn yên.', 'Sanzen-en desu.'],
            ['リン', 'じゃ、それをください。', 'Vậy cho tôi cái đó.', 'Ja, sore o kudasai.'],
          ],
        },
        reorder: [
          ['これ|は|いくら|です|か|。', 'Cái này giá bao nhiêu?'],
          ['この|シャツ|は|三千円|です|。', 'Chiếc áo này ba nghìn yên.'],
        ],
        grammarQ: [
          { prompt: 'Hỏi giá của chiếc áo sơ mi (シャツ) này.', source: 'このシャツ', pattern: 'N は いくらですか。', answers: ['このシャツはいくらですか。', 'このシャツはいくらですか', 'このシャツはいくらですか？', 'このシャツはいくらですか?'] },
        ],
        tip: ['Tiền mặt là vua', 'Ở Nhật, nhiều cửa hàng nhỏ vẫn chỉ nhận tiền mặt. Khi trả tiền, người Nhật thường đặt tiền vào khay nhỏ trên quầy thay vì đưa thẳng vào tay người bán.'],
      },
      {
        title: { vi: 'Đi lại bằng phương tiện', en: 'Getting Around' },
        intro: 'Bạn cần hỏi đường, đi tàu và rủ bạn đi chơi. Bài này dạy trợ từ へ (hướng đi), で (phương tiện), từ chỉ phương hướng và mẫu rủ 〜ませんか.',
        vocab: [
          ['電車', 'でんしゃ (densha)', 'noun', 'tàu điện', '電車で学校へ行きます。', 'Tôi đi học bằng tàu điện.'],
          ['バス', 'バス (basu)', 'noun', 'xe buýt', 'バスは十分かかります。', 'Xe buýt mất mười phút.'],
          ['地下鉄', 'ちかてつ (chikatetsu)', 'noun', 'tàu điện ngầm', '地下鉄に乗ります。', 'Tôi đi tàu điện ngầm.'],
          ['自転車', 'じてんしゃ (jitensha)', 'noun', 'xe đạp', '自転車で来ました。', 'Tôi đã đến bằng xe đạp.'],
          ['歩いて', 'あるいて (aruite)', 'adverb', 'đi bộ', '歩いて五分です。', 'Đi bộ mất năm phút.'],
          ['右', 'みぎ (migi)', 'noun', 'bên phải', '右に曲がってください。', 'Hãy rẽ phải.'],
          ['左', 'ひだり (hidari)', 'noun', 'bên trái', '左にコンビニがあります。', 'Bên trái có cửa hàng tiện lợi.'],
          ['まっすぐ', 'まっすぐ (massugu)', 'adverb', 'thẳng', 'まっすぐ行ってください。', 'Hãy đi thẳng.'],
          ['空港', 'くうこう (kūkō)', 'noun', 'sân bay', '空港へ行きます。', 'Tôi đi đến sân bay.'],
          ['乗ります', 'のります (norimasu)', 'verb', 'đi (xe), lên (xe)', '駅で電車に乗ります。', 'Tôi lên tàu điện ở ga.'],
        ],
        grammar: {
          title: 'Nへ行きます / Nで行きます / Vませんか',
          explain: 'へ (đọc “e”) chỉ hướng đi: 学校へ行きます. で chỉ phương tiện hoặc cách thức: 電車で行きます (đi bằng tàu), 歩いて行きます (đi bộ). Rủ ai làm gì: 〜ませんか (“bạn có muốn… không?”). Hỏi cách đến: どうやって行きますか. Đường đi: まっすぐ, 右, 左 + に曲がってください.',
          examples: [
            ['電車で学校へ行きます。', 'Tôi đi đến trường bằng tàu điện.', 'Densha de gakkō e ikimasu.'],
            ['空港までバスで行きませんか。', 'Chúng ta cùng đi đến sân bay bằng xe buýt nhé?', 'Kūkō made basu de ikimasen ka.'],
            ['まっすぐ行って、右に曲がってください。', 'Hãy đi thẳng rồi rẽ phải.', 'Massugu itte, migi ni magatte kudasai.'],
          ],
        },
        dialogue: {
          lines: [
            ['リン', 'すみません、空港へはどうやって行きますか。', 'Xin lỗi, đến sân bay đi thế nào ạ?', 'Sumimasen, kūkō e wa dō yatte ikimasu ka.'],
            ['田中', '駅で電車に乗ってください。', 'Hãy lên tàu điện ở ga.', 'Eki de densha ni notte kudasai.'],
            ['リン', '駅はどこですか。', 'Nhà ga ở đâu ạ?', 'Eki wa doko desu ka.'],
            ['田中', 'まっすぐ行って、右に曲がってください。歩いて五分です。', 'Hãy đi thẳng rồi rẽ phải. Đi bộ mất năm phút.', 'Massugu itte, migi ni magatte kudasai. Aruite gofun desu.'],
          ],
        },
        reorder: [
          ['電車|で|学校|へ|行きます|。', 'Tôi đi học bằng tàu điện.'],
          ['まっすぐ|行って|、|右|に|曲がってください|。', 'Hãy đi thẳng rồi rẽ phải.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Tôi đi đến trường bằng tàu điện”.', source: '電車 / 学校 / 行きます', pattern: 'Nで Nへ 行きます。', answers: ['電車で学校へ行きます。', '電車で学校へ行きます', '私は電車で学校へ行きます。', '私は電車で学校へ行きます'] },
        ],
        tip: ['Hỏi đường lịch sự', 'Mở đầu bằng すみません trước khi hỏi người lạ. Khi nhận được chỉ đường, hãy nói ありがとうございます và nhắc lại một lần để chắc chắn: 「まっすぐ行って、右ですね」.'],
      },
      {
        title: { vi: 'Cuối tuần và sở thích (quá khứ, 〜たい)', en: 'Weekend and Hobbies (Past, ~tai)' },
        intro: 'Bạn muốn kể cuối tuần vừa rồi đã làm gì và nói mình muốn làm gì. Bài này dạy quá khứ ました/ませんでした, mẫu 〜たいです và các trạng từ chỉ tần suất.',
        vocab: [
          ['週末', 'しゅうまつ (shūmatsu)', 'noun', 'cuối tuần', '週末は何をしますか。', 'Cuối tuần bạn làm gì?'],
          ['映画', 'えいが (eiga)', 'noun', 'phim', '映画を見ました。', 'Tôi đã xem phim.'],
          ['音楽', 'おんがく (ongaku)', 'noun', 'âm nhạc', '音楽を聞きます。', 'Tôi nghe nhạc.'],
          ['読みます', 'よみます (yomimasu)', 'verb', 'đọc', '毎晩本を読みます。', 'Mỗi tối tôi đọc sách.'],
          ['見ます', 'みます (mimasu)', 'verb', 'xem, nhìn', 'テレビを見ます。', 'Tôi xem tivi.'],
          ['会います', 'あいます (aimasu)', 'verb', 'gặp', '友達に会いました。', 'Tôi đã gặp bạn.'],
          ['散歩', 'さんぽ (sanpo)', 'noun', 'đi dạo', '公園で散歩します。', 'Tôi đi dạo ở công viên.'],
          ['料理', 'りょうり (ryōri)', 'noun', 'nấu ăn; món ăn', '母と料理をしました。', 'Tôi đã nấu ăn cùng mẹ.'],
          ['一緒に', 'いっしょに (issho ni)', 'adverb', 'cùng nhau', '一緒に行きませんか。', 'Chúng ta cùng đi nhé?'],
          ['よく', 'よく (yoku)', 'adverb', 'thường xuyên', 'よく映画を見ます。', 'Tôi hay xem phim.'],
        ],
        grammar: {
          title: 'Quá khứ ました / ませんでした và Vたいです',
          explain: 'Quá khứ lịch sự: Vました (khẳng định) và Vませんでした (phủ định). Quá khứ của です là でした, phủ định ではありませんでした. Muốn làm gì dùng bỏ ます thêm たいです: 見ます→見たいです (muốn xem); phủ định 見たくないです. Trạng từ tần suất thường dùng: いつも (luôn luôn), よく (thường), ときどき (thỉnh thoảng), あまり + phủ định (không mấy khi), 全然 + phủ định (hoàn toàn không).',
          examples: [
            ['昨日、友達に会いました。', 'Hôm qua tôi đã gặp bạn.', 'Kinō, tomodachi ni aimashita.'],
            ['日曜日はどこへも行きませんでした。', 'Chủ nhật tôi đã không đi đâu cả.', 'Nichiyōbi wa doko e mo ikimasen deshita.'],
            ['週末は映画を見たいです。', 'Cuối tuần tôi muốn xem phim.', 'Shūmatsu wa eiga o mitai desu.'],
          ],
        },
        dialogue: {
          lines: [
            ['田中', '週末は何をしましたか。', 'Cuối tuần bạn đã làm gì?', 'Shūmatsu wa nani o shimashita ka.'],
            ['リン', '友達に会いました。映画も見ました。', 'Tôi đã gặp bạn. Tôi cũng đã xem phim.', 'Tomodachi ni aimashita. Eiga mo mimashita.'],
            ['田中', 'いいですね。私も映画が見たいです。', 'Hay nhỉ. Tôi cũng muốn xem phim.', 'Ii desu ne. Watashi mo eiga ga mitai desu.'],
            ['リン', '来週、一緒に行きませんか。', 'Tuần sau chúng ta cùng đi nhé?', 'Raishū, issho ni ikimasen ka.'],
          ],
        },
        reorder: [
          ['昨日|、|友達|に|会いました|。', 'Hôm qua tôi đã gặp bạn.'],
          ['週末|は|映画|を|見たい|です|。', 'Cuối tuần tôi muốn xem phim.'],
        ],
        grammarQ: [
          { prompt: 'Nói “Hôm qua tôi đã xem phim” (quá khứ lịch sự).', source: '昨日 / 映画 / 見ます', pattern: 'Vました。', answers: ['昨日、映画を見ました。', '昨日、映画を見ました', '昨日映画を見ました。', '昨日映画を見ました'] },
          { prompt: 'Nói “Tôi muốn xem phim” bằng mẫu 〜たいです.', source: '映画 / 見ます', pattern: 'Vたいです。', answers: ['映画が見たいです。', '映画が見たいです', '映画を見たいです。', '映画を見たいです'] },
        ],
        tip: ['〜たい chỉ dùng cho ngôi thứ nhất', '〜たいです diễn đạt mong muốn của chính người nói (và trong câu hỏi, của người nghe). Để nói về mong muốn của người khác, dùng 〜たがっています hoặc 〜そうです.'],
      },
    ],
  },
];
