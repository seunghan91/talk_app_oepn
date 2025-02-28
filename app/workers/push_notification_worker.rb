# app/workers/push_notification_worker.rb
class PushNotificationWorker
  include Sidekiq::Worker

  # 메시지 ID를 인자로 받아서, 해당 메시지의 푸시를 발송
  def perform(message_id)
    message = Message.find(message_id)
    message.send_push_notification
  end
end