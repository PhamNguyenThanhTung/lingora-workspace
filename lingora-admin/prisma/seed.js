/**
 * Lingora M1.4 Deterministic Bootstrap Seed
 * Uses fixed UUIDv5 identifiers and static timestamps for reproducible verification.
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const NAMESPACE = '2b8e3b9b-3c04-5b7b-8f67-0d1f6f3d9e4a';
const FIXED_EPOCH = new Date('2026-01-01T00:00:00.000Z');

function uuidv5(name, namespace = NAMESPACE) {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const nameBytes = Buffer.from(name, 'utf8');
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBytes, nameBytes])).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // Version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // Variant RFC 4122
  const hex = hash.toString('hex').slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}

const SEED_DATA = {
  languages: [
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', isLearnable: false, isUiLocale: true },
    { code: 'en', name: 'English', nativeName: 'English', isLearnable: true, isUiLocale: true }
  ],
  courses: [
    {
      id: uuidv5('lingora:m1.4:course:english-a1'),
      languageCode: 'en',
      cefr: 'A1',
      orderIndex: 1,
      isPublished: true,
      translations: [
        { locale: 'vi', title: 'Tiếng Anh A1', description: 'Khóa học tiếng Anh cơ bản A1 dành cho người mới bắt đầu' },
        { locale: 'en', title: 'English A1', description: 'Elementary English A1 course for beginners' }
      ]
    },
    {
      id: uuidv5('lingora:m1.4:course:visibility-draft'),
      languageCode: 'en',
      cefr: 'A1',
      orderIndex: 900001,
      isPublished: false,
      translations: []
    }
  ],
  lessons: [
    {
      id: uuidv5('lingora:m1.4:lesson:english-a1:01'),
      courseId: uuidv5('lingora:m1.4:course:english-a1'),
      orderIndex: 1,
      isPublished: true,
      translations: [
        { locale: 'vi', title: 'Chào hỏi', description: 'Làm quen với các câu chào hỏi thông dụng' },
        { locale: 'en', title: 'Greetings', description: 'Common greetings and everyday expressions' }
      ]
    },
    {
      id: uuidv5('lingora:m1.4:lesson:english-a1:02'),
      courseId: uuidv5('lingora:m1.4:course:english-a1'),
      orderIndex: 2,
      isPublished: true,
      translations: [
        { locale: 'vi', title: 'Giới thiệu bản thân', description: 'Giới thiệu bản thân, nghề nghiệp và quê hương' },
        { locale: 'en', title: 'Introductions', description: 'Introduce yourself, occupation, and background' }
      ]
    },
    {
      id: uuidv5('lingora:m1.4:lesson:english-a1:03'),
      courseId: uuidv5('lingora:m1.4:course:english-a1'),
      orderIndex: 3,
      isPublished: true,
      translations: [
        { locale: 'vi', title: 'Thói quen hàng ngày', description: 'Các hoạt động và thời gian biểu trong ngày' },
        { locale: 'en', title: 'Daily Routine', description: 'Daily activities, habits, and schedules' }
      ]
    },
    {
      id: uuidv5('lingora:m1.4:lesson:english-a1:04'),
      courseId: uuidv5('lingora:m1.4:course:english-a1'),
      orderIndex: 4,
      isPublished: true,
      translations: [
        { locale: 'vi', title: 'Đồ ăn và thức uống', description: 'Từ vựng gọi món, đồ ăn và đồ uống phổ biến' },
        { locale: 'en', title: 'Food and Drink', description: 'Ordering food, meals, and common beverages' }
      ]
    },
    {
      id: uuidv5('lingora:m1.4:lesson:english-a1:05'),
      courseId: uuidv5('lingora:m1.4:course:english-a1'),
      orderIndex: 5,
      isPublished: true,
      translations: [
        { locale: 'vi', title: 'Du lịch cơ bản', description: 'Di chuyển, phương tiện và lưu trú khi đi du lịch' },
        { locale: 'en', title: 'Travel Basics', description: 'Transportation, travel, and accommodation essentials' }
      ]
    },
    {
      id: uuidv5('lingora:m1.4:lesson:english-a1:draft'),
      courseId: uuidv5('lingora:m1.4:course:english-a1'),
      orderIndex: 900001,
      isPublished: false,
      translations: []
    },
    {
      id: uuidv5('lingora:m1.4:lesson:visibility-draft:01'),
      courseId: uuidv5('lingora:m1.4:course:visibility-draft'),
      orderIndex: 1,
      isPublished: false,
      translations: []
    }
  ],
  vocabularies: [
    // Lesson 1: greetings (10 terms)
    { lessonKey: 'lesson-01', index: 1, term: 'hello', phonetic: '/həˈloʊ/', cefr: 'A1', vi: 'xin chào', en: 'hello - general greeting', exVi: 'Xin chào, rất vui được gặp bạn.', exEn: 'Hello, nice to meet you.' },
    { lessonKey: 'lesson-01', index: 2, term: 'hi', phonetic: '/haɪ/', cefr: 'A1', vi: 'chào (thân mật)', en: 'hi - informal greeting', exVi: 'Chào Anna!', exEn: 'Hi Anna!' },
    { lessonKey: 'lesson-01', index: 3, term: 'goodbye', phonetic: '/ɡʊdˈbaɪ/', cefr: 'A1', vi: 'tạm biệt', en: 'goodbye', exVi: 'Tạm biệt, hẹn gặp lại ngày mai.', exEn: 'Goodbye, see you tomorrow.' },
    { lessonKey: 'lesson-01', index: 4, term: 'please', phonetic: '/pliːz/', cefr: 'A1', vi: 'làm ơn, xin vui lòng', en: 'please', exVi: 'Xin vui lòng ngồi xuống.', exEn: 'Please sit down.' },
    { lessonKey: 'lesson-01', index: 5, term: 'thanks', phonetic: '/θæŋks/', cefr: 'A1', vi: 'cảm ơn', en: 'thanks', exVi: 'Cảm ơn bạn rất nhiều.', exEn: 'Thanks a lot.' },
    { lessonKey: 'lesson-01', index: 6, term: 'sorry', phonetic: '/ˈsɑːri/', cefr: 'A1', vi: 'xin lỗi', en: 'sorry', exVi: 'Tôi xin lỗi vì đã đến muộn.', exEn: "I'm sorry for being late." },
    { lessonKey: 'lesson-01', index: 7, term: 'welcome', phonetic: '/ˈwelkəm/', cefr: 'A1', vi: 'chào mừng', en: 'welcome', exVi: 'Chào mừng bạn đến với khách sạn.', exEn: 'Welcome to our hotel.' },
    { lessonKey: 'lesson-01', index: 8, term: 'morning', phonetic: '/ˈmɔːrnɪŋ/', cefr: 'A1', vi: 'buổi sáng', en: 'morning', exVi: 'Chào buổi sáng!', exEn: 'Good morning!' },
    { lessonKey: 'lesson-01', index: 9, term: 'evening', phonetic: '/ˈiːvnɪŋ/', cefr: 'A1', vi: 'buổi tối', en: 'evening', exVi: 'Chào buổi tối quý khách.', exEn: 'Good evening, everyone.' },
    { lessonKey: 'lesson-01', index: 10, term: 'name', phonetic: '/neɪm/', cefr: 'A1', vi: 'tên', en: 'name', exVi: 'Tên của bạn là gì?', exEn: 'What is your name?' },

    // Lesson 2: introductions (10 terms)
    { lessonKey: 'lesson-02', index: 1, term: 'introduce', phonetic: '/ˌɪntrəˈduːs/', cefr: 'A1', vi: 'giới thiệu', en: 'introduce', exVi: 'Để tôi giới thiệu bản thân.', exEn: 'Let me introduce myself.' },
    { lessonKey: 'lesson-02', index: 2, term: 'student', phonetic: '/ˈstuːdnt/', cefr: 'A1', vi: 'học sinh, sinh viên', en: 'student', exVi: 'Tôi là sinh viên đại học.', exEn: 'I am a university student.' },
    { lessonKey: 'lesson-02', index: 3, term: 'teacher', phonetic: '/ˈtiːtʃər/', cefr: 'A1', vi: 'giáo viên', en: 'teacher', exVi: 'Cô Smith là giáo viên tiếng Anh của tôi.', exEn: 'Ms. Smith is my English teacher.' },
    { lessonKey: 'lesson-02', index: 4, term: 'friend', phonetic: '/frend/', cefr: 'A1', vi: 'bạn bè', en: 'friend', exVi: 'Đây là bạn thân của tôi.', exEn: 'This is my close friend.' },
    { lessonKey: 'lesson-02', index: 5, term: 'family', phonetic: '/ˈfæməli/', cefr: 'A1', vi: 'gia đình', en: 'family', exVi: 'Gia đình tôi sống ở Hà Nội.', exEn: 'My family lives in Hanoi.' },
    { lessonKey: 'lesson-02', index: 6, term: 'country', phonetic: '/ˈkʌntri/', cefr: 'A1', vi: 'quốc gia, đất nước', en: 'country', exVi: 'Việt Nam là một đất nước tươi đẹp.', exEn: 'Vietnam is a beautiful country.' },
    { lessonKey: 'lesson-02', index: 7, term: 'city', phonetic: '/ˈsɪti/', cefr: 'A1', vi: 'thành phố', en: 'city', exVi: 'Tôi yêu thành phố này.', exEn: 'I love this city.' },
    { lessonKey: 'lesson-02', index: 8, term: 'live', phonetic: '/lɪv/', cefr: 'A1', vi: 'sống, sinh sống', en: 'live', exVi: 'Tôi sống ở Đà Nẵng.', exEn: 'I live in Da Nang.' },
    { lessonKey: 'lesson-02', index: 9, term: 'work', phonetic: '/wɜːrk/', cefr: 'A1', vi: 'làm việc, công việc', en: 'work', exVi: 'Tôi làm việc trong văn phòng.', exEn: 'I work in an office.' },
    { lessonKey: 'lesson-02', index: 10, term: 'study', phonetic: '/ˈstʌdi/', cefr: 'A1', vi: 'học tập, nghiên cứu', en: 'study', exVi: 'Tôi học tiếng Anh mỗi ngày.', exEn: 'I study English every day.' },

    // Lesson 3: daily-routine (10 terms)
    { lessonKey: 'lesson-03', index: 1, term: 'wake', phonetic: '/weɪk/', cefr: 'A1', vi: 'thức dậy', en: 'wake', exVi: 'Tôi thức dậy lúc 6 giờ sáng.', exEn: 'I wake up at 6 AM.' },
    { lessonKey: 'lesson-03', index: 2, term: 'breakfast', phonetic: '/ˈbrekfəst/', cefr: 'A1', vi: 'bữa sáng', en: 'breakfast', exVi: 'Tôi ăn sáng cùng gia đình.', exEn: 'I eat breakfast with my family.' },
    { lessonKey: 'lesson-03', index: 3, term: 'commute', phonetic: '/kəˈmjuːt/', cefr: 'A1', vi: 'đi lại, đi làm', en: 'commute', exVi: 'Tôi đi làm bằng xe buýt.', exEn: 'I commute by bus.' },
    { lessonKey: 'lesson-03', index: 4, term: 'office', phonetic: '/ˈɔːfɪs/', cefr: 'A1', vi: 'văn phòng', en: 'office', exVi: 'Văn phòng của tôi rất hiện đại.', exEn: 'My office is very modern.' },
    { lessonKey: 'lesson-03', index: 5, term: 'lunch', phonetic: '/lʌntʃ/', cefr: 'A1', vi: 'bữa trưa', en: 'lunch', exVi: 'Chúng tôi ăn trưa lúc 12 giờ.', exEn: 'We have lunch at 12 PM.' },
    { lessonKey: 'lesson-03', index: 6, term: 'exercise', phonetic: '/ˈeksərsaɪz/', cefr: 'A1', vi: 'tập thể dục, rèn luyện', en: 'exercise', exVi: 'Tập thể dục giúp bạn khỏe mạnh.', exEn: 'Exercise keeps you healthy.' },
    { lessonKey: 'lesson-03', index: 7, term: 'read', phonetic: '/riːd/', cefr: 'A1', vi: 'đọc', en: 'read', exVi: 'Tôi đọc sách trước khi đi ngủ.', exEn: 'I read books before sleeping.' },
    { lessonKey: 'lesson-03', index: 8, term: 'dinner', phonetic: '/ˈdɪnər/', cefr: 'A1', vi: 'bữa tối', en: 'dinner', exVi: 'Cả nhà quây quần bên bữa tối.', exEn: 'The family gathers for dinner.' },
    { lessonKey: 'lesson-03', index: 9, term: 'sleep', phonetic: '/sliːp/', cefr: 'A1', vi: 'ngủ', en: 'sleep', exVi: 'Tôi ngủ 8 tiếng mỗi đêm.', exEn: 'I sleep 8 hours every night.' },
    { lessonKey: 'lesson-03', index: 10, term: 'today', phonetic: '/təˈdeɪ/', cefr: 'A1', vi: 'hôm nay', en: 'today', exVi: 'Hôm nay là một ngày tuyệt vời.', exEn: 'Today is a wonderful day.' },

    // Lesson 4: food-and-drink (10 terms)
    { lessonKey: 'lesson-04', index: 1, term: 'apple', phonetic: '/ˈæpl/', cefr: 'A1', vi: 'quả táo', en: 'apple', exVi: 'Tôi ăn một quả táo mỗi ngày.', exEn: 'I eat an apple every day.' },
    { lessonKey: 'lesson-04', index: 2, term: 'bread', phonetic: '/bred/', cefr: 'A1', vi: 'bánh mì', en: 'bread', exVi: 'Bánh mì nóng hổi và giòn.', exEn: 'The bread is fresh and crispy.' },
    { lessonKey: 'lesson-04', index: 3, term: 'rice', phonetic: '/raɪs/', cefr: 'A1', vi: 'cơm, gạo', en: 'rice', exVi: 'Cơm là món ăn chính ở châu Á.', exEn: 'Rice is a staple food in Asia.' },
    { lessonKey: 'lesson-04', index: 4, term: 'water', phonetic: '/ˈwɔːtər/', cefr: 'A1', vi: 'nước', en: 'water', exVi: 'Hãy uống nhiều nước lọc.', exEn: 'Please drink plenty of water.' },
    { lessonKey: 'lesson-04', index: 5, term: 'coffee', phonetic: '/ˈkɔːfi/', cefr: 'A1', vi: 'cà phê', en: 'coffee', exVi: 'Tôi thích một tách cà phê buổi sáng.', exEn: 'I like a cup of morning coffee.' },
    { lessonKey: 'lesson-04', index: 6, term: 'tea', phonetic: '/tiː/', cefr: 'A1', vi: 'trà', en: 'tea', exVi: 'Trà xanh rất tốt cho sức khỏe.', exEn: 'Green tea is good for health.' },
    { lessonKey: 'lesson-04', index: 7, term: 'hungry', phonetic: '/ˈhʌŋɡri/', cefr: 'A1', vi: 'đói', en: 'hungry', exVi: 'Tôi cảm thấy rất đói bụng.', exEn: 'I feel very hungry now.' },
    { lessonKey: 'lesson-04', index: 8, term: 'thirsty', phonetic: '/ˈθɜːrsti/', cefr: 'A1', vi: 'khát', en: 'thirsty', exVi: 'Sau khi chạy bộ, tôi rất khát nước.', exEn: 'After running, I was thirsty.' },
    { lessonKey: 'lesson-04', index: 9, term: 'order', phonetic: '/ˈɔːrdər/', cefr: 'A1', vi: 'gọi món, đặt hàng', en: 'order', exVi: 'Bạn đã sẵn sàng gọi món chưa?', exEn: 'Are you ready to order?' },
    { lessonKey: 'lesson-04', index: 10, term: 'menu', phonetic: '/ˈmenjuː/', cefr: 'A1', vi: 'thực đơn', en: 'menu', exVi: 'Xin vui lòng cho tôi xem thực đơn.', exEn: 'May I see the menu, please?' },

    // Lesson 5: travel-basics (10 terms)
    { lessonKey: 'lesson-05', index: 1, term: 'ticket', phonetic: '/ˈtɪkɪt/', cefr: 'A1', vi: 'vé', en: 'ticket', exVi: 'Tôi đã mua vé máy bay.', exEn: 'I bought a plane ticket.' },
    { lessonKey: 'lesson-05', index: 2, term: 'station', phonetic: '/ˈsteɪʃn/', cefr: 'A1', vi: 'nhà ga, trạm', en: 'station', exVi: 'Hẹn gặp bạn tại nhà ga trung tâm.', exEn: 'Meet me at the central station.' },
    { lessonKey: 'lesson-05', index: 3, term: 'airport', phonetic: '/ˈerpɔːrt/', cefr: 'A1', vi: 'sân bay', en: 'airport', exVi: 'Sân bay quốc tế Nội Bài rất đông đúc.', exEn: 'Noi Bai airport is busy.' },
    { lessonKey: 'lesson-05', index: 4, term: 'hotel', phonetic: '/hoʊˈtel/', cefr: 'A1', vi: 'khách sạn', en: 'hotel', exVi: 'Khách sạn này gần bãi biển.', exEn: 'This hotel is near the beach.' },
    { lessonKey: 'lesson-05', index: 5, term: 'room', phonetic: '/ruːm/', cefr: 'A1', vi: 'phòng', en: 'room', exVi: 'Phòng của tôi có hướng nhìn ra biển.', exEn: 'My room has a sea view.' },
    { lessonKey: 'lesson-05', index: 6, term: 'passport', phonetic: '/ˈpæspɔːrt/', cefr: 'A1', vi: 'hộ chiếu', en: 'passport', exVi: 'Đừng quên mang theo hộ chiếu của bạn.', exEn: "Don't forget your passport." },
    { lessonKey: 'lesson-05', index: 7, term: 'luggage', phonetic: '/ˈlʌɡɪdʒ/', cefr: 'A1', vi: 'hành lý', en: 'luggage', exVi: 'Hành lý của tôi nặng 15 kg.', exEn: 'My luggage weighs 15 kg.' },
    { lessonKey: 'lesson-05', index: 8, term: 'train', phonetic: '/treɪn/', cefr: 'A1', vi: 'tàu hỏa', en: 'train', exVi: 'Tàu hỏa khởi hành lúc 8 giờ sáng.', exEn: 'The train departs at 8 AM.' },
    { lessonKey: 'lesson-05', index: 9, term: 'bus', phonetic: '/bʌs/', cefr: 'A1', vi: 'xe buýt', en: 'bus', exVi: 'Xe buýt số 02 dừng trước khách sạn.', exEn: 'Bus number 02 stops here.' },
    { lessonKey: 'lesson-05', index: 10, term: 'map', phonetic: '/mæp/', cefr: 'A1', vi: 'bản đồ', en: 'map', exVi: 'Hãy xem bản đồ để tìm đường.', exEn: 'Look at the map to find the way.' }
  ],
  exercises: [
    // Lesson 1 exercises
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:01'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-01:mcq'),
      type: 'MCQ',
      orderIndex: 1,
      payload: {
        payloadVersion: '1',
        question: "How do you say 'Xin chào' in English?",
        options: ['Goodbye', 'Hello', 'Thanks', 'Sorry'],
        answerIndex: 1,
        explanation: "'Hello' is the standard English greeting corresponding to 'Xin chào'."
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:01'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-01:fill_blank'),
      type: 'FILL_BLANK',
      orderIndex: 2,
      payload: {
        payloadVersion: '1',
        sentence: 'Good ___, how are you today?',
        answers: ['morning', 'Morning'],
        hint: 'A greeting used before noon'
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:01'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-01:reorder'),
      type: 'REORDER',
      orderIndex: 3,
      payload: {
        payloadVersion: '1',
        tokens: ['is', 'What', 'name?', 'your'],
        correctOrder: [1, 0, 3, 2] // "What is your name?"
      }
    },

    // Lesson 2 exercises
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:02'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-02:mcq'),
      type: 'MCQ',
      orderIndex: 1,
      payload: {
        payloadVersion: '1',
        question: "Which word means 'học sinh / sinh viên'?",
        options: ['Teacher', 'Student', 'Doctor', 'Worker'],
        answerIndex: 1,
        explanation: "'Student' means a person who is studying at a school or college."
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:02'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-02:fill_blank'),
      type: 'FILL_BLANK',
      orderIndex: 2,
      payload: {
        payloadVersion: '1',
        sentence: 'I ___ in Hanoi with my family.',
        answers: ['live', 'Live'],
        hint: 'Verb meaning to reside in a place'
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:02'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-02:reorder'),
      type: 'REORDER',
      orderIndex: 3,
      payload: {
        payloadVersion: '1',
        tokens: ['am', 'a', 'student.', 'I'],
        correctOrder: [3, 0, 1, 2] // "I am a student."
      }
    },

    // Lesson 3 exercises
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:03'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-03:mcq'),
      type: 'MCQ',
      orderIndex: 1,
      payload: {
        payloadVersion: '1',
        question: "What is the first meal of the day?",
        options: ['Dinner', 'Lunch', 'Breakfast', 'Snack'],
        answerIndex: 2,
        explanation: "'Breakfast' is the meal eaten in the morning to start the day."
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:03'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-03:fill_blank'),
      type: 'FILL_BLANK',
      orderIndex: 2,
      payload: {
        payloadVersion: '1',
        sentence: 'I ___ up early at 6 AM every day.',
        answers: ['wake', 'Wake'],
        hint: 'Phrasal verb: wake up'
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:03'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-03:reorder'),
      type: 'REORDER',
      orderIndex: 3,
      payload: {
        payloadVersion: '1',
        tokens: ['books', 'read', 'I', 'evening.', 'every'],
        correctOrder: [2, 1, 0, 4, 3] // "I read books every evening."
      }
    },

    // Lesson 4 exercises
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:04'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-04:mcq'),
      type: 'MCQ',
      orderIndex: 1,
      payload: {
        payloadVersion: '1',
        question: "When you want to drink something, you feel ___.",
        options: ['Hungry', 'Thirsty', 'Tired', 'Sleepy'],
        answerIndex: 1,
        explanation: "'Thirsty' means needing or wanting to drink."
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:04'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-04:fill_blank'),
      type: 'FILL_BLANK',
      orderIndex: 2,
      payload: {
        payloadVersion: '1',
        sentence: 'Can I have a cup of ___, please?',
        answers: ['coffee', 'tea', 'water', 'Coffee', 'Tea', 'Water'],
        hint: 'A popular hot beverage'
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:04'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-04:reorder'),
      type: 'REORDER',
      orderIndex: 3,
      payload: {
        payloadVersion: '1',
        tokens: ['the', 'like', 'see', 'to', 'menu.', 'would', 'I'],
        correctOrder: [6, 5, 1, 3, 2, 0, 4] // "I would like to see the menu."
      }
    },

    // Lesson 5 exercises
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:05'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-05:mcq'),
      type: 'MCQ',
      orderIndex: 1,
      payload: {
        payloadVersion: '1',
        question: "Where do you go to catch an airplane?",
        options: ['Train station', 'Airport', 'Bus stop', 'Hotel'],
        answerIndex: 1,
        explanation: "'Airport' is the complex where aircraft take off and land."
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:05'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-05:fill_blank'),
      type: 'FILL_BLANK',
      orderIndex: 2,
      payload: {
        payloadVersion: '1',
        sentence: 'You must show your ___ at immigration.',
        answers: ['passport', 'Passport'],
        hint: 'Official travel document certifying identity'
      }
    },
    {
      lessonId: uuidv5('lingora:m1.4:lesson:english-a1:05'),
      id: uuidv5('lingora:m1.4:exercise:english-a1:lesson-05:reorder'),
      type: 'REORDER',
      orderIndex: 3,
      payload: {
        payloadVersion: '1',
        tokens: ['booked', 'have', 'a', 'room.', 'I', 'hotel'],
        correctOrder: [4, 1, 0, 2, 5, 3] // "I have booked a hotel room."
      }
    }
  ],
  scenarios: [
    {
      id: uuidv5('lingora:m1.4:scenario:hotel-booking'),
      code: 'hotel_booking',
      isPublished: true,
      systemPrompt: 'You are a helpful hotel receptionist at Sunrise Hotel. You greet guests politely, ask for their booking details (dates, room type, number of guests), and help them complete their reservation in clear English.',
      translations: [
        { uiLocale: 'vi', title: 'Đặt phòng khách sạn', description: 'Luyện tập hội thoại đặt phòng và hỏi thông tin tại quầy lễ tân khách sạn' },
        { uiLocale: 'en', title: 'Hotel Booking', description: 'Practice booking a room and inquiring about amenities with a hotel receptionist' }
      ]
    },
    {
      id: uuidv5('lingora:m1.4:scenario:visibility-draft'),
      code: 'visibility_draft',
      isPublished: false,
      systemPrompt: 'Internal draft scenario for visibility testing.',
      translations: []
    }
  ]
};

async function runSeed(prisma) {
  console.log('--- Starting Lingora M1.4 Deterministic Seed ---');

  return await prisma.$transaction(async (tx) => {
    // 1. Languages
    for (const lang of SEED_DATA.languages) {
      await tx.language.upsert({
        where: { code: lang.code },
        update: { name: lang.name, nativeName: lang.nativeName, isLearnable: lang.isLearnable, isUiLocale: lang.isUiLocale },
        create: { code: lang.code, name: lang.name, nativeName: lang.nativeName, isLearnable: lang.isLearnable, isUiLocale: lang.isUiLocale }
      });
    }

    // 2. Courses & translations
    for (const course of SEED_DATA.courses) {
      await tx.course.upsert({
        where: { id: course.id },
        update: { languageCode: course.languageCode, cefr: course.cefr, orderIndex: course.orderIndex, isPublished: course.isPublished, updatedAt: FIXED_EPOCH },
        create: { id: course.id, languageCode: course.languageCode, cefr: course.cefr, orderIndex: course.orderIndex, isPublished: course.isPublished, createdAt: FIXED_EPOCH, updatedAt: FIXED_EPOCH }
      });

      for (const t of course.translations) {
        await tx.courseTranslation.upsert({
          where: { courseId_locale: { courseId: course.id, locale: t.locale } },
          update: { title: t.title, description: t.description },
          create: { courseId: course.id, locale: t.locale, title: t.title, description: t.description }
        });
      }
    }

    // 3. Lessons & translations
    for (const lesson of SEED_DATA.lessons) {
      await tx.lesson.upsert({
        where: { id: lesson.id },
        update: { courseId: lesson.courseId, orderIndex: lesson.orderIndex, isPublished: lesson.isPublished, updatedAt: FIXED_EPOCH },
        create: { id: lesson.id, courseId: lesson.courseId, orderIndex: lesson.orderIndex, isPublished: lesson.isPublished, createdAt: FIXED_EPOCH, updatedAt: FIXED_EPOCH }
      });

      for (const t of lesson.translations) {
        await tx.lessonTranslation.upsert({
          where: { lessonId_locale: { lessonId: lesson.id, locale: t.locale } },
          update: { title: t.title, description: t.description },
          create: { lessonId: lesson.id, locale: t.locale, title: t.title, description: t.description }
        });
      }
    }

    // 4. Vocabularies, translations, and lesson_vocabulary junctions
    const lessonKeyMap = {
      'lesson-01': uuidv5('lingora:m1.4:lesson:english-a1:01'),
      'lesson-02': uuidv5('lingora:m1.4:lesson:english-a1:02'),
      'lesson-03': uuidv5('lingora:m1.4:lesson:english-a1:03'),
      'lesson-04': uuidv5('lingora:m1.4:lesson:english-a1:04'),
      'lesson-05': uuidv5('lingora:m1.4:lesson:english-a1:05')
    };

    for (const item of SEED_DATA.vocabularies) {
      const vocabId = uuidv5(`lingora:m1.4:vocab:english-a1:${item.lessonKey}:${String(item.index).padStart(2, '0')}`);
      const lessonId = lessonKeyMap[item.lessonKey];
      const normalizedTerm = item.term.toLowerCase().trim();

      await tx.vocabulary.upsert({
        where: { id: vocabId },
        update: { languageCode: 'en', term: item.term, normalizedTerm, phonetic: item.phonetic, cefr: item.cefr, updatedAt: FIXED_EPOCH },
        create: { id: vocabId, languageCode: 'en', term: item.term, normalizedTerm, phonetic: item.phonetic, cefr: item.cefr, createdAt: FIXED_EPOCH, updatedAt: FIXED_EPOCH }
      });

      // Translations: vi & en
      await tx.vocabularyTranslation.upsert({
        where: { vocabularyId_locale: { vocabularyId: vocabId, locale: 'vi' } },
        update: { meaning: item.vi, example: item.exVi },
        create: { vocabularyId: vocabId, locale: 'vi', meaning: item.vi, example: item.exVi }
      });

      await tx.vocabularyTranslation.upsert({
        where: { vocabularyId_locale: { vocabularyId: vocabId, locale: 'en' } },
        update: { meaning: item.en, example: item.exEn },
        create: { vocabularyId: vocabId, locale: 'en', meaning: item.en, example: item.exEn }
      });

      // Junction
      await tx.lessonVocabulary.upsert({
        where: { lessonId_vocabularyId: { lessonId, vocabularyId: vocabId } },
        update: { orderIndex: item.index },
        create: { lessonId, vocabularyId: vocabId, orderIndex: item.index }
      });
    }

    // 5. Exercises
    for (const ex of SEED_DATA.exercises) {
      await tx.exercise.upsert({
        where: { id: ex.id },
        update: { lessonId: ex.lessonId, type: ex.type, payload: ex.payload, orderIndex: ex.orderIndex },
        create: { id: ex.id, lessonId: ex.lessonId, type: ex.type, payload: ex.payload, orderIndex: ex.orderIndex }
      });
    }

    // 6. Chat scenarios & translations
    for (const sc of SEED_DATA.scenarios) {
      await tx.chatScenario.upsert({
        where: { id: sc.id },
        update: { code: sc.code, isPublished: sc.isPublished, systemPrompt: sc.systemPrompt },
        create: { id: sc.id, code: sc.code, isPublished: sc.isPublished, systemPrompt: sc.systemPrompt, createdAt: FIXED_EPOCH }
      });

      for (const t of sc.translations) {
        await tx.chatScenarioTranslation.upsert({
          where: { scenarioId_uiLocale: { scenarioId: sc.id, uiLocale: t.uiLocale } },
          update: { title: t.title, description: t.description },
          create: { scenarioId: sc.id, uiLocale: t.uiLocale, title: t.title, description: t.description }
        });
      }
    }

    console.log('--- Lingora M1.4 Deterministic Seed Completed Successfully ---');
    return { success: true };
  }, { maxWait: 20000, timeout: 60000 });
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await runSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { runSeed, uuidv5, NAMESPACE, FIXED_EPOCH, SEED_DATA };
