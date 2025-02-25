# app/models/phone_verification.rb
class PhoneVerification < ApplicationRecord
  validates :phone_number, presence: true
  validates :code, presence: true

  def expired?
    Time.current > self.expires_at
  end
end