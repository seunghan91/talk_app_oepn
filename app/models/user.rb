# app/models/user.rb
class User < ApplicationRecord
  encrypts :phone  # Rails 7 AR 암호화

  enum :gender, { unknown: 0, male: 1, female: 2 }, prefix: true
  has_many :broadcasts, dependent: :destroy

  # DB에 push_token 칼럼이 있다면, 
  # 굳이 attribute 선언 없이도 Rails가 string 타입을 자동 인식합니다.
  # 하지만 명시적으로 쓰고 싶다면:
  # attribute :push_token, :string
end