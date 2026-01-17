import { loginAPI } from "@/api";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import { setAuth } from "@/redux/slice/auth.slice";
import { logger } from "@/utils/logger";
import { Button, Divider, Form, Input, message } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import "./login.scss";

interface FieldType {
  email: string;
  password: string;
}

const LoginPage = () => {
  const [isSubmit, setIsSubmit] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = async (values: FieldType) => {
    try {
      setIsSubmit(true);
      const res = await loginAPI(values.email, values.password);

      if (res?.data) {
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

        const redirectPath = res.data.user.role
          ? ROUTES.ADMIN.USER
          : ROUTES.HOME;
        navigate(redirectPath);
      } else {
        message.error(res.message || "Đăng nhập thất bại!");
      }
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
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLKVxAZXs4BY3vho4tvQUv7o5GyTRBGXQ3Ig&s"
                alt=""
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
                <Button type="primary" htmlType="submit" loading={isSubmit}>
                  Đăng nhập
                </Button>
              </Form.Item>
              <Divider>Or</Divider>
              <p className="text text-normal" style={{ textAlign: "center" }}>
                Chưa có tài khoản ?
                <span>
                  <Link to={ROUTES.REGISTER}> Đăng Ký </Link>
                </span>
              </p>
              <br />
            </Form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
