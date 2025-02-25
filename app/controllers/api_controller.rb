# app/controllers/api_controller.rb
class ApiController < ActionController::API
    before_action :authorize_request
    # ...
  end