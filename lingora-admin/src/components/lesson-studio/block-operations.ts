import type { LessonBlock, LessonBlockType } from '@lingora/lesson-content';

let blockKeyCounter = 0;

/**
 * Sinh blockKey duy nhất, tuân thủ regex /^[A-Za-z0-9_.:-]+$/ và độ dài tối đa 128 ký tự.
 */
export function generateBlockKey(type: string = 'block'): string {
  blockKeyCounter += 1;
  const prefix = (type || 'block').toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${blockKeyCounter}_${randomSuffix}`;
}

/**
 * Tạo một khối nội dung mặc định hợp lệ theo từng LessonBlockType với schemaVersion=1.
 */
export function createDefaultBlock(
  type: LessonBlockType,
  position: number = 1,
  customKey?: string
): LessonBlock {
  const blockKey = customKey || generateBlockKey(type);
  const normalizedPosition = Math.max(1, Math.floor(position));

  switch (type) {
    case 'HEADING':
      return {
        blockKey,
        type: 'HEADING',
        position: normalizedPosition,
        schemaVersion: 1,
        content: {
          level: 2,
          text: 'Tiêu đề mục',
        },
      };

    case 'TEXT':
      return {
        blockKey,
        type: 'TEXT',
        position: normalizedPosition,
        schemaVersion: 1,
        content: {
          nodes: [
            {
              type: 'paragraph',
              runs: [{ text: 'Nhập nội dung bài học tại đây...' }],
            },
          ],
        },
      };

    case 'EXAMPLE':
      return {
        blockKey,
        type: 'EXAMPLE',
        position: normalizedPosition,
        schemaVersion: 1,
        content: {
          text: 'She practices English every day.',
          translation: 'Cô ấy luyện tập tiếng Anh mỗi ngày.',
        },
      };

    case 'DIALOGUE':
      return {
        blockKey,
        type: 'DIALOGUE',
        position: normalizedPosition,
        schemaVersion: 1,
        content: {
          lines: [
            {
              speaker: 'A',
              text: 'Hello, how are you today?',
              translation: 'Xin chào, hôm nay bạn thế nào?',
            },
            {
              speaker: 'B',
              text: "I'm doing well, thank you!",
              translation: 'Tôi khỏe, cảm ơn bạn!',
            },
          ],
        },
      };

    case 'CALLOUT':
      return {
        blockKey,
        type: 'CALLOUT',
        position: normalizedPosition,
        schemaVersion: 1,
        content: {
          tone: 'info',
          title: 'Ghi chú hữu ích',
          document: {
            nodes: [
              {
                type: 'paragraph',
                runs: [{ text: 'Hãy lưu ý điểm quan trọng này khi làm bài tập.' }],
              },
            ],
          },
        },
      };

    case 'MEDIA':
      return {
        blockKey,
        type: 'MEDIA',
        position: normalizedPosition,
        schemaVersion: 1,
        content: {
          kind: 'audio',
          url: 'https://media.lingora.app/audio/sample.mp3',
          caption: 'Phát âm mẫu',
        },
      };

    case 'GRAMMAR':
      return {
        blockKey,
        type: 'GRAMMAR',
        position: normalizedPosition,
        schemaVersion: 1,
        content: {
          title: 'Cấu trúc câu',
          explanation: 'Giải thích cấu trúc và ngữ cảnh sử dụng ngữ pháp.',
          examples: [
            {
              text: 'Subject + Verb + Object',
              translation: 'Chủ ngữ + Động từ + Tân ngữ',
              explanation: 'Mô hình cơ bản trong câu khẳng định',
            },
          ],
        },
      };

    case 'DIVIDER':
      return {
        blockKey,
        type: 'DIVIDER',
        position: normalizedPosition,
        schemaVersion: 1,
        content: {},
      };

    case 'VOCABULARY':
      return {
        blockKey,
        type: 'VOCABULARY',
        position: normalizedPosition,
        schemaVersion: 1,
        content: {
          selection: 'lesson',
        },
      };

    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Kiểu khối nội dung không được hỗ trợ: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Chuẩn hóa lại position cho danh sách blocks (1-based index tăng dần liên tục).
 */
export function normalizePositions(blocks: LessonBlock[]): LessonBlock[] {
  return blocks.map((block, index) => {
    const nextPos = index + 1;
    if (block.position === nextPos) return block;
    return { ...block, position: nextPos };
  });
}

/**
 * Thêm block mới vào vị trí targetIndex (mặc định chèn vào cuối mảng).
 * Chuẩn hóa lại position 1-based index tăng dần.
 */
export function addBlock(
  blocks: LessonBlock[],
  type: LessonBlockType,
  targetIndex?: number
): LessonBlock[] {
  const insertIndex =
    targetIndex === undefined || targetIndex < 0 || targetIndex > blocks.length
      ? blocks.length
      : targetIndex;

  const newBlock = createDefaultBlock(type, insertIndex + 1);
  const nextBlocks = [...blocks];
  nextBlocks.splice(insertIndex, 0, newBlock);
  return normalizePositions(nextBlocks);
}

/**
 * Sao chép một block, sinh blockKey MỚI hoàn toàn, đặt ngay sau block gốc, chuẩn hóa position.
 */
export function duplicateBlock(blocks: LessonBlock[], blockKey: string): LessonBlock[] {
  const index = blocks.findIndex((b) => b.blockKey === blockKey);
  if (index === -1) {
    return [...blocks];
  }

  const original = blocks[index];
  const cloned: LessonBlock = {
    ...JSON.parse(JSON.stringify(original)),
    blockKey: generateBlockKey(original.type),
    position: index + 2,
    schemaVersion: 1,
  };

  const nextBlocks = [...blocks];
  nextBlocks.splice(index + 1, 0, cloned);
  return normalizePositions(nextBlocks);
}

/**
 * Xóa một block theo blockKey và đánh số lại position.
 */
export function deleteBlock(blocks: LessonBlock[], blockKey: string): LessonBlock[] {
  const nextBlocks = blocks.filter((b) => b.blockKey !== blockKey);
  return normalizePositions(nextBlocks);
}

/**
 * Đổi vị trí khối nội dung từ fromIndex sang toIndex (Drag and drop).
 * Giữ nguyên blockKey của các block, chỉ đổi thứ tự và chuẩn hóa position.
 */
export function reorderBlocks(
  blocks: LessonBlock[],
  fromIndex: number,
  toIndex: number
): LessonBlock[] {
  if (
    fromIndex < 0 ||
    fromIndex >= blocks.length ||
    toIndex < 0 ||
    toIndex >= blocks.length ||
    fromIndex === toIndex
  ) {
    return [...blocks];
  }

  const nextBlocks = [...blocks];
  const [movedItem] = nextBlocks.splice(fromIndex, 1);
  nextBlocks.splice(toIndex, 0, movedItem);
  return normalizePositions(nextBlocks);
}

/**
 * Hoán đổi vị trí block liền kề (up / down) cho accessibility & keyboard shortcuts.
 */
export function moveBlock(
  blocks: LessonBlock[],
  blockKey: string,
  direction: 'up' | 'down'
): LessonBlock[] {
  const index = blocks.findIndex((b) => b.blockKey === blockKey);
  if (index === -1) {
    return [...blocks];
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  return reorderBlocks(blocks, index, targetIndex);
}

/**
 * Cập nhật thuộc tính / content của block (bất biến, giữ nguyên blockKey và position).
 */
export function updateBlock(
  blocks: LessonBlock[],
  blockKey: string,
  patch: Partial<LessonBlock>
): LessonBlock[] {
  return blocks.map((b) => {
    if (b.blockKey !== blockKey) return b;
    return {
      ...b,
      ...patch,
      blockKey: b.blockKey,
      position: b.position,
      schemaVersion: b.schemaVersion,
      content: patch.content !== undefined ? patch.content : b.content,
    } as LessonBlock;
  });
}
