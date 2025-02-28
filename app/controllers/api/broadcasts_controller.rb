module Api
  class BroadcastsController < BaseController
    before_action :authorize_request
    # 인증 요청 엔드포인트는 인증 없이 접근 가능하도록 설정
    skip_before_action :authorize_request, only: [:request_code, :verify_code]


    def index
      # 캐싱 적용 (5분 유효)
      @broadcasts = Rails.cache.fetch("broadcasts-recent", expires_in: 5.minutes) do
        Broadcast.where("expired_at > ?", Time.current)
                 .where(active: true)
                 .includes(:user) # N+1 쿼리 문제 해결
                 .order(created_at: :desc)
                 .limit(20)
                 .to_a
      end
      
      render json: @broadcasts, include: { user: { only: [:id, :nickname, :gender] } }
    end

    def create
      @broadcast = current_user.broadcasts.new(active: true)
      @broadcast.voice_file.attach(params[:voice_file]) if params[:voice_file]
      
      if @broadcast.save
        # 캐시 무효화
        Rails.cache.delete("broadcasts-recent")
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