# app/models/block.rb
class Block < ApplicationRecord
    belongs_to :blocker, class_name: 'User', foreign_key: :blocker_id
    belongs_to :blocked, class_name: 'User', foreign_key: :blocked_id
  end