# app/controllers/api/users_controller.rb
module Api
  class UsersController < BaseController
    # before_action :authorize_request, except: [:some_public_method]
    
    def update_push_token
      # 클라이언트에서 { token: "ExponentPushToken[...]" } 형태로 POST 요청
      push_token = params[:token]
      if push_token.blank?
        return render json: { error: "No push token provided" }, status: :bad_request
      end

      # 현재 로그인된 유저(@current_user) 기준 (JWT 인증)
      @current_user.expo_push_token = push_token
      if @current_user.save
        render json: { message: "푸시 토큰이 저장되었습니다." }, status: :ok
      else
        render json: { errors: @current_user.errors.full_messages }, status: :unprocessable_entity
      end
    end
  
      # ...
    end
  end