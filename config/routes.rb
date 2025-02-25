require 'sidekiq/web'
Rails.application.routes.draw do
  mount Sidekiq::Web => '/sidekiq'
  
  # 1) 웹용 루트
  root 'pages#home'
  get "purchases/create"
  get "purchases/index"

  # 2) API
  namespace :api do
    post "auth/request_code", to: "auth#request_code"
    post "auth/verify_code",  to: "auth#verify_code"

    resources :broadcasts, only: [:index, :create, :show] do
      member do
        post :reply
      end
    end

    resources :conversations, only: [:index, :show, :destroy] do
      member do
        post :favorite
        post :unfavorite
        post :send_message
      end
    end
  end

  # 3) Users
  resources :users, only: [:index, :create, :show, :update] do
    member do
      post :report
      post :block
      post :unblock
    end
  end

  # 4) 관리자 페이지 (예시)
  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'

end