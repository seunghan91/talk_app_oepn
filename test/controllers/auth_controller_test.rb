require "test_helper"

class AuthControllerTest < ActionDispatch::IntegrationTest
  test "should get request_code" do
    get auth_request_code_url
    assert_response :success
  end

  test "should get verify_code" do
    get auth_verify_code_url
    assert_response :success
  end
end
