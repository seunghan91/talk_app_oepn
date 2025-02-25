# app/controllers/api/base_controller.rb
module Api
    class BaseController < ActionController::API
      before_action :authorize_request
      attr_reader :current_user
  
      private
  
      def authorize_request
        header = request.headers['Authorization']
        if header.present?
          token = header.split(' ').last
          decoded = JsonWebToken.decode(token)
          if decoded && decoded[:user_id]
            @current_user = User.find_by(id: decoded[:user_id])
          end
        end
        unless @current_user
          render json: { error: 'Not Authorized' }, status: :unauthorized
        end
      end
    end
  end