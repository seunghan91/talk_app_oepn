module Api
  class BaseController < ActionController::API
    before_action :authorize_request
    attr_reader :current_user
    
    rescue_from StandardError, with: :render_server_error
    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
    rescue_from ApiError::InvalidToken, with: :render_invalid_token
    rescue_from ApiError::TokenExpired, with: :render_token_expired
    rescue_from ApiError::Unauthorized, with: :render_unauthorized
    rescue_from ApiError::ValidationError, with: :render_validation_error
    
    private
    
    def authorize_request
      header = request.headers['Authorization']
      if header.present?
        token = header.split(' ').last
        begin
          decoded = JsonWebToken.decode(token)
          if decoded && decoded[:user_id]
            @current_user = User.find_by(id: decoded[:user_id])
          end
        rescue JWT::ExpiredSignature
          raise ApiError::TokenExpired
        rescue JWT::DecodeError
          raise ApiError::InvalidToken
        end
      end
      
      unless @current_user
        raise ApiError::Unauthorized
      end
    end
    
    def render_server_error(exception)
      if Rails.env.development? || Rails.env.test?
        render json: { 
          error: 'Server error', 
          message: exception.message,
          backtrace: exception.backtrace[0..5]
        }, status: :internal_server_error
      else
        render json: { error: 'Server error' }, status: :internal_server_error
      end
    end
    
    def render_not_found
      render json: { error: 'Resource not found' }, status: :not_found
    end
    
    def render_invalid_token
      render json: { error: 'Invalid token' }, status: :unauthorized
    end
    
    def render_token_expired
      render json: { error: 'Token expired', expired: true }, status: :unauthorized
    end
    
    def render_unauthorized
      render json: { error: 'Unauthorized access' }, status: :unauthorized
    end
    
    def render_validation_error(exception)
      render json: { error: 'Validation error', details: exception.message }, status: :unprocessable_entity
    end
  end
end