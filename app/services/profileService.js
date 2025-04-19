import axiosInstance from '../lib/axios';

/**
 * uc0acuc6a9uc790 ud504ub85cud544 uad00ub9ac uad00ub828 API uc11cube44uc2a4
 * uc0c8ub85c ucd94uac00ub41c ud544ub4dc(uc5f0ub839ub300, uc9c0uc5ed) ud3ecud568
 */
const profileService = {
  /**
   * uc0acuc6a9uc790 ud504ub85cud544 uac00uc838uc624uae30
   * @returns {Promise<Object>} uc0acuc6a9uc790 ud504ub85cud544 uc815ubcf4
   */
  getMyProfile: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/users/me');
      return response.data;
    } catch (error) {
      console.error('ud504ub85cud544 uc870ud68c uc911 uc624ub958 ubc1cuc0dd:', error);
      throw error;
    }
  },

  /**
   * ud504ub85cud544 uc5c5ub370uc774ud2b8 - uc5f0ub839ub300 ubc0f uc9c0uc5ed ud3ecud568
   * @param {Object} profileData - uc5c5ub370uc774ud2b8ud560 ud504ub85cud544 ub370uc774ud130
   * @param {string} [profileData.nickname] - uc0c8 ub2c9ub124uc784
   * @param {string} [profileData.gender] - uc131ubcc4 ('male', 'female', 'unknown')
   * @param {string} [profileData.age_group] - uc5f0ub839ub300 ('20s', '30s', '40s', '50s')
   * @param {string} [profileData.region] - uc9c0uc5ed (uad6duac00/uc2dcub3c4 ud615uc2dd)
   * @returns {Promise<Object>} uc5c5ub370uc774ud2b8ub41c ud504ub85cud544 uc815ubcf4
   */
  updateProfile: async (profileData) => {
    try {
      const response = await axiosInstance.post('/api/v1/users/update_profile', {
        user: profileData
      });
      return response.data;
    } catch (error) {
      console.error('ud504ub85cud544 uc5c5ub370uc774ud2b8 uc911 uc624ub958 ubc1cuc0dd:', error);
      throw error;
    }
  },

  /**
   * ub2c9ub124uc784 ubcc0uacbd
   * @param {string} nickname - uc0c8 ub2c9ub124uc784
   * @returns {Promise<Object>} ubcc0uacbd uacb0uacfc
   */
  changeNickname: async (nickname) => {
    try {
      const response = await axiosInstance.post('/api/v1/users/change_nickname', {
        nickname
      });
      return response.data;
    } catch (error) {
      console.error('ub2c9ub124uc784 ubcc0uacbd uc911 uc624ub958 ubc1cuc0dd:', error);
      throw error;
    }
  },

  /**
   * ub79cub364 ub2c9ub124uc784 uc0dduc131
   * @returns {Promise<Object>} uc0dduc131ub41c ub2c9ub124uc784
   */
  generateRandomNickname: async () => {
    try {
      const response = await axiosInstance.get('/api/v1/users/random_nickname');
      return response.data;
    } catch (error) {
      console.error('ub79cub364 ub2c9ub124uc784 uc0dduc131 uc911 uc624ub958 ubc1cuc0dd:', error);
      throw error;
    }
  },

  /**
   * ub2e4ub978 uc0acuc6a9uc790 ud504ub85cud544 uac00uc838uc624uae30
   * @param {number} userId - uc0acuc6a9uc790 ID
   * @returns {Promise<Object>} uc0acuc6a9uc790 ud504ub85cud544 uc815ubcf4
   */
  getUserProfile: async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/v1/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('uc0acuc6a9uc790 ud504ub85cud544 uc870ud68c uc911 uc624ub958 ubc1cuc0dd:', error);
      throw error;
    }
  }
};

export default profileService;
