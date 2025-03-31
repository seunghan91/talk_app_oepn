/**
 * 공지사항 카테고리 모델
 * @typedef {Object} AnnouncementCategory
 * @property {number} id - 카테고리 ID
 * @property {string} name - 카테고리 이름
 * @property {string} [description] - 카테고리 설명
 * @property {string} created_at - 생성일시
 * @property {string} updated_at - 수정일시
 */

/**
 * 공지사항 모델
 * @typedef {Object} Announcement
 * @property {number} id - 공지사항 ID
 * @property {string} title - 제목
 * @property {string} content - 내용
 * @property {number} category_id - 카테고리 ID
 * @property {AnnouncementCategory} category - 카테고리 정보
 * @property {boolean} is_important - 중요 공지 여부
 * @property {boolean} is_published - 게시 여부
 * @property {boolean} is_hidden - 숨김 여부 (일반 사용자에게 보이지 않음)
 * @property {string} created_at - 작성일시
 * @property {string} updated_at - 수정일시
 * @property {string} published_at - 게시일시
 */

// 기존 exports... 