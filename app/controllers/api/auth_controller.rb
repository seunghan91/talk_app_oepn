# app/controllers/api/auth_controller.rb
module Api
  class AuthController < BaseController
    # 회원가입/로그인(전화번호 인증)에는 JWT 없이 접근 가능
    skip_before_action :authorize_request, only: [:request_code, :verify_code]

    def request_code
      phone_number = params[:phone_number]
      
      # 로깅 추가
      Rails.logger.info("인증코드 요청: 전화번호 #{phone_number}")
      
      # 전화번호 형식 검증
      unless phone_number.present? && phone_number.match?(/^\d{3}-\d{3,4}-\d{4}$/)
        Rails.logger.warn("잘못된 전화번호 형식: #{phone_number}")
        return render json: { error: "유효한 전화번호 형식이 아닙니다. (예: 010-1234-5678)" }, status: :bad_request
      end
      
      # 전화번호 인증코드 생성/발송 로직
      code = rand(100000..999999).to_s
      
      # 실제 서비스에서는 SMS 발송 로직 추가
      # SmsService.send_verification(phone_number, code)
      
      # 코드 저장 (실제로는 Redis나 DB에 저장)
      # VerificationCode.create(phone_number: phone_number, code: code, expires_at: 5.minutes.from_now)
      
      # 로깅
      Rails.logger.info("인증코드 생성 완료: 전화번호 #{phone_number}, 코드 #{code}")
      
      # 예시로 JSON 응답
      render json: {
        phone_number: phone_number,
        code: code,
        message: "인증코드가 발송되었습니다. (테스트 환경)"
      }
    end

    def verify_code
      phone_number = params[:phone_number]
      code = params[:code]
      
      # 로깅 추가
      Rails.logger.info("인증코드 확인: 전화번호 #{phone_number}, 코드 #{code}")
      
      # 전화번호 형식 검증
      unless phone_number.present? && phone_number.match?(/^\d{3}-\d{3,4}-\d{4}$/)
        Rails.logger.warn("잘못된 전화번호 형식: #{phone_number}")
        return render json: { error: "유효한 전화번호 형식이 아닙니다." }, status: :bad_request
      end
      
      # 코드 검증 (실제로는 Redis나 DB에서 확인)
      # verification = VerificationCode.find_by(phone_number: phone_number)
      # if verification.nil? || verification.code != code || verification.expires_at < Time.current
      #   return render json: { error: "유효하지 않은 인증코드입니다." }, status: :unauthorized
      # end
      
      # 실제 서비스에서는 DB/Redis에서 코드 검증
      # 여기서는 테스트용으로 간단 처리
      # 유저 찾거나 생성
      user = User.find_or_create_by(phone_number: phone_number) do |u|
        # 새 사용자인 경우 닉네임 자동 생성
        random_nickname = NicknameGenerator.generate_unique
        u.nickname = random_nickname
        Rails.logger.info("새 사용자 생성: 전화번호 #{phone_number}, 닉네임 #{random_nickname}")
      end
      
      # 기존 사용자인데 닉네임이 없는 경우 생성
      if user.nickname.blank?
        random_nickname = NicknameGenerator.generate_unique
        user.update(nickname: random_nickname)
        Rails.logger.info("기존 사용자 닉네임 생성: 전화번호 #{phone_number}, 닉네임 #{random_nickname}")
      end
      
      # JWT 발급
      token = JsonWebToken.encode({ user_id: user.id })
      Rails.logger.info("인증 성공: 사용자 ID #{user.id}, 전화번호 #{phone_number}")
      
      render json: {
        message: "인증이 완료되었습니다.",
        token: token,
        user: {
          id: user.id,
          phone_number: user.phone_number,
          nickname: user.nickname,
          gender: user.gender || "unknown",
          verified: user.verified || false
        }
      }
    end
  end
end