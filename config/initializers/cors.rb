# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*' 
    # ↑ 실제로는 'http://localhost:8081' 등으로 제한하는 것이 안전

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
      # ↑ OPTIONS 포함해야 preflight를 처리할 수 있음
  end
end