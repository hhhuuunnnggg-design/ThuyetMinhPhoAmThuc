import { loginAPI } from "@/api";
import { ROUTES, STORAGE_KEYS } from "@/constants";
import { setAuth } from "@/redux/slice/auth.slice";
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

      // Check if response has the correct structure
      if (res && res.data) {
       

        // Check if access_token exists
        if (!res.data.access_token) {
          console.error("No access_token in response:", res.data);
          message.error("Không nhận được token đăng nhập!");
          return;
        }

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, res.data.access_token);

        // Update Redux store - context will automatically sync
        dispatch(
          setAuth({
            isAuthenticated: true,
            user: res.data.user,
          })
        );

        message.success("Đăng nhập thành công!");

        // Check user role and redirect accordingly
        if (res.data.user.role) {
          // User has role (admin) - redirect to admin page
          navigate(ROUTES.ADMIN.USER);
        } else {
          navigate(ROUTES.HOME);
        }
      } else {
        message.error(res.message);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      message.error(error.message || "Đăng nhập thất bại!");
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
                labelCol={{ span: 24 }} //whole column
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
                labelCol={{ span: 24 }} //whole column
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
