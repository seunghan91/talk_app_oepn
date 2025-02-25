# app/models/broadcast.rb
class Broadcast < ApplicationRecord
    belongs_to :user
  
    # 음성 파일 첨부
    has_one_attached :voice_file
  
    before_create :set_expired_at
  
    private
  
    def set_expired_at
      self.expired_at = 6.days.from_now
    end
  end