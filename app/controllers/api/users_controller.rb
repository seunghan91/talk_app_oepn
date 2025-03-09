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
  
    # 현재 사용자 정보 조회
    def me
      render json: {
        user: {
          id: current_user.id,
          phone_number: current_user.phone_number,
          nickname: current_user.nickname,
          gender: current_user.gender,
          verified: current_user.verified
        }
      }
    end

    # 닉네임 변경 API
    def change_nickname
      new_nickname = params[:nickname]
      
      return render json: { error: "새 닉네임은 필수입니다." }, status: :bad_request if new_nickname.blank?
      
      # TODO: 추후 결제 시스템이 구현되면 결제 확인 로직을 여기에 추가
      # if !current_user.has_paid_for_nickname_change?
      #   return render json: { error: "닉네임 변경 권한이 없습니다. 결제가 필요합니다." }, status: :payment_required
      # end
      
      # 테스트용 코드: 결제 없이 닉네임 변경 허용 (나중에 수정 필요)
      if current_user.update(nickname: new_nickname)
        render json: {
          message: "닉네임이 변경되었습니다.",
          user: {
            id: current_user.id,
            nickname: current_user.nickname
          }
        }
      else
        render json: { error: current_user.errors.full_messages }, status: :unprocessable_entity
      end
    end
    
    # 랜덤 닉네임 생성 API
    def generate_random_nickname
      random_nickname = NicknameGenerator.generate_unique
      
      render json: {
        nickname: random_nickname
      }
    end
  end
end