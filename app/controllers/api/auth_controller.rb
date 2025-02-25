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
      user = User.find_or_create_by(phone_number: phone_number)
      # JWT 발급
      token = JsonWebToken.encode({ user_id: user.id })
      render json: {
        message: "인증 완료",
        token: token,
        user: {
          id: user.id,
          phone_number: user.phone_number,
          # 등등
        }
      }
    end
  end
end