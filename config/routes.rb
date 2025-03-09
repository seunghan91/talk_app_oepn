require 'sidekiq/web'

Rails.application.routes.draw do
  #mount Rswag::Ui::Engine => '/api-docs'
  #mount Rswag::Api::Engine => '/api-docs'
  # 사이드킥(Sidekiq) 관리자 UI
  mount Sidekiq::Web => '/sidekiq'
  
  # 1) 웹용 루트
  root 'pages#home'
  get "purchases/create"
  get "purchases/index"

  # 2) API
  namespace :api do
    post "auth/request_code", to: "auth#request_code"
    post "auth/verify_code",  to: "auth#verify_code"

    # 사용자 관련 API
    get "me", to: "users#me"
    post "change_nickname", to: "users#change_nickname"
    get "generate_random_nickname", to: "users#generate_random_nickname"

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

    # update_push_token을 컬렉션(collection)으로 선언
    # => 경로: POST /users/update_push_token
    collection do
      post :update_push_token
    end
  end

  # 4) 관리자 페이지 (예시)
  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
end