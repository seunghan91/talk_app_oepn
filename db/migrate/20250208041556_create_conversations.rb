class CreateConversations < ActiveRecord::Migration[7.2]
  def change
    create_table :conversations do |t|
      t.bigint :user_a_id, null: false
      t.bigint :user_b_id, null: false
      t.boolean :active, default: true
      t.boolean :favorite, default: false

      t.timestamps
    end

    # user_a_id, user_b_id -> users.id (둘 다 참조)
    add_foreign_key :conversations, :users, column: :user_a_id
    add_foreign_key :conversations, :users, column: :user_b_id
  end
end
