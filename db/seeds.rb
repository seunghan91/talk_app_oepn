# db/seeds.rb

# 가정: User 모델이 있고, conversation, message 테이블 존재
User.create!(phone_number: "01011112222", nickname: "Alice", push_token: nil)
User.create!(phone_number: "01033334444", nickname: "Bob",   push_token: nil)

# 대화방 (Alice & Bob)
conversation = Conversation.create!(user_a_id: 1, user_b_id: 2)

# 메시지 (Alice -> Bob)
Message.create!(
  conversation_id: conversation.id,
  sender_id: 1
  # no content column if you haven't added it, just placeholders
)
Message.create!(
  conversation_id: conversation.id,
  sender_id: 2
)

puts "Seed completed!"