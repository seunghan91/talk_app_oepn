import axiosInstance from '../lib/axios';

/**
 * 신고 및 차단 시스템 관련 API 서비스
 */
const reportService = {
  /**
   * 사용자 신고하기
   * @param {Object} reportData - 신고 데이터
   * @param {number} reportData.reported_id - 신고할 사용자 ID
   * @param {string} reportData.report_type - 신고 유형 ('user', 'broadcast', 'message')
   * @param {string} reportData.reason - 신고 사유
   * @param {number} [reportData.related_id] - 관련 브로드캐스트/메시지 ID (report_type이 'user'가 아닌 경우 필수)
   * @returns {Promise<Object>} 신고 결과
   */
  reportUser: async (reportData) => {
    try {
      const response = await axiosInstance.post('/api/v1/reports', {
        report: reportData
      });
      return response.data;
    } catch (error) {
      console.error('사용자 신고 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 신고 목록 조회 (관리자용)
   * @param {Object} params - 쿼리 파라미터
   * @param {number} [params.page=1] - 페이지 번호
   * @param {number} [params.per_page=20] - 페이지당 결과 수
   * @param {string} [params.status] - 신고 상태로 필터링 ('pending', 'processing', 'resolved', 'rejected')
   * @returns {Promise<Object>} 신고 목록 및 페이지네이션 정보
   */
  getReports: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/api/v1/reports', { params });
      return response.data;
    } catch (error) {
      console.error('신고 목록 조회 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 사용자 차단하기
   * @param {number} userId - 차단할 사용자 ID
   * @returns {Promise<Object>} 차단 결과
   */
  blockUser: async (userId) => {
    try {
      const response = await axiosInstance.post(`/api/v1/users/${userId}/block`);
      return response.data;
    } catch (error) {
      console.error('사용자 차단 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 사용자 차단 해제하기
   * @param {number} userId - 차단 해제할 사용자 ID
   * @returns {Promise<Object>} 차단 해제 결과
   */
  unblockUser: async (userId) => {
    try {
      const response = await axiosInstance.post(`/api/v1/users/${userId}/unblock`);
      return response.data;
    } catch (error) {
      console.error('사용자 차단 해제 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 차단한 사용자 목록 조회
   * @returns {Promise<Object>} 차단 목록
   */
  getBlockedUsers: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/users/blocks');
      return response.data;
    } catch (error) {
      console.error('차단 목록 조회 중 오류 발생:', error);
      throw error;
    }
  }
};

export default reportService;
