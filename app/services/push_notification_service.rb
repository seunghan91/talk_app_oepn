# app/services/push_notification_service.rb
class PushNotificationService
  # Expo Push Notification 서비스 URL
  EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'.freeze
  
  # 푸시 알림 전송
  def send_notification(tokens, title, body, data = {})
    return if tokens.blank?
    
    # 토큰이 배열이 아니면 배열로 변환
    tokens = [tokens] unless tokens.is_a?(Array)
    
    # 유효한 토큰만 필터링
    valid_tokens = tokens.compact.select { |token| valid_expo_token?(token) }
    return if valid_tokens.empty?
    
    # 푸시 알림 메시지 구성
    messages = valid_tokens.map do |token|
      {
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: data
      }
    end
    
    # 로깅
    Rails.logger.info("푸시 알림 전송: #{messages.to_json}")
    
    # HTTP 요청 전송
    begin
      response = HTTParty.post(
        EXPO_PUSH_URL,
        body: messages.to_json,
        headers: {
          'Content-Type' => 'application/json',
          'Accept' => 'application/json'
        }
      )
      
      # 응답 로깅
      Rails.logger.info("푸시 알림 응답: #{response.body}")
      
      # 응답 파싱
      result = JSON.parse(response.body)
      
      # 오류 확인
      if result['errors'] && result['errors'].any?
        Rails.logger.error("푸시 알림 오류: #{result['errors']}")
      end
      
      result
    rescue => e
      Rails.logger.error("푸시 알림 전송 실패: #{e.message}")
      { error: e.message }
    end
  end
  
  # 브로드캐스트 답장 알림
  def send_broadcast_reply_notification(broadcast, sender)
    return unless broadcast.user.expo_push_token.present?
    
    send_notification(
      broadcast.user.expo_push_token,
      '브로드캐스트 답장',
      "#{sender.nickname}님이 당신의 브로드캐스트에 답장했습니다.",
      {
        type: 'broadcast_reply',
        broadcast_id: broadcast.id,
        sender_id: sender.id,
        sender_nickname: sender.nickname
      }
    )
  end
  
  # 새 메시지 알림
  def send_new_message_notification(message)
    conversation = message.conversation
    sender = message.sender
    
    # 수신자 결정
    receiver_id = (conversation.user_a_id == sender.id) ? conversation.user_b_id : conversation.user_a_id
    receiver = User.find_by(id: receiver_id)
    
    return unless receiver&.expo_push_token.present?
    
    send_notification(
      receiver.expo_push_token,
      '새 메시지',
      "#{sender.nickname}님으로부터 새 메시지가 도착했습니다.",
      {
        type: 'new_message',
        conversation_id: conversation.id,
        sender_id: sender.id,
        sender_nickname: sender.nickname
      }
    )
  end
  
  # 사용자 정지 알림
  def send_suspension_notification(user, reason = nil)
    return unless user.expo_push_token.present?
    
    message = reason.present? ? "계정이 정지되었습니다. 사유: #{reason}" : "계정이 정지되었습니다."
    
    send_notification(
      user.expo_push_token,
      '계정 정지 알림',
      message,
      {
        type: 'account_suspension',
        reason: reason
      }
    )
  end
  
  # 새 브로드캐스트 알림 (설정에 따라 전송)
  def send_new_broadcast_notification(broadcast, recipients)
    return if recipients.empty?
    
    # 푸시 알림 설정이 켜져 있는 사용자만 필터링
    valid_recipients = recipients.select { |user| user.expo_push_token.present? && user.push_enabled? }
    return if valid_recipients.empty?
    
    tokens = valid_recipients.map(&:expo_push_token)
    
    send_notification(
      tokens,
      '새 브로드캐스트',
      "#{broadcast.user.nickname}님이 새 브로드캐스트를 게시했습니다.",
      {
        type: 'new_broadcast',
        broadcast_id: broadcast.id,
        user_id: broadcast.user.id,
        user_nickname: broadcast.user.nickname
      }
    )
  end
  
  private
  
  # Expo 푸시 토큰 유효성 검사
  def valid_expo_token?(token)
    token.present? && token.start_with?('ExponentPushToken[')
  end
end 