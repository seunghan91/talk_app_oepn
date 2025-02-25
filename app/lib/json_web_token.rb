# app/lib/json_web_token.rb 또는 app/services/json_web_token.rb
module JsonWebToken
    SECRET_KEY = Rails.application.credentials.secret_key_base.to_s
  
    def self.encode(payload, exp = 24.hours.from_now)
      payload[:exp] = exp.to_i
      JWT.encode(payload, SECRET_KEY)
    end
  
    def self.decode(token)
      body = JWT.decode(token, SECRET_KEY)[0]
      HashWithIndifferentAccess.new(body)
    rescue JWT::DecodeError => e
      # 필요한 에러 처리를 해주세요.
      nil
    end
  end