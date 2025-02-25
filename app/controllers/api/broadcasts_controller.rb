module Api
  class BroadcastsController < BaseController
    before_action :authorize_request

    def index
      # Ideally:
      broadcasts = Broadcast.where("expired_at > ?", Time.now).order(created_at: :desc).limit(20)
      render json: broadcasts
    end

  def create
    # current_user 필요 -> authorize_request
    @broadcast = current_user.broadcasts.new(active: true)
    @broadcast.voice_file.attach(params[:voice_file]) if params[:voice_file]

    if @broadcast.save
      render json: { broadcast: @broadcast }, status: :created
    else
      render json: { errors: @broadcast.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    @broadcast = Broadcast.find(params[:id])
    render json: @broadcast
  end

  def reply
    broadcast = Broadcast.find(params[:id])
    conversation = Conversation.find_or_create_by(
      user_a_id: current_user.id,
      user_b_id: broadcast.user_id
    )
    message = conversation.messages.new(sender_id: current_user.id)
    message.voice_file.attach(params[:voice_file]) if params[:voice_file]

    if message.save
      render json: { message: "답장 완료", conversation_id: conversation.id }, status: :ok
    else
        render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
    end
  end
end