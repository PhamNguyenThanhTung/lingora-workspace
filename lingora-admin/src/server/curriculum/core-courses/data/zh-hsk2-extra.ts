import type { UnitSpec } from '../types.ts';

/**
 * Chinese HSK 2 — extension units (5–7): complements, 把 / 被 and imminent action, and 着 / causative / conditionals.
 * Same conventions as zh-hsk2.ts: simplified characters, Hanyu Pinyin with tone marks.
 */
export const ZH_HSK2_EXTRA_UNITS: UnitSpec[] = [
  {
    level: 'HSK2',
    names: { vi: 'Bổ ngữ: kết quả, xu hướng và mức độ', en: 'Complements: Result, Direction and Degree' },
    lessons: [
      {
        title: { vi: 'Bổ ngữ kết quả (看见・听懂・做完)', en: 'Result Complements' },
        intro: 'Bạn nói “đã nhìn thấy”, “nghe hiểu”, “làm xong”. Bài này dạy bổ ngữ kết quả: động từ + 见/懂/完/到/好 để chỉ hành động đã đạt kết quả.',
        vocab: [
          ['看见', 'kànjiàn', 'verb', 'nhìn thấy', '我看见他了。', 'Tôi đã nhìn thấy anh ấy.'],
          ['听懂', 'tīngdǒng', 'verb', 'nghe hiểu', '老师的话我听懂了。', 'Lời thầy nói tôi nghe hiểu rồi.'],
          ['做完', 'zuòwán', 'verb', 'làm xong', '作业我已经做完了。', 'Bài tập tôi đã làm xong.'],
          ['找到', 'zhǎodào', 'verb', 'tìm thấy', '我找到了我的钥匙。', 'Tôi đã tìm thấy chìa khóa của mình.'],
          ['钥匙', 'yàoshi', 'noun', 'chìa khóa', '你的钥匙在桌子上。', 'Chìa khóa của bạn ở trên bàn.'],
          ['买到', 'mǎidào', 'verb', 'mua được', '我买到了火车票。', 'Tôi đã mua được vé tàu.'],
          ['写好', 'xiěhǎo', 'verb', 'viết xong, viết tốt', '信已经写好了。', 'Lá thư đã viết xong.'],
          ['吃饱', 'chībǎo', 'verb', 'ăn no', '你吃饱了吗？', 'Bạn ăn no chưa?'],
          ['洗干净', 'xǐ gānjìng', 'verb phrase', 'rửa sạch', '请把杯子洗干净。', 'Xin hãy rửa sạch cái cốc.'],
          ['干净', 'gānjìng', 'adjective', 'sạch sẽ', '房间很干净。', 'Phòng rất sạch.'],
        ],
        grammar: {
          title: 'Động từ + bổ ngữ kết quả: 看见 / 听懂 / 做完 / 找到',
          explain: 'Bổ ngữ kết quả đứng ngay sau động từ để chỉ kết quả của hành động: 看见 (nhìn thấy), 听懂 (nghe hiểu), 做完 (làm xong), 找到 (tìm thấy). Dạng khẳng định thường kèm 了: 我找到了钥匙. Phủ định dùng 没(有) và bỏ 了: 我没找到钥匙. Dạng khả năng chen 得/不 vào giữa: 听得懂 (nghe hiểu được), 听不懂 (nghe không hiểu).',
          examples: [
            ['我找到了我的钥匙。', 'Tôi đã tìm thấy chìa khóa của mình.', 'Wǒ zhǎodào le wǒ de yàoshi.'],
            ['老师的话我听懂了。', 'Lời thầy nói tôi nghe hiểu rồi.', 'Lǎoshī de huà wǒ tīngdǒng le.'],
            ['作业我已经做完了。', 'Bài tập tôi đã làm xong.', 'Zuòyè wǒ yǐjīng zuòwán le.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你找到钥匙了吗？', 'Bạn tìm thấy chìa khóa chưa?', 'Nǐ zhǎodào yàoshi le ma?'],
            ['阮', '找到了，在桌子上。', 'Tìm thấy rồi, ở trên bàn.', 'Zhǎodào le, zài zhuōzi shàng.'],
            ['李明', '作业做完了吗？', 'Bài tập làm xong chưa?', 'Zuòyè zuòwán le ma?'],
            ['阮', '还没有，有一个问题我听不懂。', 'Chưa xong, có một câu tôi nghe không hiểu.', 'Hái méiyǒu, yǒu yí ge wèntí wǒ tīng bu dǒng.'],
          ],
        },
        reorder: [
          ['我|找到|了|我|的|钥匙|。', 'Tôi đã tìm thấy chìa khóa của mình.'],
          ['作业|我|已经|做完|了|。', 'Bài tập tôi đã làm xong.'],
        ],
        grammarQ: [
          { prompt: 'Nói tôi đã tìm thấy chìa khóa (bổ ngữ kết quả 到).', source: '找 / 钥匙', pattern: 'S + V + 到 + 了 + N', answers: ['我找到了我的钥匙。', '我找到了钥匙。', '我找到了钥匙'] },
          { prompt: 'Nói bài tập đã làm xong.', source: '作业 / 做 / 完', pattern: 'N + 已经 + V + 完 + 了', answers: ['作业我已经做完了。', '作业我已经做完了'] },
        ],
        tip: ['Phủ định bổ ngữ kết quả', 'Bổ ngữ kết quả phủ định bằng 没: 没听懂, 没做完. Đừng dùng 不 vì 不 dành cho việc chưa xảy ra hoặc thói quen.'],
      },
      {
        title: { vi: 'Bổ ngữ xu hướng (上来・下去・进・出)', en: 'Direction Complements' },
        intro: 'Bạn nói ai đó đi vào, đi ra, đi lên, đi xuống hay mang đồ đến. Bài này dạy bổ ngữ xu hướng 来/去 kết hợp 上, 下, 进, 出, 回.',
        vocab: [
          ['进', 'jìn', 'verb', 'vào', '请进来。', 'Xin mời vào.'],
          ['出', 'chū', 'verb', 'ra', '他走出教室。', 'Anh ấy đi ra khỏi lớp.'],
          ['上楼', 'shàng lóu', 'verb phrase', 'lên lầu', '我们上楼吧。', 'Chúng ta lên lầu đi.'],
          ['下楼', 'xià lóu', 'verb phrase', 'xuống lầu', '他下楼去买东西。', 'Anh ấy xuống lầu đi mua đồ.'],
          ['楼', 'lóu', 'noun', 'tòa nhà, tầng lầu', '我家住在三楼。', 'Nhà tôi ở tầng ba.'],
          ['回去', 'huíqù', 'verb', 'quay về (đi)', '时间不早了，我回去了。', 'Muộn rồi, tôi về đây.'],
          ['过来', 'guòlái', 'verb', 'lại đây', '你过来一下。', 'Bạn lại đây một chút.'],
          ['拿出来', 'ná chūlái', 'verb phrase', 'lấy ra', '他从包里拿出来一本书。', 'Anh ấy lấy từ trong túi ra một quyển sách.'],
          ['包', 'bāo', 'noun', 'cái túi, cặp', '我的包在桌子下面。', 'Cặp của tôi ở dưới bàn.'],
          ['跑', 'pǎo', 'verb', 'chạy', '孩子们跑进教室。', 'Bọn trẻ chạy vào lớp.'],
        ],
        grammar: {
          title: 'Bổ ngữ xu hướng: V + 上/下/进/出/回 + 来/去',
          explain: 'Bổ ngữ xu hướng cho biết hướng của hành động so với người nói. 来 chỉ hướng về phía người nói, 去 chỉ hướng ra xa: 请进来 (xin mời vào – người nói ở trong), 他走出去了 (anh ấy đi ra ngoài). Kết hợp: 上来, 上去, 下来, 下去, 进来, 进去, 出来, 出去, 回来, 回去, 过来, 过去. Khi có tân ngữ nơi chốn, nó đứng giữa: 他走进教室去.',
          examples: [
            ['请进来。', 'Xin mời vào.', 'Qǐng jìnlái.'],
            ['他从包里拿出来一本书。', 'Anh ấy lấy từ trong túi ra một quyển sách.', 'Tā cóng bāo lǐ ná chūlái yì běn shū.'],
            ['时间不早了，我回去了。', 'Muộn rồi, tôi về đây.', 'Shíjiān bù zǎo le, wǒ huíqù le.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '喂，你在哪儿？', 'A lô, bạn đang ở đâu?', 'Wèi, nǐ zài nǎr?'],
            ['阮', '我在楼下，你下来吧。', 'Tôi ở dưới lầu, bạn xuống đi.', 'Wǒ zài lóu xià, nǐ xiàlái ba.'],
            ['李明', '好的，我马上下楼。', 'Được, tôi xuống lầu ngay.', 'Hǎo de, wǒ mǎshàng xià lóu.'],
            ['阮', '你把包拿出来，我帮你拿。', 'Bạn lấy cặp ra đây, tôi cầm giúp.', 'Nǐ bǎ bāo ná chūlái, wǒ bāng nǐ ná.'],
          ],
        },
        reorder: [
          ['请|进来|。', 'Xin mời vào.'],
          ['时间|不|早|了|，|我|回去|了|。', 'Muộn rồi, tôi về đây.'],
        ],
        grammarQ: [
          { prompt: 'Mời ai đó vào trong (người nói ở trong).', source: '请 / 进 / 来', pattern: '请 + V + 来', answers: ['请进来。', '请进来'] },
          { prompt: 'Nói muộn rồi, tôi về đây.', source: '时间 / 不早 / 回去', pattern: '…，我 + V + 去 + 了', answers: ['时间不早了，我回去了。', '时间不早了,我回去了。', '时间不早了我回去了'] },
        ],
        tip: ['来 hay 去?', 'Hỏi bản thân: hướng di chuyển là về phía người nói (来) hay xa người nói (去)? Nếu bạn đứng trong phòng và ai đó vào, nói 进来.'],
      },
      {
        title: { vi: 'Bổ ngữ mức độ (跑得快・说得好)', en: 'Degree Complements with 得' },
        intro: 'Bạn muốn khen hay nhận xét ai làm việc gì tốt hay chậm, nhanh hay kém. Bài này dạy mẫu V + 得 + tính từ để mô tả cách thức, mức độ.',
        vocab: [
          ['得', 'de', 'particle', 'trợ từ bổ ngữ mức độ', '他跑得很快。', 'Anh ấy chạy rất nhanh.'],
          ['说得好', 'shuō de hǎo', 'phrase', 'nói giỏi', '你汉语说得很好。', 'Bạn nói tiếng Hán rất giỏi.'],
          ['唱得好', 'chàng de hǎo', 'phrase', 'hát hay', '她歌唱得很好。', 'Cô ấy hát rất hay.'],
          ['写得好', 'xiě de hǎo', 'phrase', 'viết đẹp, viết giỏi', '他字写得很好。', 'Anh ấy viết chữ rất đẹp.'],
          ['字', 'zì', 'noun', 'chữ', '这个字怎么写？', 'Chữ này viết thế nào?'],
          ['歌', 'gē', 'noun', 'bài hát', '这首歌很好听。', 'Bài hát này rất hay.'],
          ['好听', 'hǎotīng', 'adjective', 'nghe hay', '她的声音很好听。', 'Giọng cô ấy rất hay.'],
          ['声音', 'shēngyīn', 'noun', 'giọng, âm thanh', '他的声音很大。', 'Giọng anh ấy rất to.'],
          ['认真', 'rènzhēn', 'adjective', 'chăm chỉ, nghiêm túc', '他学习很认真。', 'Anh ấy học rất chăm chỉ.'],
          ['马马虎虎', 'mǎmǎhūhū', 'adjective', 'tàm tạm, qua loa', '我的汉语说得马马虎虎。', 'Tiếng Hán của tôi tàm tạm.'],
        ],
        grammar: {
          title: 'V + 得 + tính từ (và V + O + V + 得…)',
          explain: 'Bổ ngữ mức độ mô tả hành động diễn ra tốt, nhanh, chậm… theo mẫu V + 得 + tính từ: 他跑得很快, 她唱得很好. Khi động từ có tân ngữ, lặp động từ: 他说汉语说得很好 (hoặc đưa tân ngữ lên trước: 他汉语说得很好). Phủ định đặt 不 trước tính từ: 他跑得不快. Hỏi: 他跑得怎么样？',
          examples: [
            ['他跑得很快。', 'Anh ấy chạy rất nhanh.', 'Tā pǎo de hěn kuài.'],
            ['你汉语说得很好。', 'Bạn nói tiếng Hán rất giỏi.', 'Nǐ Hànyǔ shuō de hěn hǎo.'],
            ['他跑得不快。', 'Anh ấy chạy không nhanh.', 'Tā pǎo de bú kuài.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你汉语说得很好！', 'Bạn nói tiếng Hán rất giỏi!', 'Nǐ Hànyǔ shuō de hěn hǎo!'],
            ['阮', '哪里哪里，我说得马马虎虎。', 'Đâu có đâu, tôi nói tàm tạm thôi.', 'Nǎlǐ nǎlǐ, wǒ shuō de mǎmǎhūhū.'],
            ['李明', '你写字写得怎么样？', 'Bạn viết chữ thế nào?', 'Nǐ xiě zì xiě de zěnmeyàng?'],
            ['阮', '写得不太好，但是我学习很认真。', 'Viết không giỏi lắm, nhưng tôi học rất chăm chỉ.', 'Xiě de bú tài hǎo, dànshì wǒ xuéxí hěn rènzhēn.'],
          ],
        },
        reorder: [
          ['他|跑|得|很|快|。', 'Anh ấy chạy rất nhanh.'],
          ['你|汉语|说|得|很|好|。', 'Bạn nói tiếng Hán rất giỏi.'],
        ],
        grammarQ: [
          { prompt: 'Nói anh ấy chạy rất nhanh.', source: '他 / 跑 / 快', pattern: 'S + V + 得 + 很 + Adj', answers: ['他跑得很快。', '他跑得很快'] },
          { prompt: 'Khen bạn nói tiếng Hán rất giỏi.', source: '你 / 汉语 / 说 / 好', pattern: 'S + O + V + 得 + Adj', answers: ['你汉语说得很好。', '你汉语说得很好'] },
        ],
        tip: ['Khiêm tốn khi được khen', 'Khi được khen, người Trung Quốc hay đáp 哪里哪里 hoặc 马马虎虎, ý khiêm tốn: “đâu có, tàm tạm thôi”.'],
      },
    ],
  },
  {
    level: 'HSK2',
    names: { vi: 'Câu 把, câu bị động và sắp xảy ra', en: 'Ba, Bei and Imminent Actions' },
    lessons: [
      {
        title: { vi: 'Câu chữ 把 (把…放在…)', en: 'The 把 Construction' },
        intro: 'Bạn nhờ ai đó đặt, mang hay làm gì với một vật cụ thể. Bài này dạy câu chữ 把: đưa tân ngữ lên trước động từ để nhấn mạnh việc xử lý nó.',
        vocab: [
          ['把', 'bǎ', 'preposition', 'đem (cấu trúc xử lý)', '请把门关上。', 'Xin hãy đóng cửa lại.'],
          ['放', 'fàng', 'verb', 'đặt, để', '请把书放在桌子上。', 'Xin hãy đặt sách lên bàn.'],
          ['关', 'guān', 'verb', 'đóng, tắt', '请把灯关了。', 'Xin hãy tắt đèn.'],
          ['打开', 'dǎkāi', 'verb', 'mở ra', '请把窗户打开。', 'Xin hãy mở cửa sổ ra.'],
          ['拿', 'ná', 'verb', 'cầm, lấy', '你把包拿过来。', 'Bạn mang cặp lại đây.'],
          ['带来', 'dàilái', 'verb', 'mang đến', '请把照片带来。', 'Xin hãy mang ảnh đến.'],
          ['照片', 'zhàopiàn', 'noun', 'bức ảnh', '我把照片给你。', 'Tôi đưa ảnh cho bạn.'],
          ['收拾', 'shōushi', 'verb', 'dọn dẹp', '我把房间收拾好了。', 'Tôi dọn xong phòng rồi.'],
          ['扔', 'rēng', 'verb', 'vứt', '请把垃圾扔了。', 'Xin hãy vứt rác đi.'],
          ['垃圾', 'lājī', 'noun', 'rác', '垃圾在门口。', 'Rác ở cửa ra vào.'],
        ],
        grammar: {
          title: 'S + 把 + O + V + thành phần khác',
          explain: 'Câu chữ 把 nhấn mạnh việc xử lý một vật xác định: S + 把 + O + V + kết quả/vị trí/hướng. Động từ phải đi kèm thành phần khác (了, bổ ngữ, vị trí): 我把书放在桌子上 (tôi đặt sách lên bàn). Không nói 我把书放. Tân ngữ sau 把 thường xác định (这本书, 那件衣服). Phủ định đặt 没 trước 把: 我没把门关上.',
          examples: [
            ['请把书放在桌子上。', 'Xin hãy đặt sách lên bàn.', 'Qǐng bǎ shū fàng zài zhuōzi shàng.'],
            ['我把房间收拾好了。', 'Tôi đã dọn dẹp xong phòng.', 'Wǒ bǎ fángjiān shōushi hǎo le.'],
            ['请把垃圾扔了。', 'Xin hãy vứt rác đi.', 'Qǐng bǎ lājī rēng le.'],
          ],
        },
        dialogue: {
          lines: [
            ['妈妈', '你把房间收拾好了吗？', 'Con dọn xong phòng chưa?', 'Nǐ bǎ fángjiān shōushi hǎo le ma?'],
            ['阮', '收拾好了。我把书放在桌子上了。', 'Dọn xong rồi. Con đặt sách lên bàn rồi.', 'Shōushi hǎo le. Wǒ bǎ shū fàng zài zhuōzi shàng le.'],
            ['妈妈', '请把垃圾扔了，再把窗户打开。', 'Hãy vứt rác đi, rồi mở cửa sổ ra.', 'Qǐng bǎ lājī rēng le, zài bǎ chuānghu dǎkāi.'],
            ['阮', '好的，我马上去。', 'Vâng, con đi ngay.', 'Hǎo de, wǒ mǎshàng qù.'],
          ],
        },
        reorder: [
          ['请|把|书|放|在|桌子|上|。', 'Xin hãy đặt sách lên bàn.'],
          ['我|把|房间|收拾|好|了|。', 'Tôi đã dọn dẹp xong phòng.'],
        ],
        grammarQ: [
          { prompt: 'Nhờ đặt sách lên bàn bằng câu chữ 把.', source: '请 / 书 / 放 / 桌子上', pattern: '请 + 把 + O + V + 在 + nơi', answers: ['请把书放在桌子上。', '请把书放在桌子上'] },
          { prompt: 'Nói tôi đã dọn xong phòng.', source: '我 / 房间 / 收拾好', pattern: 'S + 把 + O + V + 好了', answers: ['我把房间收拾好了。', '我把房间收拾好了'] },
        ],
        tip: ['Khi nào dùng 把', 'Dùng 把 khi bạn muốn nói cái gì xảy ra với vật xác định. Trong yêu cầu lịch sự, 请把… rất thường gặp: 请把门关上.'],
      },
      {
        title: { vi: 'Câu bị động (被・让・叫)', en: 'Passive Sentences with 被' },
        intro: 'Bạn nói ví bị mất, xe bị hỏng hay ly bị đổ. Bài này dạy câu bị động với 被 và 让/叫 để nói chủ ngữ chịu tác động.',
        vocab: [
          ['被', 'bèi', 'preposition', 'bị, được (bị động)', '我的自行车被偷了。', 'Xe đạp của tôi bị trộm mất.'],
          ['偷', 'tōu', 'verb', 'ăn trộm', '手机被偷了。', 'Điện thoại bị trộm mất.'],
          ['丢', 'diū', 'verb', 'làm mất', '我把钱包丢了。', 'Tôi làm mất ví tiền rồi.'],
          ['钱包', 'qiánbāo', 'noun', 'ví tiền', '钱包里有一百块。', 'Trong ví có một trăm đồng.'],
          ['打破', 'dǎpò', 'verb', 'làm vỡ', '杯子被他打破了。', 'Cái cốc bị anh ấy làm vỡ.'],
          ['弄坏', 'nònghuài', 'verb', 'làm hỏng', '我的电脑被弟弟弄坏了。', 'Máy tính của tôi bị em trai làm hỏng.'],
          ['警察局', 'jǐngchájú', 'noun', 'đồn cảnh sát', '我去警察局报案。', 'Tôi đến đồn cảnh sát trình báo.'],
          ['报案', 'bào àn', 'verb phrase', 'trình báo', '他去报案了。', 'Anh ấy đi trình báo rồi.'],
          ['淋', 'lín', 'verb', 'bị ướt (mưa)', '我被雨淋了。', 'Tôi bị mưa ướt.'],
          ['批评', 'pīpíng', 'verb', 'phê bình, mắng', '他被老师批评了。', 'Anh ấy bị thầy phê bình.'],
        ],
        grammar: {
          title: 'O + 被 + (người) + V + thành phần khác',
          explain: 'Câu bị động: tân ngữ chịu tác động làm chủ ngữ, tác nhân sau 被: 我的手机被偷了 (điện thoại của tôi bị trộm). Tác nhân có thể bỏ nếu không rõ: 手机被偷了. Trong văn nói, 被 thay bằng 让 hoặc 叫 và tác nhân bắt buộc có mặt: 杯子让他打破了. Thường dùng cho việc không mong muốn (bị trộm, bị mắng).',
          examples: [
            ['我的手机被偷了。', 'Điện thoại của tôi bị trộm mất.', 'Wǒ de shǒujī bèi tōu le.'],
            ['杯子被他打破了。', 'Cái cốc bị anh ấy làm vỡ.', 'Bēizi bèi tā dǎpò le.'],
            ['他被老师批评了。', 'Anh ấy bị thầy phê bình.', 'Tā bèi lǎoshī pīpíng le.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你怎么了？看起来不高兴。', 'Bạn sao thế? Trông không vui.', 'Nǐ zěnme le? Kàn qǐlái bù gāoxìng.'],
            ['阮', '我的手机被偷了。', 'Điện thoại của tôi bị trộm mất.', 'Wǒ de shǒujī bèi tōu le.'],
            ['李明', '你去警察局报案了吗？', 'Bạn đã đến đồn cảnh sát trình báo chưa?', 'Nǐ qù jǐngchájú bào àn le ma?'],
            ['阮', '去了，警察说会帮我找。', 'Rồi, cảnh sát nói sẽ giúp tôi tìm.', 'Qù le, jǐngchá shuō huì bāng wǒ zhǎo.'],
          ],
        },
        reorder: [
          ['我|的|手机|被|偷|了|。', 'Điện thoại của tôi bị trộm mất.'],
          ['杯子|被|他|打破|了|。', 'Cái cốc bị anh ấy làm vỡ.'],
        ],
        grammarQ: [
          { prompt: 'Nói điện thoại của tôi bị trộm mất.', source: '手机 / 偷', pattern: 'N + 被 + V + 了', answers: ['我的手机被偷了。', '我的手机被偷了', '手机被偷了。'] },
          { prompt: 'Nói cái cốc bị anh ấy làm vỡ.', source: '杯子 / 他 / 打破', pattern: 'N + 被 + người + V + 了', answers: ['杯子被他打破了。', '杯子被他打破了'] },
        ],
        tip: ['被 thường mang nghĩa tiêu cực', 'Trong tiếng Trung, 被 thường diễn tả điều không may. Với điều tốt, hay dùng 得到 hoặc 受到.'],
      },
      {
        title: { vi: 'Sắp xảy ra (要…了・快…了)', en: 'About to Happen (yào…le, kuài…le)' },
        intro: 'Bạn nói “sắp đến giờ”, “sắp mưa”, “sắp tốt nghiệp”. Bài này dạy 要…了, 快…了, 就要…了 để diễn đạt việc sắp xảy ra.',
        vocab: [
          ['快', 'kuài', 'adverb', 'sắp', '火车快到了。', 'Tàu sắp đến rồi.'],
          ['就要', 'jiù yào', 'adverb', 'sắp sửa', '考试就要开始了。', 'Kỳ thi sắp bắt đầu rồi.'],
          ['开始', 'kāishǐ', 'verb', 'bắt đầu', '电影马上就要开始了。', 'Phim sắp bắt đầu rồi.'],
          ['毕业', 'bìyè', 'verb', 'tốt nghiệp', '我明年就要毕业了。', 'Sang năm tôi sắp tốt nghiệp.'],
          ['放假', 'fàng jià', 'verb phrase', 'nghỉ lễ, nghỉ học', '下个星期就要放假了。', 'Tuần sau sắp nghỉ rồi.'],
          ['到', 'dào', 'verb', 'đến', '飞机快要到了。', 'Máy bay sắp đến rồi.'],
          ['下班', 'xiàbān', 'verb', 'tan làm', '快下班了，我们走吧。', 'Sắp tan làm rồi, chúng ta đi thôi.'],
          ['结束', 'jiéshù', 'verb', 'kết thúc', '会议快要结束了。', 'Cuộc họp sắp kết thúc rồi.'],
          ['会议', 'huìyì', 'noun', 'cuộc họp', '会议下午三点开始。', 'Cuộc họp bắt đầu lúc ba giờ chiều.'],
          ['春节', 'Chūnjié', 'proper noun', 'Tết Nguyên đán', '春节快到了。', 'Tết sắp đến rồi.'],
        ],
        grammar: {
          title: '要…了 / 快要…了 / 就要…了',
          explain: 'Mẫu 要…了 diễn tả hành động sắp xảy ra: 火车要到了 (tàu sắp đến). 快要…了 và 快…了 gần giống nhau nhưng không đi với từ chỉ thời điểm cụ thể: 快下班了. 就要…了 dùng khi có từ chỉ thời gian rõ ràng, nhấn mạnh sắp tới: 下个星期就要放假了, 我明年就要毕业了. Cuối câu luôn có 了.',
          examples: [
            ['火车快要到了。', 'Tàu sắp đến rồi.', 'Huǒchē kuài yào dào le.'],
            ['我明年就要毕业了。', 'Sang năm tôi sắp tốt nghiệp rồi.', 'Wǒ míngnián jiù yào bìyè le.'],
            ['春节快到了。', 'Tết sắp đến rồi.', 'Chūnjié kuài dào le.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '快下班了，晚上去吃饭吧。', 'Sắp tan làm rồi, tối nay đi ăn nhé.', 'Kuài xiàbān le, wǎnshang qù chīfàn ba.'],
            ['阮', '好啊。春节快到了，你回家吗？', 'Được thôi. Tết sắp đến rồi, bạn có về quê không?', 'Hǎo a. Chūnjié kuài dào le, nǐ huí jiā ma?'],
            ['李明', '回，下个星期就要放假了。', 'Có, tuần sau sắp nghỉ rồi.', 'Huí, xià ge xīngqī jiù yào fàng jià le.'],
            ['阮', '我明年就要毕业了，也想回家看看。', 'Sang năm tôi sắp tốt nghiệp rồi, cũng muốn về quê thăm.', 'Wǒ míngnián jiù yào bìyè le, yě xiǎng huí jiā kànkan.'],
          ],
        },
        reorder: [
          ['火车|快要|到|了|。', 'Tàu sắp đến rồi.'],
          ['我|明年|就要|毕业|了|。', 'Sang năm tôi sắp tốt nghiệp rồi.'],
        ],
        grammarQ: [
          { prompt: 'Nói tàu sắp đến rồi.', source: '火车 / 快要 / 到', pattern: 'S + 快要 + V + 了', answers: ['火车快要到了。', '火车快要到了'] },
          { prompt: 'Nói sang năm tôi sắp tốt nghiệp (có từ chỉ thời gian).', source: '我 / 明年 / 毕业', pattern: 'Thời gian + 就要 + V + 了', answers: ['我明年就要毕业了。', '我明年就要毕业了'] },
        ],
        tip: ['就要 đi với thời điểm cụ thể', '就要…了 có thể đi với từ chỉ thời điểm (明天就要走了), còn 快要…了 thì không. Đây là điểm phân biệt hay thi trong HSK2.'],
      },
    ],
  },
  {
    level: 'HSK2',
    names: { vi: 'Trạng thái, sai khiến và điều kiện', en: 'States, Causatives and Conditions' },
    lessons: [
      {
        title: { vi: 'Trạng thái kéo dài (着)', en: 'Continuous States with 着' },
        intro: 'Bạn tả cái cửa đang mở, người đang đứng, đèn đang sáng. Bài này dạy 着 gắn sau động từ để nói trạng thái đang duy trì.',
        vocab: [
          ['着', 'zhe', 'particle', 'trợ từ trạng thái kéo dài', '门开着。', 'Cửa đang mở.'],
          ['站', 'zhàn', 'verb', 'đứng', '他站着看书。', 'Anh ấy đứng đọc sách.'],
          ['坐着', 'zuòzhe', 'verb', 'đang ngồi', '她坐着看电视。', 'Cô ấy ngồi xem tivi.'],
          ['躺', 'tǎng', 'verb', 'nằm', '他躺着看手机。', 'Anh ấy nằm xem điện thoại.'],
          ['戴', 'dài', 'verb', 'đeo, đội', '他戴着一顶帽子。', 'Anh ấy đang đội một chiếc mũ.'],
          ['挂', 'guà', 'verb', 'treo', '墙上挂着一幅画。', 'Trên tường treo một bức tranh.'],
          ['墙', 'qiáng', 'noun', 'bức tường', '墙是白色的。', 'Bức tường màu trắng.'],
          ['画', 'huà', 'noun', 'bức tranh', '这幅画很漂亮。', 'Bức tranh này rất đẹp.'],
          ['亮', 'liàng', 'adjective', 'sáng', '灯还亮着。', 'Đèn vẫn đang sáng.'],
          ['带着', 'dàizhe', 'verb', 'mang theo', '他带着孩子去公园。', 'Anh ấy dẫn con đến công viên.'],
        ],
        grammar: {
          title: 'V + 着: trạng thái đang tiếp diễn',
          explain: '着 gắn sau động từ để diễn tả trạng thái kéo dài (khác 在… diễn tả hành động đang diễn ra). 门开着 (cửa đang mở), 他戴着帽子 (anh ấy đang đội mũ). Mẫu địa điểm + V + 着 + vật: 墙上挂着一幅画 (trên tường treo một bức tranh). Hai động từ liên tiếp: V1 + 着 + V2 — làm V2 trong khi V1: 他站着看书. Phủ định: 没 + V + 着.',
          examples: [
            ['墙上挂着一幅画。', 'Trên tường treo một bức tranh.', 'Qiáng shàng guà zhe yì fú huà.'],
            ['他戴着一顶帽子。', 'Anh ấy đang đội một chiếc mũ.', 'Tā dài zhe yì dǐng màozi.'],
            ['他站着看书。', 'Anh ấy đứng đọc sách.', 'Tā zhàn zhe kàn shū.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '你看，门开着，灯也亮着。', 'Bạn xem, cửa đang mở, đèn cũng đang sáng.', 'Nǐ kàn, mén kāi zhe, dēng yě liàng zhe.'],
            ['阮', '房间里有人吗？', 'Trong phòng có người không?', 'Fángjiān lǐ yǒu rén ma?'],
            ['李明', '有，他坐着看电视，墙上还挂着一幅画。', 'Có, anh ấy đang ngồi xem tivi, trên tường còn treo một bức tranh.', 'Yǒu, tā zuò zhe kàn diànshì, qiáng shàng hái guà zhe yì fú huà.'],
            ['阮', '那是他的家，我们进去吧。', 'Đó là nhà anh ấy, chúng ta vào thôi.', 'Nà shì tā de jiā, wǒmen jìnqù ba.'],
          ],
        },
        reorder: [
          ['墙|上|挂|着|一|幅|画|。', 'Trên tường treo một bức tranh.'],
          ['他|站|着|看|书|。', 'Anh ấy đứng đọc sách.'],
        ],
        grammarQ: [
          { prompt: 'Nói trên tường treo một bức tranh (dùng 着).', source: '墙上 / 挂 / 一幅画', pattern: 'Nơi chốn + V + 着 + N', answers: ['墙上挂着一幅画。', '墙上挂着一幅画'] },
          { prompt: 'Nói anh ấy đứng đọc sách.', source: '他 / 站 / 看书', pattern: 'S + V1 + 着 + V2', answers: ['他站着看书。', '他站着看书'] },
        ],
        tip: ['着 và 在', '在 + động từ nhấn mạnh hành động đang diễn ra (他在看书), còn V + 着 nhấn mạnh trạng thái đang duy trì (门开着).'],
      },
      {
        title: { vi: 'Sai khiến: 让・叫・请', en: 'Causative Verbs: 让, 叫, 请' },
        intro: 'Bạn nói “mẹ bảo tôi”, “thầy cho em”, “mời bạn đến”. Bài này dạy 让, 叫, 请 trong câu kiêm ngữ: S + 让/叫/请 + người + động từ.',
        vocab: [
          ['让', 'ràng', 'verb', 'để, bảo, cho phép', '妈妈让我早点儿睡觉。', 'Mẹ bảo tôi đi ngủ sớm.'],
          ['叫', 'jiào', 'verb', 'tên là, gọi là', '老师叫我回答问题。', 'Thầy gọi tôi trả lời câu hỏi.'],
          ['请', 'qǐng', 'verb', 'mời; xin vui lòng', '我请你吃饭。', 'Tôi mời bạn ăn cơm.'],
          ['同意', 'tóngyì', 'verb', 'đồng ý', '爸爸不同意。', 'Bố không đồng ý.'],
          ['允许', 'yǔnxǔ', 'verb', 'cho phép', '这里不允许抽烟。', 'Ở đây không cho phép hút thuốc.'],
          ['抽烟', 'chōu yān', 'verb phrase', 'hút thuốc', '请不要抽烟。', 'Xin đừng hút thuốc.'],
          ['注意', 'zhùyì', 'verb', 'chú ý', '请注意安全。', 'Xin hãy chú ý an toàn.'],
          ['安全', 'ānquán', 'adjective', 'an toàn', '这里很安全。', 'Ở đây rất an toàn.'],
          ['邀请', 'yāoqǐng', 'verb', 'mời, lời mời', '他邀请我参加聚会。', 'Anh ấy mời tôi tham dự buổi tụ họp.'],
          ['参加', 'cānjiā', 'verb', 'tham gia', '我想参加这个比赛。', 'Tôi muốn tham gia cuộc thi này.'],
        ],
        grammar: {
          title: 'S + 让/叫/请 + người + V (câu kiêm ngữ)',
          explain: 'Câu kiêm ngữ: tân ngữ của động từ thứ nhất đồng thời là chủ ngữ của động từ thứ hai. 让 và 叫 nghĩa là “bảo / để ai làm gì”: 妈妈让我早点儿睡觉. 请 nghĩa “mời / nhờ”: 我请你吃饭. Phủ định đặt 不 hoặc 没 trước 让: 爸爸不让我去. Khi xin phép: 请让我…, 你让我想一想.',
          examples: [
            ['妈妈让我早点儿睡觉。', 'Mẹ bảo tôi đi ngủ sớm.', 'Māma ràng wǒ zǎo diǎnr shuìjiào.'],
            ['我请你吃饭。', 'Tôi mời bạn ăn cơm.', 'Wǒ qǐng nǐ chīfàn.'],
            ['爸爸不让我去。', 'Bố không cho tôi đi.', 'Bàba bú ràng wǒ qù.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '周末我请你吃饭，好吗？', 'Cuối tuần tôi mời bạn ăn cơm nhé?', 'Zhōumò wǒ qǐng nǐ chīfàn, hǎo ma?'],
            ['阮', '谢谢，但是妈妈让我在家学习。', 'Cảm ơn, nhưng mẹ bảo tôi ở nhà học.', 'Xièxie, dànshì māma ràng wǒ zài jiā xuéxí.'],
            ['李明', '那我邀请你参加我的生日聚会吧。', 'Vậy tôi mời bạn tham dự tiệc sinh nhật của tôi nhé.', 'Nà wǒ yāoqǐng nǐ cānjiā wǒ de shēngrì jùhuì ba.'],
            ['阮', '好，爸爸应该会同意。', 'Được, bố chắc sẽ đồng ý.', 'Hǎo, bàba yīnggāi huì tóngyì.'],
          ],
        },
        reorder: [
          ['妈妈|让|我|早点儿|睡觉|。', 'Mẹ bảo tôi đi ngủ sớm.'],
          ['我|请|你|吃饭|。', 'Tôi mời bạn ăn cơm.'],
        ],
        grammarQ: [
          { prompt: 'Nói mẹ bảo tôi đi ngủ sớm.', source: '妈妈 / 我 / 早点儿睡觉', pattern: 'S + 让 + người + V', answers: ['妈妈让我早点儿睡觉。', '妈妈让我早点儿睡觉'] },
          { prompt: 'Nói tôi mời bạn ăn cơm.', source: '我 / 你 / 吃饭', pattern: 'S + 请 + người + V', answers: ['我请你吃饭。', '我请你吃饭'] },
        ],
        tip: ['让 hay 叫?', 'Trong khẩu ngữ, 让 và 叫 thường thay thế cho nhau. 叫 nghe mạnh hơn, như “sai bảo”, còn 让 nhẹ hơn, gần “để/cho”.'],
      },
      {
        title: { vi: 'Điều kiện: 如果…就… / 只要…就…', en: 'Conditions: 如果…就…, 只要…就…' },
        intro: 'Bạn nói “nếu mai mưa thì tôi không đi”, “chỉ cần cố gắng là được”. Bài này dạy các mẫu điều kiện thường gặp ở HSK2.',
        vocab: [
          ['如果', 'rúguǒ', 'conjunction', 'nếu như', '如果明天下雨，我就不去了。', 'Nếu mai mưa thì tôi không đi nữa.'],
          ['就', 'jiù', 'adverb', 'thì, liền', '你一来我就走。', 'Bạn vừa đến là tôi đi liền.'],
          ['只要', 'zhǐyào', 'conjunction', 'chỉ cần', '只要努力，就能成功。', 'Chỉ cần cố gắng thì có thể thành công.'],
          ['努力', 'nǔlì', 'adjective', 'cố gắng, nỗ lực', '他学习很努力。', 'Anh ấy học tập rất nỗ lực.'],
          ['成功', 'chénggōng', 'verb', 'thành công', '祝你成功！', 'Chúc bạn thành công!'],
          ['要是', 'yàoshi', 'conjunction', 'nếu như (khẩu ngữ)', '要是你有时间，就来看我。', 'Nếu bạn có thời gian thì đến thăm tôi.'],
          ['一…就…', 'yī…jiù…', 'phrase', 'vừa … là …', '我一到家就给你打电话。', 'Tôi vừa về nhà là gọi điện cho bạn.'],
          ['困难', 'kùnnan', 'noun', 'khó khăn', '有困难就找我。', 'Có khó khăn thì tìm tôi.'],
          ['机会', 'jīhuì', 'noun', 'cơ hội', '这是一个好机会。', 'Đây là một cơ hội tốt.'],
          ['可能', 'kěnéng', 'adverb', 'có lẽ, có thể', '明天可能会下雨。', 'Ngày mai có thể sẽ mưa.'],
        ],
        grammar: {
          title: '如果…就… / 只要…就… / 一…就…',
          explain: '如果 (hoặc 要是 trong khẩu ngữ) + điều kiện + 就 + kết quả: 如果明天下雨，我就不去了. 只要 + điều kiện đủ + 就 + kết quả: 只要努力，就能成功 (chỉ cần cố gắng thì có thể thành công). 一…就… diễn tả hai việc nối tiếp nhanh: 我一到家就给你打电话. Vế sau luôn có 就 làm cầu nối.',
          examples: [
            ['如果明天下雨，我就不去了。', 'Nếu ngày mai mưa thì tôi không đi nữa.', 'Rúguǒ míngtiān xiàyǔ, wǒ jiù bú qù le.'],
            ['只要努力，就能成功。', 'Chỉ cần cố gắng thì có thể thành công.', 'Zhǐyào nǔlì, jiù néng chénggōng.'],
            ['我一到家就给你打电话。', 'Tôi vừa về nhà là gọi điện cho bạn.', 'Wǒ yí dào jiā jiù gěi nǐ dǎ diànhuà.'],
          ],
        },
        dialogue: {
          lines: [
            ['李明', '如果明天下雨，我们还去爬山吗？', 'Nếu ngày mai mưa thì chúng ta còn đi leo núi không?', 'Rúguǒ míngtiān xiàyǔ, wǒmen hái qù páshān ma?'],
            ['阮', '如果下雨，我们就不去了。', 'Nếu mưa thì chúng ta không đi.', 'Rúguǒ xiàyǔ, wǒmen jiù bú qù le.'],
            ['李明', '汉语很难，我可能学不好。', 'Tiếng Hán khó lắm, có lẽ tôi học không tốt.', 'Hànyǔ hěn nán, wǒ kěnéng xué bu hǎo.'],
            ['阮', '只要努力，就能成功。', 'Chỉ cần cố gắng thì có thể thành công.', 'Zhǐyào nǔlì, jiù néng chénggōng.'],
          ],
        },
        reorder: [
          ['如果|明天|下雨|，|我|就|不|去|了|。', 'Nếu ngày mai mưa thì tôi không đi nữa.'],
          ['只要|努力|，|就|能|成功|。', 'Chỉ cần cố gắng thì có thể thành công.'],
        ],
        grammarQ: [
          { prompt: 'Nói nếu ngày mai mưa thì tôi không đi nữa.', source: '如果 / 明天 / 下雨 / 不去', pattern: '如果…，S + 就 + …', answers: ['如果明天下雨，我就不去了。', '如果明天下雨,我就不去了。', '如果明天下雨我就不去了'] },
          { prompt: 'Nói chỉ cần cố gắng thì có thể thành công.', source: '只要 / 努力 / 成功', pattern: '只要…，就…', answers: ['只要努力，就能成功。', '只要努力,就能成功。', '只要努力就能成功'] },
        ],
        tip: ['就 là chìa khóa', 'Ở vế sau của câu điều kiện luôn nên dùng 就. Quên 就 là lỗi phổ biến: nói 如果…，我去 sẽ nghe thiếu mạch lạc.'],
      },
    ],
  },
];
