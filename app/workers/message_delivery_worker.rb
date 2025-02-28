class MessageDeliveryWorker
    include Sidekiq::Worker
    sidekiq_options queue: :messages, retry: 3
    
    def perform(message_id)
      message = Message.find_by(id: message_id)
      return unless message
      
      conversation = message.conversation
      receiver_id = (conversation.user_a_id == message.sender_id) ? conversation.user_b_id : conversation.user_a_id
      receiver = User.find_by(id: receiver_id)
      
      return unless receiver
      
      # 여기서 푸시 알림 또는 다른 비동기 작업 처리
      # 예: FCM을 통한 푸시 알림 전송
      # FCMService.new.send_notification(
      #   receiver.fcm_token,
      #   title: "새 메시지 도착",
      #   body: "#{message.sender.nickname}님으로부터 새 메시지가 도착했습니다.",
      #   data: { conversation_id: conversation.id }
      # )
      
      # 메시지 처리 완료 후 상태 업데이트
      message.update(processed: true) if message.respond_to?(:processed)
    end
  end