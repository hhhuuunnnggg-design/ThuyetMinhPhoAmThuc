import { fetchAccountAPI, loginAPI, socialLoginAPI, socialLoginCallbackAPI } from "@/api";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import { setAuth } from "@/redux/slice/auth.slice";
import { logger } from "@/utils/logger";
import { Button, Divider, Form, Input, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./login.scss";
import tigerImg from "./tiger.jpg";


interface FieldType {
  email: string;
  password: string;
}

const LoginPage = () => {
  const [isSubmit, setIsSubmit] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /**
   * Handle successful login response
   */
  const handleLoginSuccess = (res: IBackendRes<ILogin>) => {
    if (!res?.data) {
      message.error(res.message || "Đăng nhập thất bại!");
      return;
    }

    if (!res.data.access_token) {
      logger.error("No access_token in response:", res.data);
      message.error("Không nhận được token đăng nhập!");
      return;
    }

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.data.access_token);

    dispatch(
      setAuth({
        isAuthenticated: true,
        user: res.data.user,
      })
    );

    message.success("Đăng nhập thành công!");

    const redirectPath = res.data.user.role ? ROUTES.ADMIN.USER : ROUTES.HOME;
    navigate(redirectPath);
  };

  /**
   * Handle social login callback
   */
  const handleSocialCallback = useCallback(
    async (loginType: "google" | "facebook", code: string) => {
      try {
        setIsSocialLoading(true);
        const res = await socialLoginCallbackAPI(loginType, code);
        
        // Handle success
        if (!res?.data) {
          message.error(res.message || "Đăng nhập thất bại!");
          navigate(ROUTES.LOGIN, { replace: true });
          return;
        }

        if (!res.data.access_token) {
          logger.error("No access_token in response:", res.data);
          message.error("Không nhận được token đăng nhập!");
          navigate(ROUTES.LOGIN, { replace: true });
          return;
        }

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.data.access_token);

        dispatch(
          setAuth({
            isAuthenticated: true,
            user: res.data.user,
          })
        );

        message.success("Đăng nhập thành công!");

        const redirectPath = res.data.user.role ? ROUTES.ADMIN.USER : ROUTES.HOME;
        navigate(redirectPath, { replace: true });
      } catch (error) {
        logger.error("Social login callback error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Đăng nhập thất bại!";
        message.error(errorMessage);
        navigate(ROUTES.LOGIN, { replace: true });
      } finally {
        setIsSocialLoading(false);
      }
    },
    [navigate, dispatch]
  );

  /**
   * Handle OAuth callback from Google/Facebook
   */
  useEffect(() => {
    // Check if redirected from backend with token (successful OAuth login)
    const token = searchParams.get("token");
    const success = searchParams.get("success");

    if (token && success === "true") {
      // Backend đã redirect về với token
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      
      // Fetch user info để lấy thông tin user
      fetchAccountAPI()
        .then((res) => {
          if (res?.data?.user) {
            dispatch(
              setAuth({
                isAuthenticated: true,
                user: res.data.user,
              })
            );
            message.success("Đăng nhập thành công!");
            
            const redirectPath = res.data.user.role ? ROUTES.ADMIN.USER : ROUTES.HOME;
            navigate(redirectPath, { replace: true });
          } else {
            message.error("Không thể lấy thông tin người dùng!");
            navigate(ROUTES.LOGIN, { replace: true });
          }
        })
        .catch((error) => {
          logger.error("Fetch account error:", error);
          message.error("Không thể lấy thông tin người dùng!");
          navigate(ROUTES.LOGIN, { replace: true });
        });
      return;
    }

    // Handle OAuth callback với code (nếu backend chưa redirect)
    const loginType = searchParams.get("login_type");
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      message.error(`Đăng nhập thất bại: ${error}`);
      // Remove error params from URL
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    if (loginType && code && (loginType === "google" || loginType === "facebook")) {
      handleSocialCallback(loginType as "google" | "facebook", code);
    }
  }, [searchParams, navigate, handleSocialCallback, dispatch]);

  /**
   * Handle social login button click
   */
  const handleSocialLogin = (loginType: "google" | "facebook") => {
    try {
      socialLoginAPI(loginType);
    } catch (error) {
      logger.error(`Social login (${loginType}) error:`, error);
      message.error("Không thể chuyển hướng đến trang đăng nhập!");
    }
  };

  /**
   * Handle form submit
   */
  const onFinish = async (values: FieldType) => {
    try {
      setIsSubmit(true);
      const res = await loginAPI(values.email, values.password);

      handleLoginSuccess(res);
    } catch (error) {
      logger.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Đăng nhập thất bại!";
      message.error(errorMessage);
    } finally {
      setIsSubmit(false);
    }
  };

  return (
    <div className="login-page">
      <main className="main">
        <div className="container">
          <section className="wrapper">
            <div className="heading" style={{ textAlign: "center" }}>
              <img
                style={{ width: "150px", height: "150px" }}
                src={tigerImg}
                alt="Tiger"
              />
              <h2 className="text text-large">Đăng Nhập</h2>
              <Divider />
            </div>
            <Form name="login-form" onFinish={onFinish} autoComplete="off">
              <Form.Item<FieldType>
                labelCol={{ span: 24 }}
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Email không được để trống!" },
                  { type: "email", message: "Email không đúng định dạng!" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item<FieldType>
                labelCol={{ span: 24 }}
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: "Mật khẩu không được để trống!" },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmit}
                  block
                >
                  Đăng nhập
                </Button>
              </Form.Item>

              <Divider>Hoặc</Divider>

              <Form.Item>
                <Button
                  type="default"
                  onClick={() => handleSocialLogin("google")}
                  loading={isSocialLoading}
                  block
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g fill="#000" fillRule="evenodd">
                      <path
                        d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
                        fill="#EA4335"
                      />
                      <path
                        d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.18-1.79 2.85l2.75 2.13c1.63-1.5 2.72-3.7 2.72-6.48z"
                        fill="#4285F4"
                      />
                      <path
                        d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.75-2.13c-.76.53-1.78.9-3.21.9-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.45 15.98 5.48 18 9 18z"
                        fill="#34A853"
                      />
                    </g>
                  </svg>
                  Đăng nhập với Google
                </Button>
              </Form.Item>

              <Form.Item>
                <Button
                  type="default"
                  onClick={() => handleSocialLogin("facebook")}
                  loading={isSocialLoading}
                  block
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: "#1877F2",
                    color: "#fff",
                    borderColor: "#1877F2",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#166FE5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1877F2";
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Đăng nhập với Facebook
                </Button>
              </Form.Item>

              <Divider />

              <p className="text text-normal" style={{ textAlign: "center" }}>
                Chưa có tài khoản ?
                <span>
                  <Link to={ROUTES.REGISTER}> Đăng Ký </Link>
                </span>
              </p>
            </Form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
