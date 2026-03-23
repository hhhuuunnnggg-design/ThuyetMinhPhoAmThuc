import { fetchAccountAPI, loginAPI, socialLoginCallbackAPI } from "@/api";
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
