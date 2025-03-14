RailsAdmin.config do |config|
  config.asset_source = :sprockets

  ### Popular gems integration

  ## == Devise ==
  # config.authenticate_with do
  #   warden.authenticate! scope: :user
  # end
  # config.current_user_method(&:current_user)

  ## == CancanCan ==
  # config.authorize_with :cancancan

  ## == Pundit ==
  # config.authorize_with :pundit

  ## == PaperTrail ==
  # config.audit_with :paper_trail, 'User', 'PaperTrail::Version' # PaperTrail >= 3.0.0

  ### More at https://github.com/railsadminteam/rails_admin/wiki/Base-configuration

  ## == Gravatar integration ==
  ## To disable Gravatar integration in Navigation Bar set to false
  # config.show_gravatar = true
  
  # 모델별 필터 설정
  config.model 'User' do
    list do
      filters [:nickname, :phone, :gender, :status, :created_at]
    end
  end
  
  config.model 'Broadcast' do
    list do
      filters [:user, :created_at, :expired_at, :active]
    end
  end
  
  config.model 'Report' do
    list do
      filters [:reporter, :reported, :status, :report_type, :created_at]
    end
  end
  
  # 대시보드 커스터마이징
  config.actions do
    dashboard do
      statistics true
      
      # 대시보드에 통계 추가
      register_instance_option :statistics do
        true
      end
      
      register_instance_option :user_statistics do
        proc do
          {
            total: User.count,
            active: User.where(status: :active).count,
            suspended: User.where(status: :suspended).count,
            banned: User.where(status: :banned).count,
            new_today: User.where('created_at >= ?', Date.today).count
          }
        end
      end
      
      register_instance_option :broadcast_statistics do
        proc do
          {
            total: Broadcast.count,
            active: Broadcast.where(active: true).where('expired_at > ?', Time.current).count,
            expired: Broadcast.where('expired_at <= ?', Time.current).count,
            expiring_soon: Broadcast.where(active: true).where('expired_at > ? AND expired_at <= ?', Time.current, 24.hours.from_now).count,
            new_today: Broadcast.where('created_at >= ?', Date.today).count
          }
        end
      end
      
      register_instance_option :report_statistics do
        proc do
          {
            total: Report.count,
            pending: Report.where(status: :pending).count,
            processing: Report.where(status: :processing).count,
            resolved: Report.where(status: :resolved).count,
            rejected: Report.where(status: :rejected).count,
            new_today: Report.where('created_at >= ?', Date.today).count
          }
        end
      end
    end
    
    index                         # mandatory
    new
    export
    bulk_delete
    show
    edit
    delete
    show_in_app
    
    # 사용자 관련 커스텀 액션
    member :suspend do
      only 'User'
      i18n_key :suspend
      register_instance_option :link_icon do
        'icon-ban-circle'
      end
      register_instance_option :visible? do
        bindings[:object].class == User && !bindings[:object].status_suspended?
      end
      register_instance_option :controller do
        proc do
          @object.update(status: :suspended)
          
          # 정지 알림 전송
          PushNotificationWorker.perform_async('suspension', @object.id, "관리자에 의한 계정 정지")
          
          flash[:notice] = "사용자가 정지되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    member :activate do
      only 'User'
      i18n_key :activate
      register_instance_option :link_icon do
        'icon-ok'
      end
      register_instance_option :visible? do
        bindings[:object].class == User && (bindings[:object].status_suspended? || bindings[:object].status_banned?)
      end
      register_instance_option :controller do
        proc do
          @object.update(status: :active)
          flash[:notice] = "사용자가 활성화되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    member :ban do
      only 'User'
      i18n_key :ban
      register_instance_option :link_icon do
        'icon-remove'
      end
      register_instance_option :visible? do
        bindings[:object].class == User && !bindings[:object].status_banned?
      end
      register_instance_option :controller do
        proc do
          @object.update(status: :banned)
          
          # 차단 알림 전송
          PushNotificationWorker.perform_async('suspension', @object.id, "관리자에 의한 영구 차단")
          
          flash[:notice] = "사용자가 영구 차단되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    member :reset_reports do
      only 'User'
      i18n_key :reset_reports
      register_instance_option :link_icon do
        'icon-refresh'
      end
      register_instance_option :visible? do
        bindings[:object].class == User && bindings[:object].reports_as_reported.any?
      end
      register_instance_option :controller do
        proc do
          @object.reports_as_reported.destroy_all
          flash[:notice] = "신고 내역이 초기화되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    # 브로드캐스트 관련 커스텀 액션
    member :deactivate do
      only 'Broadcast'
      i18n_key :deactivate
      register_instance_option :link_icon do
        'icon-remove'
      end
      register_instance_option :visible? do
        bindings[:object].class == Broadcast && bindings[:object].active?
      end
      register_instance_option :controller do
        proc do
          @object.update(active: false)
          flash[:notice] = "브로드캐스트가 비활성화되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    member :activate_broadcast do
      only 'Broadcast'
      i18n_key :activate_broadcast
      register_instance_option :link_icon do
        'icon-ok'
      end
      register_instance_option :visible? do
        bindings[:object].class == Broadcast && !bindings[:object].active?
      end
      register_instance_option :controller do
        proc do
          @object.update(active: true)
          flash[:notice] = "브로드캐스트가 활성화되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    member :extend_expiry do
      only 'Broadcast'
      i18n_key :extend_expiry
      register_instance_option :link_icon do
        'icon-time'
      end
      register_instance_option :controller do
        proc do
          @object.update(expired_at: 6.days.from_now)
          flash[:notice] = "브로드캐스트 만료일이 연장되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    # 신고 관련 커스텀 액션
    member :mark_as_processing do
      only 'Report'
      i18n_key :mark_as_processing
      register_instance_option :link_icon do
        'icon-time'
      end
      register_instance_option :visible? do
        bindings[:object].class == Report && bindings[:object].status_pending?
      end
      register_instance_option :controller do
        proc do
          @object.update(status: :processing)
          flash[:notice] = "신고가 처리 중으로 변경되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    member :mark_as_resolved do
      only 'Report'
      i18n_key :mark_as_resolved
      register_instance_option :link_icon do
        'icon-ok'
      end
      register_instance_option :visible? do
        bindings[:object].class == Report && !bindings[:object].status_resolved?
      end
      register_instance_option :controller do
        proc do
          @object.update(status: :resolved)
          flash[:notice] = "신고가 해결됨으로 변경되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    member :mark_as_rejected do
      only 'Report'
      i18n_key :mark_as_rejected
      register_instance_option :link_icon do
        'icon-remove'
      end
      register_instance_option :visible? do
        bindings[:object].class == Report && !bindings[:object].status_rejected?
      end
      register_instance_option :controller do
        proc do
          @object.update(status: :rejected)
          flash[:notice] = "신고가 거부됨으로 변경되었습니다."
          redirect_to back_or_index
        end
      end
    end
    
    member :suspend_reported_user do
      only 'Report'
      i18n_key :suspend_reported_user
      register_instance_option :link_icon do
        'icon-ban-circle'
      end
      register_instance_option :visible? do
        bindings[:object].class == Report && !bindings[:object].reported.status_suspended? && !bindings[:object].reported.status_banned?
      end
      register_instance_option :controller do
        proc do
          @object.reported.update(status: :suspended)
          @object.update(status: :resolved)
          flash[:notice] = "신고된 사용자가 정지되었습니다."
          redirect_to back_or_index
        end
      end
    end

    ## With an audit adapter, you can add:
    # history_index
    # history_show
  end
end
