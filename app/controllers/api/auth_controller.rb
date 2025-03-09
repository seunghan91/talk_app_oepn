# app/controllers/api/auth_controller.rb
module Api
  class AuthController < BaseController
    # 회원가입/로그인(전화번호 인증)에는 JWT 없이 접근 가능
    skip_before_action :authorize_request, only: [:request_code, :verify_code]

    def request_code
      phone_number = params[:phone_number]
      # 전화번호 인증코드 생성/발송 로직
      code = rand(100000..999999).to_s
      # 예시로 JSON 응답
      render json: {
        phone_number: phone_number,
        code: code,
        message: "인증코드 발송(테스트)"
      }
    end

    def verify_code
      phone_number = params[:phone_number]
      code = params[:code]
      # 실제 서비스에서는 DB/Redis에서 코드 검증
      # 여기서는 테스트용으로 간단 처리
      # 유저 찾거나 생성
      user = User.find_or_create_by(phone_number: phone_number) do |u|
        # 새 사용자인 경우 닉네임 자동 생성
        u.nickname = NicknameGenerator.generate_unique
      end
      
      # 기존 사용자인데 닉네임이 없는 경우 생성
      if user.nickname.blank?
        user.update(nickname: NicknameGenerator.generate_unique)
      end
      
      # JWT 발급
      token = JsonWebToken.encode({ user_id: user.id })
      render json: {
        message: "인증 완료",
        token: token,
        user: {
          id: user.id,
          phone_number: user.phone_number,
          nickname: user.nickname,
          # 등등
        }
      }
    end
  end
end