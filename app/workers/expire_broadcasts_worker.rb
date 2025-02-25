# app/workers/expire_broadcasts_worker.rb
class ExpireBroadcastsWorker
    include Sidekiq::Worker
    sidekiq_options queue: :default, retry: 0
  
    def perform
      # 6일 만료된 Broadcast 삭제
      Broadcast.where('expired_at < ?', Time.current).destroy_all
    end
  end