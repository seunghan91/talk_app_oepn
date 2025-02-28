# app/controllers/api/conversations_controller.rb
module Api
  class ConversationsController < BaseController
    before_action :authorize_request

    # 인증 요청 엔드포인트는 인증 없이 접근 가능하도록 설정
    skip_before_action :authorize_request, only: [:request_code, :verify_code]

    def index
      # 사용자별 대화 목록 캐싱 (1분 유효)
      @conversations = Rails.cache.fetch("conversations-user-#{current_user.id}", expires_in: 1.minute) do
        Conversation.where("user_a_id = ? OR user_b_id = ?", current_user.id, current_user.id)
                    .order(updated_at: :desc)
                    .includes(:user_a, :user_b)
                    .to_a
      end
      
      render json: @conversations, include: {
        user_a: { only: [:id, :nickname, :gender] },
        user_b: { only: [:id, :nickname, :gender] }
      }
    end

    def show
      conversation = Conversation.find(params[:id])
      unless participant?(conversation)
        return render json: { error: "권한이 없습니다." }, status: :forbidden
      end
      
      # 대화별 메시지 캐싱 (30초 유효)
      messages = Rails.cache.fetch("conversation-messages-#{conversation.id}", expires_in: 30.seconds) do
        conversation.messages.order(created_at: :asc).includes(:sender).to_a
      end
      
      render json: { 
        conversation: conversation,
        messages: messages.as_json(include: { sender: { only: [:id, :nickname] } })
      }
    end

  def destroy
    conversation = Conversation.find(params[:id])
    if participant?(conversation)
      conversation.destroy
      render json: { message: "대화방이 삭제되었습니다." }
    else
      render json: { error: "권한이 없습니다." }, status: :forbidden
    end
  end

  def favorite
    conversation = Conversation.find(params[:id])
    return head :forbidden unless participant?(conversation)

    conversation.update(favorite: true)
    render json: { message: "즐겨찾기 등록 완료" }
  end

  def unfavorite
    conversation = Conversation.find(params[:id])
    return head :forbidden unless participant?(conversation)

    conversation.update(favorite: false)
    render json: { message: "즐겨찾기 해제 완료" }
    
  end

  def send_message
    conversation = Conversation.find(params[:id])
    return head :forbidden unless participant?(conversation)
    
    message = conversation.messages.new(sender_id: @current_user.id)
    message.voice_file.attach(params[:voice_file]) if params[:voice_file]
    
    if message.save
      # conversation.touch → updated_at 갱신
      conversation.touch
      
      # 캐시 무효화
      Rails.cache.delete("conversation-messages-#{conversation.id}")
      Rails.cache.delete("conversations-user-#{current_user.id}")
      
      # 상대방의 대화 목록 캐시도 무효화
      other_user_id = (conversation.user_a_id == current_user.id) ? conversation.user_b_id : conversation.user_a_id
      Rails.cache.delete("conversations-user-#{other_user_id}")
      
      # 비동기 메시지 전송 처리
      MessageDeliveryWorker.perform_async(message.id)
      
      render json: { message: "메시지 전송 완료", message_id: message.id }, status: :ok
    else
      render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def participant?(conversation)
    [conversation.user_a_id, conversation.user_b_id].include?(current_user.id)
  end
end