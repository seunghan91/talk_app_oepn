# app/models/user.rb
class User < ApplicationRecord
  encrypts :phone  # Rails 7 AR 암호화
  enum gender: { unknown: 0, male: 1, female: 2 }, _prefix: :gender
  has_many :broadcasts, dependent: :destroy  # or :nullify, etc. 

end