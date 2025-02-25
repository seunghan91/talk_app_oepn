# app/controllers/api/conversations_controller.rb
module Api
  class ConversationsController < BaseController
    before_action :authorize_request

    def index
      # Ideally:
      broadcasts = Broadcast.where("expired_at > ?", Time.now).order(created_at: :desc).limit(20)
      render json: broadcasts
    end

  def show
    conversation = Conversation.find(params[:id])
    unless participant?(conversation)
      return render json: { error: "권한이 없습니다." }, status: :forbidden
    end

    messages = conversation.messages.order(created_at: :asc)
    render json: { conversation: conversation, messages: messages }
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