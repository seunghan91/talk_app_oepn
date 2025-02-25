class CreateBroadcasts < ActiveRecord::Migration[7.2]
  def change
    create_table :broadcasts do |t|
      t.references :user, null: false, foreign_key: true
      t.boolean :active, default: true
      t.datetime :expired_at
      t.timestamps
    end
  end
end
